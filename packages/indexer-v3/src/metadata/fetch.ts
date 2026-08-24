import { decodeLsp29Metadata } from '@chillwhales/lsp29';
import { Buffer } from 'node:buffer';
import { lookup } from 'node:dns/promises';
import { request as requestHttp, type IncomingHttpHeaders, type IncomingMessage } from 'node:http';
import { request as requestHttps } from 'node:https';
import { BlockList, isIP, type LookupFunction } from 'node:net';
import { bytesToHex, keccak256, toHex } from 'viem';
import { z } from 'zod';
import { METADATA_MAX_SOURCE_LOCATIONS, type MetadataSource } from './source.js';

const KECCAK256_UTF8_METHOD_ID = '0x6f357c6a';
const KECCAK256_BYTES_METHOD_ID = '0x8019f9b1';
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const MetadataRecordSchema = z.record(z.string(), z.unknown());
const Lsp3MetadataSchema = z.object({ LSP3Profile: MetadataRecordSchema }).passthrough();
const Lsp4MetadataSchema = z.object({ LSP4Metadata: MetadataRecordSchema }).passthrough();

const BLOCKED_IPV4_ADDRESSES = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  BLOCKED_IPV4_ADDRESSES.addSubnet(network, prefix, 'ipv4');
}
const BLOCKED_IPV6_ADDRESSES = new BlockList();
for (const [network, prefix] of [
  ['::', 96],
  ['::ffff:0:0', 96],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['100:0:0:1::', 64],
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
  ['5f00::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
] as const) {
  BLOCKED_IPV6_ADDRESSES.addSubnet(network, prefix, 'ipv6');
}

export interface MetadataDnsAddress {
  address: string;
  family: 4 | 6;
}

export type MetadataLookup = (hostname: string) => Promise<readonly MetadataDnsAddress[]>;

export interface MetadataRequestOptions {
  deadline: number;
  maxResponseBytes: number;
}

export type MetadataRequestImplementation = (
  url: URL,
  address: MetadataDnsAddress,
  options: MetadataRequestOptions,
) => Promise<Response>;

export interface MetadataFetchConfig {
  ipfsGateways: readonly string[];
  allowHttp: boolean;
  requestTimeoutMs: number;
  maxResponseBytes: number;
  maxRedirects: number;
  requestImplementation?: MetadataRequestImplementation;
  lookupImplementation?: MetadataLookup;
}

export type MetadataFetchResult =
  | {
      ok: true;
      content: Record<string, unknown>;
      contentUri: string;
      contentHash: string;
      contentType: string | null;
      contentLength: number;
      durationMs: number;
    }
  | { ok: false; error: string; retryable: boolean; durationMs: number };

interface MetadataBody {
  body: Uint8Array;
  contentType: string | null;
}

interface MetadataRequestCandidate {
  contentUri: string;
  requestUrl: string;
}

class MetadataRequestError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'MetadataRequestError';
    this.retryable = retryable;
  }
}

function isBlockedIpAddress(address: string, family: number): boolean {
  if (family === 4) return BLOCKED_IPV4_ADDRESSES.check(address, 'ipv4');
  if (family === 6) return BLOCKED_IPV6_ADDRESSES.check(address, 'ipv6');
  return true;
}

async function defaultLookup(hostname: string): Promise<readonly MetadataDnsAddress[]> {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.flatMap(({ address, family }) =>
    family === 4 || family === 6 ? [{ address, family }] : [],
  );
}

function assertPublicHttpUrl(value: string, allowHttp: boolean): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new MetadataRequestError('Metadata request URL is malformed', false);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new MetadataRequestError('Metadata request URL must use HTTP or HTTPS', false);
  }
  if (url.username !== '' || url.password !== '') {
    throw new MetadataRequestError('Metadata request URL must not contain credentials', false);
  }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new MetadataRequestError('Metadata request URL targets a local hostname', false);
  }
  const ipVersion = isIP(hostname);
  if (ipVersion !== 0 && isBlockedIpAddress(hostname, ipVersion)) {
    throw new MetadataRequestError('Metadata request URL targets a non-public IP address', false);
  }
  if (url.protocol === 'http:' && !allowHttp) {
    throw new MetadataRequestError('Plain HTTP metadata requests are disabled', false);
  }
  return url;
}

