import { parseVerifiableUri } from '@chillwhales/lsp2';
import { isLsp31Uri, parseLsp31Uri, resolveUrl, selectBackend } from '@chillwhales/lsp31';
import { isHex, keccak256, toHex, type Hex } from 'viem';
import type { RuntimeConfig } from '../config/index.js';
import { createMetadataRevisionId } from '../db/identity.js';
import { dataValues, metadataJobs, nfts } from '../db/schema.js';
import type { EventFactRecord } from '../events/decode.js';
import type { ProjectionMutations } from '../projections/reducer.js';
import { DATA_KEYS, ZERO_ADDRESS } from '../projections/standards.js';
import { tokenKey, type ProjectionState } from '../projections/state.js';

const CONTENT_URI_MAX_LENGTH = 4_096;
const KECCAK256_UTF8_METHOD_ID = '0x6f357c6a';
const KECCAK256_BYTES_METHOD_ID = '0x8019f9b1';

type DataValueRow = typeof dataValues.$inferSelect;
type NftRow = typeof nfts.$inferSelect;
export type MetadataJobKind = typeof metadataJobs.$inferInsert.kind;

export interface MetadataSourceScope {
  chainId: number;
  address: string;
  tokenId: string | null;
  dataKey: string;
}

export interface MetadataSource extends MetadataSourceScope {
  id: string;
  network: string;
  kind: MetadataJobKind;
  sourceRevision: string;
  contentUri: string;
  contentHash: string | null;
  verificationMethod: string | null;
  lastBlockNumber: number;
  lastBlockHash: string;
  lastTransactionHash: string | null;
  lastTransactionIndex: number | null;
  lastLogIndex: number | null;
}

export interface RejectedMetadataSource {
  scope: MetadataSourceScope;
  reason: string;
}

export interface MetadataSourcePlan {
  scopes: MetadataSourceScope[];
  sources: MetadataSource[];
  rejected: RejectedMetadataSource[];
}

interface ParsedContentReference {
  contentUri: string;
  contentHash: string;
  verificationMethod: string;
}

function scopeKey(scope: MetadataSourceScope): string {
  return `${scope.chainId}:${scope.address}:${scope.tokenId ?? 'contract'}:${scope.dataKey}`;
}

function readEventString(event: EventFactRecord, key: string): string | null {
  const value = event.decoded?.[key];
  return typeof value === 'string' ? value : null;
}

function assertSupportedContentUri(value: string): string {
  if (value.length === 0 || value.length > CONTENT_URI_MAX_LENGTH) {
    throw new Error(`Metadata URI must contain between 1 and ${CONTENT_URI_MAX_LENGTH} characters`);
  }
  if (/[^\x20-\x7e]/.test(value)) {
    throw new Error('Metadata URI contains non-printable characters');
  }
  if (value.startsWith('ipfs://')) {
    const location = value.slice('ipfs://'.length);
    if (location.length === 0 || location.startsWith('/') || location.includes('\\')) {
      throw new Error('IPFS metadata URI is malformed');
    }
    return value;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Metadata URI must be an absolute IPFS, HTTP, or HTTPS URI');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Metadata URI must use IPFS, HTTP, or HTTPS');
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new Error('Metadata URI must not contain credentials');
  }
  return parsed.toString();
}

function assertVerificationMethod(value: Hex): string {
  const normalized = value.toLowerCase();
  if (normalized !== KECCAK256_BYTES_METHOD_ID && normalized !== KECCAK256_UTF8_METHOD_ID) {
    throw new Error(`Unsupported metadata verification method ${value}`);
  }
  return normalized;
}

function parseVerifiableReference(dataValue: Hex): ParsedContentReference {
  const parsed = parseVerifiableUri(dataValue);
  return {
    contentUri: assertSupportedContentUri(parsed.url),
    contentHash: parsed.verificationData.toLowerCase(),
    verificationMethod: assertVerificationMethod(parsed.verificationMethod),
  };
}

function parseEncryptedReference(dataValue: Hex): ParsedContentReference {
  if (!isLsp31Uri(dataValue)) return parseVerifiableReference(dataValue);

  const parsed = parseLsp31Uri(dataValue);
  const supported = selectBackend(parsed.entries, ['ipfs', 's3', 'arweave']).find(
    ({ backend }) => backend !== 'lumera',
  );
  if (supported == null) {
    throw new Error('LSP31 source has no IPFS or HTTP-compatible backend');
  }
  return {
    contentUri: assertSupportedContentUri(resolveUrl(supported)),
    contentHash: parsed.verificationData.toLowerCase(),
    verificationMethod: assertVerificationMethod(parsed.verificationMethod),
  };
}

function metadataKind(row: DataValueRow): MetadataJobKind | null {
  if (row.tokenId == null && row.dataKey === DATA_KEYS.lsp3Profile) return 'lsp3_profile';
  if (row.dataKey === DATA_KEYS.lsp4Metadata) {
    return row.tokenId == null ? 'lsp4_asset' : 'lsp4_token';
  }
  if (
    row.tokenId == null &&
    row.dataKey !== DATA_KEYS.lsp29EncryptedAssetsLength &&
    row.dataKey.startsWith(DATA_KEYS.lsp29EncryptedAssetsIndex)
  ) {
    return 'lsp29_encrypted_asset';
  }
  return null;
}

function isVerifiedTarget(
  state: ProjectionState,
  row: DataValueRow,
  kind: MetadataJobKind,
): boolean {
  if (kind === 'lsp3_profile' || kind === 'lsp29_encrypted_asset') {
    return state.universalProfiles.get(row.address)?.verification === 'verified';
  }
  if (kind === 'lsp4_asset') {
    return state.digitalAssets.get(row.address)?.verification === 'verified';
  }
  return (
    row.tokenId != null &&
    state.nfts.get(tokenKey(row.address, row.tokenId))?.verification === 'verified'
  );
}

