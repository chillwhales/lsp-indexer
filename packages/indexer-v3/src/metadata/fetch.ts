import { decodeLsp29Metadata } from '@chillwhales/lsp29';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { bytesToHex, keccak256, toHex } from 'viem';
import { z } from 'zod';
import type { MetadataSource } from './source.js';

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
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
] as const) {
  BLOCKED_IPV4_ADDRESSES.addSubnet(network, prefix, 'ipv4');
}
const BLOCKED_IPV6_ADDRESSES = new BlockList();
for (const [network, prefix] of [
  ['::', 96],
  ['::1', 128],
  ['::ffff:0:0', 96],
  ['100::', 64],
  ['2001:2::', 48],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
] as const) {
  BLOCKED_IPV6_ADDRESSES.addSubnet(network, prefix, 'ipv6');
}

export interface MetadataDnsAddress {
  address: string;
  family: number;
}

export type MetadataLookup = (hostname: string) => Promise<readonly MetadataDnsAddress[]>;

export interface MetadataFetchConfig {
  ipfsGateway: string;
  requestTimeoutMs: number;
  maxResponseBytes: number;
  maxRedirects: number;
  fetchImplementation?: typeof fetch;
  lookupImplementation?: MetadataLookup;
}

export type MetadataFetchResult =
  | {
      ok: true;
      content: Record<string, unknown>;
      contentHash: string;
      contentType: string | null;
      contentLength: number;
      durationMs: number;
    }
  | { ok: false; error: string; retryable: boolean; durationMs: number };

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
  return lookup(hostname, { all: true, verbatim: true });
}

function assertPublicHttpUrl(value: string): URL {
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
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new MetadataRequestError('Metadata request URL targets a local hostname', false);
  }
  const ipVersion = isIP(hostname.replace(/^\[|\]$/g, ''));
  if (ipVersion !== 0 && isBlockedIpAddress(hostname.replace(/^\[|\]$/g, ''), ipVersion)) {
    throw new MetadataRequestError('Metadata request URL targets a private IP address', false);
  }
  return url;
}

async function assertPublicResolution(
  url: URL,
  lookupImplementation: MetadataLookup,
): Promise<void> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(hostname) !== 0) return;
  const addresses = await lookupImplementation(hostname);
  if (addresses.length === 0) {
    throw new MetadataRequestError('Metadata hostname resolved without an IP address', true);
  }
  if (addresses.some(({ address, family }) => isBlockedIpAddress(address, family))) {
    throw new MetadataRequestError('Metadata hostname resolves to a private IP address', false);
  }
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

/** Resolve an IPFS URI through one network's configured gateway. */
export function resolveMetadataRequestUrl(contentUri: string, ipfsGateway: string): string {
  if (!contentUri.startsWith('ipfs://')) return assertPublicHttpUrl(contentUri).toString();
  const location = contentUri.slice('ipfs://'.length);
  const [path] = location.split(/[?#]/, 1);
  if (
    path == null ||
    path.length === 0 ||
    path.startsWith('/') ||
    path.split('/').some((segment) => segment === '..')
  ) {
    throw new MetadataRequestError('IPFS metadata URI is malformed', false);
  }
  const gateway = assertPublicHttpUrl(ipfsGateway);
  const base = gateway.toString().replace(/\/+$/, '');
  return assertPublicHttpUrl(`${base}/${location}`).toString();
}

async function readBoundedBody(response: Response, maximum: number): Promise<Uint8Array> {
  const advertisedLength = response.headers.get('content-length');
  if (advertisedLength != null) {
    const parsed = Number(advertisedLength);
    if (Number.isFinite(parsed) && parsed > maximum) {
      throw new MetadataRequestError(
        `Metadata response declares ${parsed} bytes; maximum is ${maximum}`,
        false,
      );
    }
  }
  if (response.body == null) throw new MetadataRequestError('Metadata response has no body', true);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new MetadataRequestError(
          `Metadata response exceeded the ${maximum}-byte maximum`,
          false,
        );
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function fetchResponse(
  contentUri: string,
  config: MetadataFetchConfig,
): Promise<{ response: Response; body: Uint8Array }> {
  const fetchImplementation = config.fetchImplementation ?? fetch;
  const lookupImplementation = config.lookupImplementation ?? defaultLookup;
  const deadline = performance.now() + config.requestTimeoutMs;
  let current = resolveMetadataRequestUrl(contentUri, config.ipfsGateway);
  for (let redirect = 0; redirect <= config.maxRedirects; redirect++) {
    await withRequestDeadline(
      assertPublicResolution(new URL(current), lookupImplementation),
      deadline,
    );
    const remainingMs = Math.max(1, Math.ceil(deadline - performance.now()));
    const response = await fetchImplementation(current, {
      headers: {
        accept: 'application/json, application/*+json;q=0.9, text/plain;q=0.5',
        'user-agent': 'lsp-indexer-v3-metadata/3',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(remainingMs),
    });
    if (REDIRECT_STATUSES.has(response.status)) {
      if (redirect === config.maxRedirects) {
        throw new MetadataRequestError('Metadata response exceeded the redirect limit', false);
      }
      const location = response.headers.get('location');
      if (location == null) {
        throw new MetadataRequestError('Metadata redirect omitted its location', false);
      }
      current = assertPublicHttpUrl(new URL(location, current).toString()).toString();
      continue;
    }
    if (!response.ok) {
      throw new MetadataRequestError(
        `Metadata request failed with HTTP ${response.status}`,
        RETRYABLE_HTTP_STATUSES.has(response.status) || response.status >= 500,
      );
    }
    return { response, body: await readBoundedBody(response, config.maxResponseBytes) };
  }
  throw new MetadataRequestError('Metadata response exceeded the redirect limit', false);
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
  return ['econnreset', 'etimedout', 'eproto', 'econnaborted', 'enotfound', 'eai_again'].includes(
    readErrorCode(error) ?? '',
  );
}

/** Fetch, bound, verify, and parse one current metadata source. */
export async function fetchMetadata(
  source: MetadataSource,
  config: MetadataFetchConfig,
): Promise<MetadataFetchResult> {
  const startedAt = performance.now();
  try {
    const { response, body } = await fetchResponse(source.contentUri, config);
    const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim() || null;
    if (contentType === 'text/html') {
      throw new MetadataRequestError('Metadata response returned HTML instead of JSON', false);
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(body);
    } catch {
      throw new MetadataRequestError('Metadata response is not valid UTF-8', false);
    }
    const bytesHash = keccak256(bytesToHex(body));
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
      throw new MetadataRequestError(
        'Metadata content hash does not match the chain source',
        false,
      );
    }
    return {
      ok: true,
      content: parseMetadataContent(source, text),
      contentHash,
      contentType,
      contentLength: body.byteLength,
      durationMs: performance.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      retryable: isRetryableFetchError(error),
      durationMs: performance.now() - startedAt,
    };
  }
}