async function resolvePublicAddresses(
  url: URL,
  lookupImplementation: MetadataLookup,
): Promise<readonly MetadataDnsAddress[]> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const literalFamily = isIP(hostname);
  if (literalFamily === 4 || literalFamily === 6) {
    return [{ address: hostname, family: literalFamily }];
  }
  const resolved = await lookupImplementation(hostname);
  if (resolved.length === 0) {
    throw new MetadataRequestError('Metadata hostname resolved without an IP address', true);
  }

  const addresses = new Map<string, MetadataDnsAddress>();
  for (const result of resolved) {
    const actualFamily = isIP(result.address);
    if (actualFamily !== result.family || (actualFamily !== 4 && actualFamily !== 6)) {
      throw new MetadataRequestError('Metadata hostname returned an invalid DNS answer', false);
    }
    if (isBlockedIpAddress(result.address, result.family)) {
      throw new MetadataRequestError(
        'Metadata hostname resolves to a non-public IP address',
        false,
      );
    }
    addresses.set(`${result.family}:${result.address}`, result);
  }
  return [...addresses.values()];
}

async function withRequestDeadline<T>(operation: Promise<T>, deadline: number): Promise<T> {
  const remainingMs = Math.ceil(deadline - performance.now());
  if (remainingMs <= 0) {
    throw new MetadataRequestError('Metadata request timed out', true);
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new MetadataRequestError('Metadata request timed out', true)),
          remainingMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function validateIpfsLocation(value: string): string {
  const withoutFragment = value.split('#', 1)[0] ?? '';
  const path = withoutFragment.split('?', 1)[0] ?? '';
  if (path.length === 0 || path.startsWith('/') || path.includes('\\')) {
    throw new MetadataRequestError('IPFS metadata URI is malformed', false);
  }
  for (const segment of path.split('/')) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      throw new MetadataRequestError('IPFS metadata URI is malformed', false);
    }
    if (
      decoded === '' ||
      decoded === '.' ||
      decoded === '..' ||
      decoded.includes('/') ||
      decoded.includes('\\') ||
      containsControlCharacter(decoded)
    ) {
      throw new MetadataRequestError('IPFS metadata URI is malformed', false);
    }
  }
  return withoutFragment;
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/** Resolve an IPFS URI through one configured gateway, enforcing the HTTP transport policy. */
export function resolveMetadataRequestUrl(
  contentUri: string,
  ipfsGateway: string,
  allowHttp = false,
): string {
  if (!contentUri.toLowerCase().startsWith('ipfs://')) {
    return assertPublicHttpUrl(contentUri, allowHttp).toString();
  }
  const location = validateIpfsLocation(contentUri.slice('ipfs://'.length));
  const gateway = assertPublicHttpUrl(ipfsGateway, allowHttp);
  if (gateway.search !== '' || gateway.hash !== '') {
    throw new MetadataRequestError(
      'IPFS metadata gateway must not contain a query or fragment',
      false,
    );
  }
  const base = gateway.toString().replace(/\/+$/, '');
  return assertPublicHttpUrl(`${base}/${location}`, allowHttp).toString();
}

function assertAdvertisedLength(value: string | null, maximum: number): void {
  if (value == null) return;
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > maximum) {
    throw new MetadataRequestError(
      `Metadata response declares ${parsed} bytes; maximum is ${maximum}`,
      false,
    );
  }
}