function createSourceId(source: Omit<MetadataSource, 'id'>): string {
  return createMetadataRevisionId(
    source.chainId,
    source.address,
    source.dataKey,
    source.sourceRevision,
    source.tokenId ?? undefined,
  );
}

/** Build one verified metadata source from an ERC725Y current-value row. */
export function createDataValueMetadataSource(
  runtime: RuntimeConfig,
  row: DataValueRow,
): MetadataSource | null {
  const kind = metadataKind(row);
  if (kind == null || !isHex(row.dataValue) || row.dataValue === '0x') return null;
  const reference =
    kind === 'lsp29_encrypted_asset'
      ? parseEncryptedReference(row.dataValue)
      : parseVerifiableReference(row.dataValue);
  const source = {
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    kind,
    address: row.address,
    tokenId: row.tokenId,
    dataKey: row.dataKey,
    sourceRevision: keccak256(row.dataValue),
    contentUri: reference.contentUri,
    contentHash: reference.contentHash,
    verificationMethod: reference.verificationMethod,
    lastBlockNumber: row.lastBlockNumber,
    lastBlockHash: row.lastBlockHash,
    lastTransactionHash: row.lastTransactionHash,
    lastTransactionIndex: row.lastTransactionIndex,
    lastLogIndex: row.lastLogIndex,
  };
  return { id: createSourceId(source), ...source };
}

/** Build one unverified base-URI metadata source from an NFT's current derived URI. */
export function createNftMetadataSource(
  runtime: RuntimeConfig,
  row: NftRow,
): MetadataSource | null {
  if (row.tokenUri == null) return null;
  const contentUri = assertSupportedContentUri(row.tokenUri);
  const source: Omit<MetadataSource, 'id'> = {
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    kind: 'lsp4_token',
    address: row.address,
    tokenId: row.tokenId,
    dataKey: DATA_KEYS.lsp8MetadataBaseUri,
    sourceRevision: keccak256(toHex(`lsp8-token-uri:${contentUri}`)),
    contentUri,
    contentHash: null,
    verificationMethod: null,
    lastBlockNumber: row.lastBlockNumber,
    lastBlockHash: row.lastBlockHash,
    lastTransactionHash: row.lastTransactionHash,
    lastTransactionIndex: row.lastTransactionIndex,
    lastLogIndex: row.lastLogIndex,
  };
  return { id: createSourceId(source), ...source };
}

/** Plan durable queue replacements from the projection rows changed by one Pipes transaction. */
export function planMetadataSources(
  runtime: RuntimeConfig,
  state: ProjectionState,
  mutations: ProjectionMutations,
  events: readonly EventFactRecord[],
): MetadataSourcePlan {
  const scopes = new Map<string, MetadataSourceScope>();
  const sources = new Map<string, MetadataSource>();
  const rejected: RejectedMetadataSource[] = [];

  for (const row of mutations.dataValues) {
    const kind = metadataKind(row);
    if (kind == null) continue;
    const scope = {
      chainId: runtime.network.chainId,
      address: row.address,
      tokenId: row.tokenId,
      dataKey: row.dataKey,
    };
    const key = scopeKey(scope);
    scopes.set(key, scope);
    if (!isVerifiedTarget(state, row, kind)) continue;
    try {
      const source = createDataValueMetadataSource(runtime, row);
      if (source != null) sources.set(key, source);
    } catch (error) {
      rejected.push({
        scope,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const derivedTokenKeys = new Set<string>();
  const derivedCollections = new Set<string>();
  for (const event of events) {
    if (
      event.eventName === 'Transfer' &&
      event.eventDomain === 'lsp8' &&
      readEventString(event, 'from') === ZERO_ADDRESS
    ) {
      const tokenId = readEventString(event, 'tokenId');
      if (tokenId != null) derivedTokenKeys.add(tokenKey(event.address, tokenId));
    } else if (event.eventName === 'DataChanged') {
      const dataKey = readEventString(event, 'dataKey');
      if (dataKey === DATA_KEYS.lsp8MetadataBaseUri || dataKey === DATA_KEYS.lsp8TokenIdFormat) {
        derivedCollections.add(event.address);
      }
    }
  }

  for (const row of mutations.nfts) {
    if (
      !derivedTokenKeys.has(tokenKey(row.address, row.tokenId)) &&
      !derivedCollections.has(row.address)
    ) {
      continue;
    }
    const scope = {
      chainId: runtime.network.chainId,
      address: row.address,
      tokenId: row.tokenId,
      dataKey: DATA_KEYS.lsp8MetadataBaseUri,
    };
    const key = scopeKey(scope);
    scopes.set(key, scope);
    if (row.verification !== 'verified') continue;
    try {
      const source = createNftMetadataSource(runtime, row);
      if (source != null) sources.set(key, source);
    } catch (error) {
      rejected.push({
        scope,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { scopes: [...scopes.values()], sources: [...sources.values()], rejected };
}

/** Compare a claimed job to a source reloaded from current chain-scoped state. */
export function matchesMetadataJob(
  job: typeof metadataJobs.$inferSelect,
  source: MetadataSource | null,
): boolean {
  return (
    source != null &&
    source.id === job.id &&
    source.network === job.network &&
    source.chainId === job.chainId &&
    source.kind === job.kind &&
    source.address === job.address &&
    source.tokenId === job.tokenId &&
    source.dataKey === job.dataKey &&
    source.sourceRevision === job.sourceRevision &&
    source.contentUri === job.contentUri &&
    source.contentHash === job.contentHash
  );
}
