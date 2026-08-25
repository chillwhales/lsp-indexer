import {
  TimestampSchema,
  V3BlockSchema,
  V3ChillwhalesNftSchema,
  V3ControllerSchema,
  V3CreatorSchema,
  V3DataValueSchema,
  V3DigitalAssetSchema,
  V3EventFactSchema,
  V3FollowerSchema,
  V3IndexedHeadSchema,
  V3IssuedAssetSchema,
  V3MetadataRevisionSchema,
  V3NftSchema,
  V3OwnedAssetSchema,
  V3OwnedTokenSchema,
  V3UniversalProfileSchema,
  type ProjectionRef,
  type V3Block,
  type V3ChillwhalesNft,
  type V3Controller,
  type V3Creator,
  type V3DataValue,
  type V3DigitalAsset,
  type V3EventFact,
  type V3Follower,
  type V3IndexedHead,
  type V3IssuedAsset,
  type V3MetadataRevision,
  type V3Nft,
  type V3OwnedAsset,
  type V3OwnedToken,
  type V3UniversalProfile,
} from '@lsp-indexer/types';

function record(value: unknown, field = 'row'): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new TypeError(`${field} must be a string`);
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requiredString(value, field);
}

function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(`${field} must be a boolean`);
  return value;
}

function nullableBoolean(value: unknown, field: string): boolean | null {
  if (value == null) return null;
  return requiredBoolean(value, field);
}

function safeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new TypeError(`${field} must be a safe integer`);
  }
  if (typeof value === 'string' && !/^-?\d+$/.test(value)) {
    throw new TypeError(`${field} must be a safe integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new TypeError(`${field} must be a safe integer`);
  return parsed;
}

function nullableSafeInteger(value: unknown, field: string): number | null {
  if (value == null) return null;
  return safeInteger(value, field);
}

function losslessBigInt(value: unknown, field: string): bigint {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    throw new TypeError(`${field} must be an integer`);
  }
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new TypeError(`${field} must be a lossless integer`);
  }
  try {
    return BigInt(value);
  } catch {
    throw new TypeError(`${field} must be an integer`);
  }
}

function nullableBigInt(value: unknown, field: string): bigint | null {
  if (value == null) return null;
  return losslessBigInt(value, field);
}

function timestamp(value: unknown, field: string): string {
  const raw = requiredString(value, field);
  if (!TimestampSchema.safeParse(raw).success) throw new TypeError(`${field} must be a timestamp`);
  return new Date(raw).toISOString();
}

function nullableTimestamp(value: unknown, field: string): string | null {
  if (value == null) return null;
  return timestamp(value, field);
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array`);
  return value.map((item, index) => requiredString(item, `${field}.${index}`));
}

function network(raw: Record<string, unknown>): { network: string; chainId: number } {
  return {
    network: requiredString(raw.network, 'network'),
    chainId: safeInteger(raw.chainId, 'chainId'),
  };
}

function projection(raw: Record<string, unknown>): ProjectionRef {
  return {
    ...network(raw),
    lastBlockNumber: safeInteger(raw.lastBlockNumber, 'lastBlockNumber'),
    lastBlockHash: requiredString(raw.lastBlockHash, 'lastBlockHash'),
    lastTransactionHash: nullableString(raw.lastTransactionHash, 'lastTransactionHash'),
    lastTransactionIndex: nullableSafeInteger(raw.lastTransactionIndex, 'lastTransactionIndex'),
    lastLogIndex: nullableSafeInteger(raw.lastLogIndex, 'lastLogIndex'),
  };
}

export function parseV3Block(value: unknown): V3Block {
  const raw = record(value);
  return V3BlockSchema.parse({
    ...network(raw),
    id: requiredString(raw.id, 'id'),
    number: safeInteger(raw.number, 'number'),
    blockNumber: safeInteger(raw.number, 'number'),
    hash: requiredString(raw.hash, 'hash'),
    blockHash: requiredString(raw.hash, 'hash'),
    parentHash: requiredString(raw.parentHash, 'parentHash'),
    timestamp: timestamp(raw.timestamp, 'timestamp'),
  });
}

export function parseV3EventFact(value: unknown): V3EventFact {
  const raw = record(value);
  return V3EventFactSchema.parse({
    ...network(raw),
    id: requiredString(raw.id, 'id'),
    blockNumber: safeInteger(raw.blockNumber, 'blockNumber'),
    blockHash: requiredString(raw.blockHash, 'blockHash'),
    parentHash: requiredString(raw.parentHash, 'parentHash'),
    timestamp: timestamp(raw.timestamp, 'timestamp'),
    transactionHash: requiredString(raw.transactionHash, 'transactionHash'),
    transactionIndex: safeInteger(raw.transactionIndex, 'transactionIndex'),
    logIndex: safeInteger(raw.logIndex, 'logIndex'),
    address: requiredString(raw.address, 'address'),
    topic0: requiredString(raw.topic0, 'topic0'),
    topics: stringArray(raw.topics, 'topics'),
    data: requiredString(raw.data, 'data'),
    eventName: nullableString(raw.eventName, 'eventName'),
    eventDomain: nullableString(raw.eventDomain, 'eventDomain'),
    decoded: raw.decoded == null ? null : record(raw.decoded, 'decoded'),
  });
}