function combineChunks(chunks: readonly Uint8Array[], length: number): Uint8Array {
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function readBoundedBody(response: Response, maximum: number): Promise<Uint8Array> {
  if (response.body == null) throw new MetadataRequestError('Metadata response has no body', true);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    assertAdvertisedLength(response.headers.get('content-length'), maximum);
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > maximum) {
        throw new MetadataRequestError(
          `Metadata response exceeded the ${maximum}-byte maximum`,
          false,
        );
      }
      chunks.push(next.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  return combineChunks(chunks, length);
}

function createPinnedLookup(address: MetadataDnsAddress): LookupFunction {
  return (_hostname, _options, callback): void => {
    callback(null, address.address, address.family);
  };
}

function createResponseHeaders(values: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(values)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else {
      headers.set(name, value);
    }
  }
  return headers;
}

async function readBoundedIncomingBody(
  response: IncomingMessage,
  maximum: number,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    assertAdvertisedLength(response.headers['content-length'] ?? null, maximum);
    for await (const chunk of response) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      length += bytes.byteLength;
      if (length > maximum) {
        throw new MetadataRequestError(
          `Metadata response exceeded the ${maximum}-byte maximum`,
          false,
        );
      }
      chunks.push(bytes);
    }
  } catch (error) {
    response.destroy();
    throw error;
  }
  return combineChunks(chunks, length);
}

async function discardResponseBody(response: Response): Promise<void> {
  if (response.body == null) return;
  await response.body.cancel().catch(() => undefined);
}

/**
 * Open one socket through a prevalidated address while retaining the original hostname for Host,
 * SNI, and certificate validation. Disabling pooling prevents later reuse across DNS decisions.
 */
