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
  contentUris: readonly string[];
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

/** Current metadata rows reloaded for targets that became eligible after verification. */
export interface MetadataRecoveryCandidates {
  dataValues: readonly DataValueRow[];
  nfts: readonly NftRow[];
}

/** Verification fields captured before the projection reducer mutates its scoped state. */
export interface MetadataVerificationSnapshot {
  profiles: ReadonlyMap<string, string>;
  assets: ReadonlyMap<string, { verification: string; standard: string }>;
  nfts: ReadonlyMap<string, string>;
}

/** Chain targets whose final state newly permits one or more metadata source kinds. */
export interface MetadataVerificationTransitions {
  profileAddresses: readonly string[];
  assetAddresses: readonly string[];
  tokenCollectionAddresses: readonly string[];
  nftTargets: readonly { address: string; tokenId: string }[];
}

interface ParsedContentReference {
  contentUris: readonly string[];
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
    throw new Error('Metadata URI must be an absolute data, IPFS, HTTP, or HTTPS URI');
  }
  if (parsed.protocol === 'data:') {
    if (!value.includes(',')) throw new Error('Metadata data URI is malformed');
    return value;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Metadata URI must use data, IPFS, HTTP, or HTTPS');
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
    contentUris: [assertSupportedContentUri(parsed.url)],
    contentHash: parsed.verificationData.toLowerCase(),
    verificationMethod: assertVerificationMethod(parsed.verificationMethod),
  };
}

function parseEncryptedReference(dataValue: Hex): ParsedContentReference {
  if (!isLsp31Uri(dataValue)) return parseVerifiableReference(dataValue);

  const parsed = parseLsp31Uri(dataValue);
  const supported = selectBackend(parsed.entries, ['ipfs', 's3', 'arweave']).filter(
    ({ backend }) => backend !== 'lumera',
  );
  if (supported.length === 0) {
    throw new Error('LSP31 source has no IPFS or HTTP-compatible backend');
  }
  return {
    contentUris: supported.map((entry) => assertSupportedContentUri(resolveUrl(entry))),
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
  const asset = state.digitalAssets.get(row.address);
  return (
    asset?.verification === 'verified' &&
    asset.standard === 'lsp8' &&
    row.tokenId != null &&
    state.nfts.get(tokenKey(row.address, row.tokenId))?.verification === 'verified'
  );
}

function isVerifiedNftTarget(state: ProjectionState, row: NftRow): boolean {
  const asset = state.digitalAssets.get(row.address);
  return (
    asset?.verification === 'verified' &&
    asset.standard === 'lsp8' &&
    row.verification === 'verified'
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
  const contentUri = reference.contentUris[0];
  if (contentUri == null) throw new Error('Metadata source has no supported location');
  const source = {
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    kind,
    address: row.address,
    tokenId: row.tokenId,
    dataKey: row.dataKey,
    sourceRevision: keccak256(row.dataValue),
    contentUri,
    contentUris: reference.contentUris,
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
    contentUris: [contentUri],
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

/** Capture only target verification state before the reducer mutates its scoped state in place. */
export function snapshotMetadataVerification(state: ProjectionState): MetadataVerificationSnapshot {
  return {
    profiles: new Map(
      [...state.universalProfiles].map(([address, row]) => [address, row.verification]),
    ),
    assets: new Map(
      [...state.digitalAssets].map(([address, row]) => [
        address,
        { verification: row.verification, standard: row.standard },
      ]),
    ),
    nfts: new Map([...state.nfts].map(([key, row]) => [key, row.verification])),
  };
}

/** Find bounded targets whose final state newly permits metadata processing. */
export function findMetadataVerificationTransitions(
  snapshot: MetadataVerificationSnapshot,
  mutations: ProjectionMutations,
): MetadataVerificationTransitions {
  const profileAddresses = new Set<string>();
  const assetAddresses = new Set<string>();
  const tokenCollectionAddresses = new Set<string>();
  const nftTargets = new Map<string, { address: string; tokenId: string }>();

  for (const row of mutations.universalProfiles) {
    if (row.verification === 'verified' && snapshot.profiles.get(row.address) !== 'verified') {
      profileAddresses.add(row.address);
    }
  }
  for (const row of mutations.digitalAssets) {
    const previous = snapshot.assets.get(row.address);
    if (row.verification === 'verified' && previous?.verification !== 'verified') {
      assetAddresses.add(row.address);
    }
    if (
      row.verification === 'verified' &&
      row.standard === 'lsp8' &&
      (previous?.verification !== 'verified' || previous.standard !== 'lsp8')
    ) {
      tokenCollectionAddresses.add(row.address);
    }
  }
  for (const row of mutations.nfts) {
    const key = tokenKey(row.address, row.tokenId);
    if (row.verification === 'verified' && snapshot.nfts.get(key) !== 'verified') {
      nftTargets.set(key, { address: row.address, tokenId: row.tokenId });
    }
  }

  return {
    profileAddresses: [...profileAddresses],
    assetAddresses: [...assetAddresses],
    tokenCollectionAddresses: [...tokenCollectionAddresses],
    nftTargets: [...nftTargets.values()],
  };
}

/** Plan durable queue replacements from the projection rows changed by one Pipes transaction. */
export function planMetadataSources(
  runtime: RuntimeConfig,
  state: ProjectionState,
  mutations: ProjectionMutations,
  events: readonly EventFactRecord[],
  recovery: MetadataRecoveryCandidates = { dataValues: [], nfts: [] },
): MetadataSourcePlan {
  const scopes = new Map<string, MetadataSourceScope>();
  const sources = new Map<string, MetadataSource>();
  const rejected: RejectedMetadataSource[] = [];

  const candidateDataValues = new Map(
    [...recovery.dataValues, ...mutations.dataValues].map((row) => [row.id, row]),
  );
  for (const row of candidateDataValues.values()) {
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

  const recoveredNftKeys = new Set(recovery.nfts.map((row) => tokenKey(row.address, row.tokenId)));
  const candidateNfts = new Map(
    [...recovery.nfts, ...mutations.nfts].map((row) => [tokenKey(row.address, row.tokenId), row]),
  );
  for (const row of candidateNfts.values()) {
    if (
      !recoveredNftKeys.has(tokenKey(row.address, row.tokenId)) &&
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
    if (!isVerifiedNftTarget(state, row)) continue;
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