export function parseV3UniversalProfile(value: unknown): V3UniversalProfile {
  const raw = record(value);
  return V3UniversalProfileSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    address: requiredString(raw.address, 'address'),
    ownerAddress: nullableString(raw.ownerAddress, 'ownerAddress'),
    verification: requiredString(raw.verification, 'verification'),
  });
}

export function parseV3DigitalAsset(value: unknown): V3DigitalAsset {
  const raw = record(value);
  return V3DigitalAssetSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    address: requiredString(raw.address, 'address'),
    ownerAddress: nullableString(raw.ownerAddress, 'ownerAddress'),
    standard: requiredString(raw.standard, 'standard'),
    tokenType: nullableSafeInteger(raw.tokenType, 'tokenType'),
    name: nullableString(raw.name, 'name'),
    symbol: nullableString(raw.symbol, 'symbol'),
    decimals: nullableSafeInteger(raw.decimals, 'decimals'),
    totalSupply: nullableBigInt(raw.totalSupply, 'totalSupply'),
    tokenIdFormat: nullableSafeInteger(raw.tokenIdFormat, 'tokenIdFormat'),
    tokenIdReferenceContract: nullableString(
      raw.tokenIdReferenceContract,
      'tokenIdReferenceContract',
    ),
    baseUri: nullableString(raw.baseUri, 'baseUri'),
    verification: requiredString(raw.verification, 'verification'),
  });
}

export function parseV3Nft(value: unknown): V3Nft {
  const raw = record(value);
  return V3NftSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    address: requiredString(raw.address, 'address'),
    tokenId: requiredString(raw.tokenId, 'tokenId'),
    formattedTokenId: nullableString(raw.formattedTokenId, 'formattedTokenId'),
    isMinted: requiredBoolean(raw.isMinted, 'isMinted'),
    isBurned: requiredBoolean(raw.isBurned, 'isBurned'),
    ownerAddress: nullableString(raw.ownerAddress, 'ownerAddress'),
    tokenUri: nullableString(raw.tokenUri, 'tokenUri'),
    verification: requiredString(raw.verification, 'verification'),
  });
}

export function parseV3OwnedAsset(value: unknown): V3OwnedAsset {
  const raw = record(value);
  return V3OwnedAssetSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    ownerAddress: requiredString(raw.ownerAddress, 'ownerAddress'),
    assetAddress: requiredString(raw.assetAddress, 'assetAddress'),
    balance: losslessBigInt(raw.balance, 'balance'),
  });
}

export function parseV3OwnedToken(value: unknown): V3OwnedToken {
  const raw = record(value);
  return V3OwnedTokenSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    ownerAddress: requiredString(raw.ownerAddress, 'ownerAddress'),
    assetAddress: requiredString(raw.assetAddress, 'assetAddress'),
    tokenId: requiredString(raw.tokenId, 'tokenId'),
    balance: losslessBigInt(raw.balance, 'balance'),
  });
}

export function parseV3Follower(value: unknown): V3Follower {
  const raw = record(value);
  return V3FollowerSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    followerAddress: requiredString(raw.followerAddress, 'followerAddress'),
    followedAddress: requiredString(raw.followedAddress, 'followedAddress'),
    isFollowing: requiredBoolean(raw.isFollowing, 'isFollowing'),
    followedAt: nullableTimestamp(raw.followedAt, 'followedAt'),
    unfollowedAt: nullableTimestamp(raw.unfollowedAt, 'unfollowedAt'),
  });
}

export function parseV3Creator(value: unknown): V3Creator {
  const raw = record(value);
  return V3CreatorSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    assetAddress: requiredString(raw.assetAddress, 'assetAddress'),
    creatorAddress: requiredString(raw.creatorAddress, 'creatorAddress'),
    arrayIndex: losslessBigInt(raw.arrayIndex, 'arrayIndex'),
    interfaceId: nullableString(raw.interfaceId, 'interfaceId'),
    verified: requiredBoolean(raw.verified, 'verified'),
  });
}

export function parseV3IssuedAsset(value: unknown): V3IssuedAsset {
  const raw = record(value);
  return V3IssuedAssetSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    issuerAddress: requiredString(raw.issuerAddress, 'issuerAddress'),
    assetAddress: requiredString(raw.assetAddress, 'assetAddress'),
    arrayIndex: losslessBigInt(raw.arrayIndex, 'arrayIndex'),
    interfaceId: nullableString(raw.interfaceId, 'interfaceId'),
  });
}