async function requestPinnedAddress(
  url: URL,
  address: MetadataDnsAddress,
  options: MetadataRequestOptions,
): Promise<Response> {
  const remainingMs = Math.ceil(options.deadline - performance.now());
  if (remainingMs <= 0) throw new MetadataRequestError('Metadata request timed out', true);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), remainingMs);
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const requestOptions = {
    protocol: url.protocol,
    hostname,
    port: url.port || undefined,
    path: `${url.pathname}${url.search}`,
    method: 'GET',
    headers: {
      accept: 'application/json, application/*+json;q=0.9, text/plain;q=0.5',
      'user-agent': 'lsp-indexer-v3-metadata/3',
    },
    lookup: createPinnedLookup(address),
    signal: abortController.signal,
    agent: false,
  };

  try {
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      const request =
        url.protocol === 'https:'
          ? requestHttps(
              {
                ...requestOptions,
                servername: isIP(hostname) === 0 ? hostname : '',
              },
              resolve,
            )
          : requestHttp(requestOptions, resolve);
      request.once('error', reject);
      request.end();
    });
    const status = response.statusCode;
    if (status == null || status < 200 || status > 599) {
      response.destroy();
      throw new MetadataRequestError('Metadata server returned an invalid HTTP status', true);
    }
    const headers = createResponseHeaders(response.headers);
    const shouldReadBody = status >= 200 && status < 300 && status !== 204 && status !== 205;
    const body = shouldReadBody
      ? await readBoundedIncomingBody(response, options.maxResponseBytes)
      : null;
    if (!shouldReadBody) response.destroy();
    const responseBody = body == null ? null : new Uint8Array(body).buffer;
    return new Response(responseBody, { status, headers });
  } catch (error) {
    if (abortController.signal.aborted) {
      throw new MetadataRequestError('Metadata request timed out', true);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestResolvedUrl(
  url: URL,
  config: MetadataFetchConfig,
  deadline: number,
): Promise<Response> {
  const lookupImplementation = config.lookupImplementation ?? defaultLookup;
  const addresses = await withRequestDeadline(
    resolvePublicAddresses(url, lookupImplementation),
    deadline,
  );
  const requestImplementation = config.requestImplementation ?? requestPinnedAddress;
  let lastError: unknown;
  for (const address of addresses) {
    try {
      return await withRequestDeadline(
        requestImplementation(url, address, {
          deadline,
          maxResponseBytes: config.maxResponseBytes,
        }),
        deadline,
      );
    } catch (error) {
      if (error instanceof MetadataRequestError) throw error;
      lastError = error;
    }
  }
  throw normalizeRequestError(lastError, 'Metadata request had no public destination', true);
}

async function fetchResponse(
  requestUrl: string,
  config: MetadataFetchConfig,
): Promise<MetadataBody> {
  const deadline = performance.now() + config.requestTimeoutMs;
  let current = assertPublicHttpUrl(requestUrl, config.allowHttp);
  for (let redirect = 0; redirect <= config.maxRedirects; redirect++) {
    const response = await requestResolvedUrl(current, config, deadline);
    if (REDIRECT_STATUSES.has(response.status)) {
      await discardResponseBody(response);
      if (redirect === config.maxRedirects) {
        throw new MetadataRequestError('Metadata response exceeded the redirect limit', false);
      }
      const location = response.headers.get('location');
      if (location == null) {
        throw new MetadataRequestError('Metadata redirect omitted its location', false);
      }
      current = assertPublicHttpUrl(new URL(location, current).toString(), config.allowHttp);
      continue;
    }
    if (!response.ok) {
      await discardResponseBody(response);
      throw new MetadataRequestError(
        `Metadata request failed with HTTP ${response.status}`,
        RETRYABLE_HTTP_STATUSES.has(response.status) || response.status >= 500,
      );
    }
    const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim() || null;
    return { body: await readBoundedBody(response, config.maxResponseBytes), contentType };
  }
  throw new MetadataRequestError('Metadata response exceeded the redirect limit', false);
}

function decodeDataUri(value: string, maximum: number): MetadataBody {
  const separator = value.indexOf(',');
  if (separator < 'data:'.length) {
    throw new MetadataRequestError('Metadata data URI is malformed', false);
  }
  const descriptor = value.slice('data:'.length, separator);
  const parts = descriptor.split(';');
  const mediaType = parts[0]?.trim().toLowerCase() || 'text/plain';
  const base64 = parts.at(-1)?.toLowerCase() === 'base64';
  const payload = value.slice(separator + 1);
  let body: Uint8Array;
  try {
    if (base64) {
      if (
        payload.length % 4 !== 0 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload)
      ) {
        throw new Error('invalid base64');
      }
      body = Buffer.from(payload, 'base64');
    } else {
      body = new TextEncoder().encode(decodeURIComponent(payload));
    }
  } catch {
    throw new MetadataRequestError('Metadata data URI has invalid encoding', false);
  }
  if (body.byteLength > maximum) {
    throw new MetadataRequestError(`Metadata response exceeded the ${maximum}-byte maximum`, false);
  }
  return { body, contentType: mediaType };
}

function parseMetadataContent(source: MetadataSource, text: string): Record<string, unknown> {
  if (source.kind === 'lsp29_encrypted_asset') {
    return decodeLsp29Metadata(text);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new MetadataRequestError('Metadata response is not valid JSON', false);
  }
  if (source.kind === 'lsp3_profile') {
    const result = Lsp3MetadataSchema.safeParse(parsed);
    if (!result.success) {
      throw new MetadataRequestError('Metadata response does not contain LSP3Profile', false);
    }
    return result.data;
  }
  if (source.kind === 'lsp4_asset' || source.kind === 'lsp4_token') {
    const result = Lsp4MetadataSchema.safeParse(parsed);
    if (!result.success) {
      throw new MetadataRequestError('Metadata response does not contain LSP4Metadata', false);
    }
    return result.data;
  }
  throw new MetadataRequestError(`Unsupported metadata kind ${source.kind}`, false);
}

function readErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error == null || !('code' in error)) return null;
  return typeof error.code === 'string' ? error.code.toLowerCase() : null;
}

function isRetryableFetchError(error: unknown): boolean {
  if (error instanceof MetadataRequestError) return error.retryable;
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === 'TimeoutError') return true;
  return [
    'econnaborted',
    'econnrefused',
    'econnreset',
    'ehostunreach',
    'enetunreach',
    'enotfound',
    'eproto',
    'etimedout',
    'eai_again',
  ].includes(readErrorCode(error) ?? '');
}