export function parseV3Controller(value: unknown): V3Controller {
  const raw = record(value);
  return V3ControllerSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    profileAddress: requiredString(raw.profileAddress, 'profileAddress'),
    controllerAddress: requiredString(raw.controllerAddress, 'controllerAddress'),
    arrayIndex: nullableBigInt(raw.arrayIndex, 'arrayIndex'),
    permissions: nullableString(raw.permissions, 'permissions'),
    allowedCalls: raw.allowedCalls ?? null,
    allowedDataKeys: raw.allowedDataKeys ?? null,
  });
}

export function parseV3ChillwhalesNft(value: unknown): V3ChillwhalesNft {
  const raw = record(value);
  return V3ChillwhalesNftSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    address: requiredString(raw.address, 'address'),
    tokenId: requiredString(raw.tokenId, 'tokenId'),
    chillClaimed: requiredBoolean(raw.chillClaimed, 'chillClaimed'),
    orbsClaimed: requiredBoolean(raw.orbsClaimed, 'orbsClaimed'),
    claimCheckAfterBlock: safeInteger(raw.claimCheckAfterBlock, 'claimCheckAfterBlock'),
    level: nullableSafeInteger(raw.level, 'level'),
    cooldownExpiry: nullableSafeInteger(raw.cooldownExpiry, 'cooldownExpiry'),
    faction: nullableString(raw.faction, 'faction'),
  });
}

export function parseV3DataValue(value: unknown): V3DataValue {
  const raw = record(value);
  return V3DataValueSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    address: requiredString(raw.address, 'address'),
    tokenId: nullableString(raw.tokenId, 'tokenId'),
    dataKey: requiredString(raw.dataKey, 'dataKey'),
    dataValue: requiredString(raw.dataValue, 'dataValue'),
  });
}

export function parseV3MetadataRevision(value: unknown): V3MetadataRevision {
  const raw = record(value);
  return V3MetadataRevisionSchema.parse({
    ...projection(raw),
    id: requiredString(raw.id, 'id'),
    address: requiredString(raw.address, 'address'),
    tokenId: nullableString(raw.tokenId, 'tokenId'),
    dataKey: requiredString(raw.dataKey, 'dataKey'),
    kind: requiredString(raw.kind, 'kind'),
    sourceRevision: requiredString(raw.sourceRevision, 'sourceRevision'),
    contentUri: requiredString(raw.contentUri, 'contentUri'),
    contentHash: nullableString(raw.contentHash, 'contentHash'),
    contentType: nullableString(raw.contentType, 'contentType'),
    contentLength: nullableSafeInteger(raw.contentLength, 'contentLength'),
    content: raw.content,
    fetchedAt: timestamp(raw.fetchedAt, 'fetchedAt'),
    isCurrent: requiredBoolean(raw.isCurrent, 'isCurrent'),
  });
}

export function parseV3IndexedHead(value: unknown): V3IndexedHead {
  const raw = record(value);
  return V3IndexedHeadSchema.parse({
    ...network(raw),
    blockNumber: safeInteger(raw.blockNumber, 'blockNumber'),
    blockHash: requiredString(raw.blockHash, 'blockHash'),
    blockTimestamp: timestamp(raw.blockTimestamp, 'blockTimestamp'),
    finalizedBlockNumber: nullableSafeInteger(raw.finalizedBlockNumber, 'finalizedBlockNumber'),
    finalizedBlockHash: nullableString(raw.finalizedBlockHash, 'finalizedBlockHash'),
    updatedAt: timestamp(raw.updatedAt, 'updatedAt'),
  });
}

export function parseV3Rows<T>(values: unknown, parser: (value: unknown) => T): T[] {
  if (!Array.isArray(values)) throw new TypeError('items must be an array');
  return values.map(parser);
}

export const v3Parsers = {
  blocks: parseV3Block,
  events: parseV3EventFact,
  profiles: parseV3UniversalProfile,
  digitalAssets: parseV3DigitalAsset,
  nfts: parseV3Nft,
  ownedAssets: parseV3OwnedAsset,
  ownedTokens: parseV3OwnedToken,
  followers: parseV3Follower,
  creators: parseV3Creator,
  issuedAssets: parseV3IssuedAsset,
  controllers: parseV3Controller,
  chillwhalesNfts: parseV3ChillwhalesNft,
  dataValues: parseV3DataValue,
  metadataRevisions: parseV3MetadataRevision,
  indexedHeads: parseV3IndexedHead,
} as const;

export function nullableRelation(value: unknown, field: string): Record<string, unknown> | null {
  if (value == null) return null;
  return record(value, field);
}

export function rawRecord(value: unknown, field?: string): Record<string, unknown> {
  return record(value, field);
}

export function rawBoolean(value: unknown, field: string): boolean {
  return requiredBoolean(value, field);
}

export function rawNullableBoolean(value: unknown, field: string): boolean | null {
  return nullableBoolean(value, field);
}

export function rawNullableString(value: unknown, field: string): string | null {
  return nullableString(value, field);
}

export function rawSafeInteger(value: unknown, field: string): number {
  return safeInteger(value, field);
}

export function rawNullableSafeInteger(value: unknown, field: string): number | null {
  return nullableSafeInteger(value, field);
}