function normalizeRequestError(error: unknown, fallback: string, retryable: boolean): Error {
  if (error instanceof Error) return error;
  return new MetadataRequestError(typeof error === 'string' ? error : fallback, retryable);
}

function requestCandidates(
  source: MetadataSource,
  config: MetadataFetchConfig,
): MetadataRequestCandidate[] {
  if (
    source.contentUris.length === 0 ||
    source.contentUris.length > METADATA_MAX_SOURCE_LOCATIONS
  ) {
    throw new MetadataRequestError(
      `Metadata source must contain between 1 and ${METADATA_MAX_SOURCE_LOCATIONS} locations`,
      false,
    );
  }
  const candidates: MetadataRequestCandidate[] = [];
  for (const contentUri of source.contentUris) {
    if (!contentUri.toLowerCase().startsWith('ipfs://')) {
      candidates.push({ contentUri, requestUrl: contentUri });
      continue;
    }
    if (config.ipfsGateways.length === 0) {
      throw new MetadataRequestError('At least one IPFS metadata gateway is required', false);
    }
    for (const gateway of config.ipfsGateways) {
      candidates.push({
        contentUri,
        requestUrl: resolveMetadataRequestUrl(contentUri, gateway, config.allowHttp),
      });
    }
  }
  return candidates;
}

async function fetchAndValidateMetadata(
  source: MetadataSource,
  config: MetadataFetchConfig,
  candidate: MetadataRequestCandidate,
): Promise<Omit<Extract<MetadataFetchResult, { ok: true }>, 'durationMs'>> {
  const fetched = candidate.contentUri.toLowerCase().startsWith('data:')
    ? decodeDataUri(candidate.contentUri, config.maxResponseBytes)
    : await fetchResponse(candidate.requestUrl, config);
  if (fetched.contentType === 'text/html') {
    throw new MetadataRequestError('Metadata response returned HTML instead of JSON', false);
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(fetched.body);
  } catch {
    throw new MetadataRequestError('Metadata response is not valid UTF-8', false);
  }
  const bytesHash = keccak256(bytesToHex(fetched.body));
  const contentHash =
    source.verificationMethod === KECCAK256_UTF8_METHOD_ID ? keccak256(toHex(text)) : bytesHash;
  if (
    source.verificationMethod != null &&
    source.verificationMethod !== KECCAK256_BYTES_METHOD_ID &&
    source.verificationMethod !== KECCAK256_UTF8_METHOD_ID
  ) {
    throw new MetadataRequestError(
      `Unsupported metadata verification method ${source.verificationMethod}`,
      false,
    );
  }
  if (
    source.contentHash != null &&
    contentHash.toLowerCase() !== source.contentHash.toLowerCase()
  ) {
    throw new MetadataRequestError('Metadata content hash does not match the chain source', false);
  }
  return {
    ok: true,
    content: parseMetadataContent(source, text),
    contentUri: candidate.contentUri,
    contentHash,
    contentType: fetched.contentType,
    contentLength: fetched.body.byteLength,
  };
}

/** Fetch, bound, verify, and parse one current metadata source. */
export async function fetchMetadata(
  source: MetadataSource,
  config: MetadataFetchConfig,
): Promise<MetadataFetchResult> {
  const startedAt = performance.now();
  try {
    let lastError: unknown;
    let retryable = false;
    for (const candidate of requestCandidates(source, config)) {
      try {
        return {
          ...(await fetchAndValidateMetadata(source, config, candidate)),
          durationMs: performance.now() - startedAt,
        };
      } catch (error) {
        lastError = error;
        retryable ||= isRetryableFetchError(error);
      }
    }
    const normalized = normalizeRequestError(
      lastError,
      'Metadata request had no source URL',
      retryable,
    );
    throw new MetadataRequestError(normalized.message, retryable);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      retryable: isRetryableFetchError(error),
      durationMs: performance.now() - startedAt,
    };
  }
}
