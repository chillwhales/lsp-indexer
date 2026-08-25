import { resolveDataKeyName } from '@chillwhales/erc725';
import { resolveTypeIdName } from '@chillwhales/lsp1';
import {
  CreatorSchema,
  DataChangedEventSchema,
  DigitalAssetSchema,
  EncryptedAssetSchema,
  FollowerSchema,
  IssuedAssetSchema,
  NftSchema,
  OwnedAssetSchema,
  OwnedTokenSchema,
  ProfileSchema,
  TokenIdDataChangedEventSchema,
  UniversalReceiverEventSchema,
  type Asset,
  type Creator,
  type CreatorInclude,
  type DataChangedEvent,
  type DataChangedEventInclude,
  type DigitalAsset,
  type DigitalAssetInclude,
  type EncryptedAsset,
  type EncryptedAssetInclude,
  type Follower,
  type FollowerInclude,
  type Image,
  type IssuedAsset,
  type IssuedAssetInclude,
  type Link,
  type Lsp4Attribute,
  type Nft,
  type NftInclude,
  type OwnedAsset,
  type OwnedAssetInclude,
  type OwnedToken,
  type OwnedTokenInclude,
  type PartialCreator,
  type PartialDataChangedEvent,
  type PartialDigitalAsset,
  type PartialEncryptedAsset,
  type PartialFollower,
  type PartialIssuedAsset,
  type PartialNft,
  type PartialOwnedAsset,
  type PartialOwnedToken,
  type PartialProfile,
  type PartialTokenIdDataChangedEvent,
  type PartialUniversalReceiverEvent,
  type Profile,
  type ProfileInclude,
  type TokenIdDataChangedEvent,
  type TokenIdDataChangedEventInclude,
  type UniversalReceiverEvent,
  type UniversalReceiverEventInclude,
} from '@lsp-indexer/types';
import { LSP4_METADATA_DATA_KEY, LSP8_METADATA_BASE_URI_DATA_KEY } from './metadata-keys';
import {
  nullableRelation,
  parseV3Creator,
  parseV3DigitalAsset,
  parseV3EventFact,
  parseV3Follower,
  parseV3IssuedAsset,
  parseV3Nft,
  parseV3OwnedAsset,
  parseV3OwnedToken,
  parseV3UniversalProfile,
  rawNullableSafeInteger,
  rawNullableString,
  rawRecord,
  rawSafeInteger,
} from './parsers';
import { stripIncluded, type NestedStripConfig } from './strip';

const PROJECTION_BASE = [
  'id',
  'network',
  'chainId',
  'lastBlockNumber',
  'lastBlockHash',
  'lastTransactionHash',
  'lastTransactionIndex',
  'lastLogIndex',
] as const;

const PROFILE_STRIP = {
  baseFields: [...PROJECTION_BASE, 'address', 'ownerAddress', 'verification'],
} as const satisfies NestedStripConfig;

const DIGITAL_ASSET_STRIP = {
  baseFields: [...PROJECTION_BASE, 'address', 'ownerAddress', 'verification'],
  derived: { standard: 'decimals' },
} as const satisfies NestedStripConfig;

const NFT_STRIP = {
  baseFields: [
    ...PROJECTION_BASE,
    'address',
    'tokenId',
    'isBurned',
    'isMinted',
    'ownerAddress',
    'tokenUri',
    'verification',
  ],
  nested: {
    collection: DIGITAL_ASSET_STRIP,
    holder: {
      ...PROFILE_STRIP,
      baseFields: [...PROFILE_STRIP.baseFields, 'timestamp'],
    },
  },
} as const satisfies NestedStripConfig;

const OWNED_ASSET_STRIP = {
  baseFields: [...PROJECTION_BASE, 'digitalAssetAddress', 'holderAddress'],
  nested: { digitalAsset: DIGITAL_ASSET_STRIP, holder: PROFILE_STRIP },
} as const satisfies NestedStripConfig;

const OWNED_TOKEN_STRIP = {
  baseFields: [...PROJECTION_BASE, 'digitalAssetAddress', 'holderAddress', 'tokenId'],
  nested: {
    digitalAsset: DIGITAL_ASSET_STRIP,
    nft: NFT_STRIP,
    ownedAsset: OWNED_ASSET_STRIP,
    holder: PROFILE_STRIP,
  },
} as const satisfies NestedStripConfig;

const FOLLOWER_STRIP = {
  baseFields: [
    ...PROJECTION_BASE,
    'followerAddress',
    'followedAddress',
    'isFollowing',
    'followedAt',
    'unfollowedAt',
  ],
  nested: { followerProfile: PROFILE_STRIP, followedProfile: PROFILE_STRIP },
} as const satisfies NestedStripConfig;

const CREATOR_STRIP = {
  baseFields: [...PROJECTION_BASE, 'creatorAddress', 'digitalAssetAddress', 'verified'],
  nested: { creatorProfile: PROFILE_STRIP, digitalAsset: DIGITAL_ASSET_STRIP },
} as const satisfies NestedStripConfig;

const ISSUED_ASSET_STRIP = {
  baseFields: [...PROJECTION_BASE, 'issuerAddress', 'assetAddress'],
  nested: { issuerProfile: PROFILE_STRIP, digitalAsset: DIGITAL_ASSET_STRIP },
} as const satisfies NestedStripConfig;

const EVENT_BASE = [
  'id',
  'network',
  'chainId',
  'address',
  'blockNumber',
  'blockHash',
  'timestamp',
  'transactionHash',
  'transactionIndex',
  'logIndex',
  'topic0',
  'topics',
  'data',
] as const;

const DATA_CHANGED_STRIP = {
  baseFields: [...EVENT_BASE, 'dataKey', 'dataValue'],
  nested: { universalProfile: PROFILE_STRIP, digitalAsset: DIGITAL_ASSET_STRIP },
} as const satisfies NestedStripConfig;

const TOKEN_DATA_CHANGED_STRIP = {
  baseFields: [...EVENT_BASE, 'dataKey', 'dataValue', 'tokenId'],
  nested: { digitalAsset: DIGITAL_ASSET_STRIP, nft: NFT_STRIP },
} as const satisfies NestedStripConfig;

const UNIVERSAL_RECEIVER_STRIP = {
  baseFields: [...EVENT_BASE, 'from', 'typeId'],
  nested: {
    universalProfile: PROFILE_STRIP,
    fromProfile: PROFILE_STRIP,
    fromAsset: DIGITAL_ASSET_STRIP,
  },
} as const satisfies NestedStripConfig;

const ENCRYPTED_ASSET_STRIP = {
  baseFields: [
    ...PROJECTION_BASE,
    'address',
    'contentId',
    'revision',
    'dataKey',
    'sourceRevision',
    'contentUri',
    'contentHash',
    'contentType',
    'contentLength',
    'fetchedAt',
  ],
  nested: {
    encryption: { baseFields: [] },
    file: { baseFields: ['name'] },
    chunks: { baseFields: [] },
    universalProfile: PROFILE_STRIP,
  },
} as const satisfies NestedStripConfig;

function optionalRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function optionalArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function optionalBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function metadataRevisionEnvelope(revision: unknown, key: string): Record<string, unknown> | null {
  const content = optionalRecord(optionalRecord(revision)?.content);
  return optionalRecord(content?.[key]);
}

function metadataEnvelope(
  raw: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  return metadataRevisionEnvelope(optionalArray(raw.metadataRevisions)?.[0], key);
}

function nftMetadataEnvelope(raw: Record<string, unknown>): Record<string, unknown> | null {
  const revisions = optionalArray(raw.metadataRevisions) ?? [];
  const direct = revisions.find(
    (revision) => optionalRecord(revision)?.dataKey === LSP4_METADATA_DATA_KEY,
  );
  const baseUri = revisions.find(
    (revision) => optionalRecord(revision)?.dataKey === LSP8_METADATA_BASE_URI_DATA_KEY,
  );
  return metadataRevisionEnvelope(direct ?? baseUri, 'LSP4Metadata');
}

function verification(value: unknown): { method: string; data: string } | null {
  const raw = optionalRecord(value);
  const method = optionalString(raw?.method);
  const data = optionalString(raw?.data);
  return method != null && data != null ? { method, data } : null;
}

function image(value: unknown): Image | null {
  const raw = optionalRecord(value);
  const url = optionalString(raw?.url);
  if (url == null) return null;
  return {
    url,
    width: optionalNumber(raw?.width),
    height: optionalNumber(raw?.height),
    verification: verification(raw?.verification),
  };
}

function imageGroups(value: unknown): Image[][] | null {
  const groups = optionalArray(value);
  if (groups == null) return null;
  return groups
    .map((group) => {
      const entries = Array.isArray(group) ? group : [group];
      return entries.map(image).filter((entry): entry is Image => entry != null);
    })
    .filter((group) => group.length > 0);
}

function flatImages(value: unknown): Image[] | null {
  const groups = imageGroups(value);
  return groups == null ? null : groups.flat();
}

function asset(value: unknown): Asset | null {
  const raw = optionalRecord(value);
  const url = optionalString(raw?.url);
  if (url == null) return null;
  return {
    url,
    fileType: optionalString(raw?.fileType) ?? optionalString(raw?.file_type) ?? '',
    verification: verification(raw?.verification),
  };
}

function assets(value: unknown): Asset[] | null {
  const entries = optionalArray(value);
  if (entries == null) return null;
  return entries.map(asset).filter((entry): entry is Asset => entry != null);
}

function links(value: unknown): Link[] | null {
  const entries = optionalArray(value);
  if (entries == null) return null;
  return entries.flatMap((entry) => {
    const raw = optionalRecord(entry);
    const title = optionalString(raw?.title);
    const url = optionalString(raw?.url);
    return title != null && url != null ? [{ title, url }] : [];
  });
}

function attributes(value: unknown): Lsp4Attribute[] | null {
  const entries = optionalArray(value);
  if (entries == null) return null;
  return entries.flatMap((entry) => {
    const raw = optionalRecord(entry);
    const key = optionalString(raw?.key);
    const itemValue = optionalString(raw?.value);
    const type = optionalString(raw?.type);
    if (key == null || itemValue == null || type == null) return [];
    return [
      {
        key,
        value: itemValue,
        type,
        score: optionalNumber(raw?.score),
        rarity: optionalNumber(raw?.rarity),
      },
    ];
  });
}

function stringList(value: unknown): string[] | null {
  const entries = optionalArray(value);
  if (entries == null) return null;
  return entries.filter((entry): entry is string => typeof entry === 'string');
}

function aggregateCount(value: unknown): number {
  const aggregate = optionalRecord(optionalRecord(value)?.aggregate);
  return optionalNumber(aggregate?.count) ?? 0;
}

function safeLegacyArrayIndex(value: bigint, path: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new TypeError(`${path} exceeds the safe integer range required by the familiar API`);
  }
  return parsed;
}

function profileFromRaw(value: unknown): Profile {
  const raw = rawRecord(value);
  const base = parseV3UniversalProfile(raw);
  const metadata = metadataEnvelope(raw, 'LSP3Profile');
  return ProfileSchema.parse({
    ...base,
    name: optionalString(metadata?.name),
    description: optionalString(metadata?.description),
    tags: stringList(metadata?.tags),
    links: links(metadata?.links),
    avatar: assets(metadata?.avatar),
    profileImage: flatImages(metadata?.profileImage),
    backgroundImage: flatImages(metadata?.backgroundImage),
    followerCount: aggregateCount(raw.followerCount),
    followingCount: aggregateCount(raw.followingCount),
    timestamp: null,
    blockNumber: base.lastBlockNumber,
    transactionIndex: base.lastTransactionIndex,
    logIndex: base.lastLogIndex,
  });
}

export function parseProfile(raw: unknown): Profile;
export function parseProfile(raw: unknown, include: ProfileInclude): PartialProfile;
export function parseProfile(raw: unknown, include?: ProfileInclude): Profile | PartialProfile {
  const profile = profileFromRaw(raw);
  return include == null ? profile : stripIncluded(profile, include, PROFILE_STRIP);
}

export function parseProfiles(raw: unknown[]): Profile[];
export function parseProfiles(raw: unknown[], include: ProfileInclude): PartialProfile[];
export function parseProfiles(
  raw: unknown[],
  include?: ProfileInclude,
): (Profile | PartialProfile)[] {
  return raw.map((value) => (include == null ? parseProfile(value) : parseProfile(value, include)));
}

function digitalAssetFromRaw(value: unknown): DigitalAsset {
  const raw = rawRecord(value);
  const base = parseV3DigitalAsset(raw);
  const metadata = metadataEnvelope(raw, 'LSP4Metadata');
  const tokenType =
    base.tokenType === 0
      ? 'TOKEN'
      : base.tokenType === 1
        ? 'NFT'
        : base.tokenType === 2
          ? 'COLLECTION'
          : null;
  return DigitalAssetSchema.parse({
    ...base,
    standard: base.standard === 'lsp7' ? 'LSP7' : base.standard === 'lsp8' ? 'LSP8' : 'UNKNOWN',
    tokenType,
    name: base.name ?? optionalString(metadata?.name),
    symbol: base.symbol ?? optionalString(metadata?.symbol),
    description: optionalString(metadata?.description),
    category: optionalString(metadata?.category),
    icons: flatImages(metadata?.icon),
    images: imageGroups(metadata?.images),
    links: links(metadata?.links),
    attributes: attributes(metadata?.attributes),
    owner: null,
    holderCount: aggregateCount(raw.holderCount),
    creatorCount: aggregateCount(raw.creatorCount),
    referenceContract: base.tokenIdReferenceContract,
    tokenIdFormat: base.tokenIdFormat == null ? null : String(base.tokenIdFormat),
    baseUri: base.baseUri,
    timestamp: null,
    blockNumber: base.lastBlockNumber,
    transactionIndex: base.lastTransactionIndex,
    logIndex: base.lastLogIndex,
  });
}

export function parseDigitalAsset(raw: unknown): DigitalAsset;
export function parseDigitalAsset(raw: unknown, include: DigitalAssetInclude): PartialDigitalAsset;
export function parseDigitalAsset(
  raw: unknown,
  include?: DigitalAssetInclude,
): DigitalAsset | PartialDigitalAsset {
  const digitalAsset = digitalAssetFromRaw(raw);
  return include == null ? digitalAsset : stripIncluded(digitalAsset, include, DIGITAL_ASSET_STRIP);
}

export function parseDigitalAssets(raw: unknown[]): DigitalAsset[];
export function parseDigitalAssets(
  raw: unknown[],
  include: DigitalAssetInclude,
): PartialDigitalAsset[];
export function parseDigitalAssets(
  raw: unknown[],
  include?: DigitalAssetInclude,
): (DigitalAsset | PartialDigitalAsset)[] {
  return raw.map((value) =>
    include == null ? parseDigitalAsset(value) : parseDigitalAsset(value, include),
  );
}

function nftFromRaw(value: unknown): Nft {
  const raw = rawRecord(value);
  const base = parseV3Nft(raw);
  const metadata = nftMetadataEnvelope(raw);
  const ownedToken = nullableRelation(raw.ownedToken, 'ownedToken');
  const holderProfile = nullableRelation(
    ownedToken?.universalProfile,
    'ownedToken.universalProfile',
  );
  const holder =
    holderProfile == null ? null : { ...profileFromRaw(holderProfile), timestamp: null };
  const extension = nullableRelation(raw.chillwhales, 'chillwhales');
  return NftSchema.parse({
    ...base,
    name: optionalString(metadata?.name),
    collection: raw.digitalAsset == null ? null : digitalAssetFromRaw(raw.digitalAsset),
    holder,
    description: optionalString(metadata?.description),
    category: optionalString(metadata?.category),
    icons: flatImages(metadata?.icon),
    images: imageGroups(metadata?.images),
    links: links(metadata?.links),
    attributes: attributes(metadata?.attributes),
    timestamp: null,
    blockNumber: base.lastBlockNumber,
    transactionIndex: base.lastTransactionIndex,
    logIndex: base.lastLogIndex,
    score: null,
    rank: null,
    chillClaimed: optionalBoolean(extension?.chillClaimed),
    orbsClaimed: optionalBoolean(extension?.orbsClaimed),
    level: optionalNumber(extension?.level),
    cooldownExpiry: optionalNumber(extension?.cooldownExpiry),
    faction: optionalString(extension?.faction),
  });
}

export function parseNft(raw: unknown): Nft;
export function parseNft(raw: unknown, include: NftInclude): PartialNft;
export function parseNft(raw: unknown, include?: NftInclude): Nft | PartialNft {
  const nft = nftFromRaw(raw);
  return include == null ? nft : stripIncluded(nft, include, NFT_STRIP);
}

export function parseNfts(raw: unknown[]): Nft[];
export function parseNfts(raw: unknown[], include: NftInclude): PartialNft[];
export function parseNfts(raw: unknown[], include?: NftInclude): (Nft | PartialNft)[] {
  return raw.map((value) => (include == null ? parseNft(value) : parseNft(value, include)));
}

function ownedAssetFromRaw(value: unknown): OwnedAsset {
  const raw = rawRecord(value);
  const base = parseV3OwnedAsset(raw);
  return OwnedAssetSchema.parse({
    ...base,
    digitalAssetAddress: base.assetAddress,
    holderAddress: base.ownerAddress,
    blockNumber: base.lastBlockNumber,
    timestamp: null,
    transactionIndex: base.lastTransactionIndex,
    logIndex: base.lastLogIndex,
    digitalAsset: raw.digitalAsset == null ? null : digitalAssetFromRaw(raw.digitalAsset),
    holder: raw.universalProfile == null ? null : profileFromRaw(raw.universalProfile),
    tokenIdCount: aggregateCount(raw.tokenIdCount),
  });
}

export function parseOwnedAsset(raw: unknown): OwnedAsset;
export function parseOwnedAsset(raw: unknown, include: OwnedAssetInclude): PartialOwnedAsset;
export function parseOwnedAsset(
  raw: unknown,
  include?: OwnedAssetInclude,
): OwnedAsset | PartialOwnedAsset {
  const ownedAsset = ownedAssetFromRaw(raw);
  return include == null ? ownedAsset : stripIncluded(ownedAsset, include, OWNED_ASSET_STRIP);
}

export function parseOwnedAssets(raw: unknown[]): OwnedAsset[];
export function parseOwnedAssets(raw: unknown[], include: OwnedAssetInclude): PartialOwnedAsset[];
export function parseOwnedAssets(
  raw: unknown[],
  include?: OwnedAssetInclude,
): (OwnedAsset | PartialOwnedAsset)[] {
  return raw.map((value) =>
    include == null ? parseOwnedAsset(value) : parseOwnedAsset(value, include),
  );
}

function ownedTokenFromRaw(value: unknown): OwnedToken {
  const raw = rawRecord(value);
  const base = parseV3OwnedToken(raw);
  return OwnedTokenSchema.parse({
    ...base,
    digitalAssetAddress: base.assetAddress,
    holderAddress: base.ownerAddress,
    blockNumber: base.lastBlockNumber,
    timestamp: null,
    transactionIndex: base.lastTransactionIndex,
    logIndex: base.lastLogIndex,
    digitalAsset: raw.digitalAsset == null ? null : digitalAssetFromRaw(raw.digitalAsset),
    nft: raw.nft == null ? null : nftFromRaw(raw.nft),
    ownedAsset: raw.ownedAsset == null ? null : ownedAssetFromRaw(raw.ownedAsset),
    holder: raw.universalProfile == null ? null : profileFromRaw(raw.universalProfile),
  });
}

export function parseOwnedToken(raw: unknown): OwnedToken;
export function parseOwnedToken(raw: unknown, include: OwnedTokenInclude): PartialOwnedToken;
export function parseOwnedToken(
  raw: unknown,
  include?: OwnedTokenInclude,
): OwnedToken | PartialOwnedToken {
  const ownedToken = ownedTokenFromRaw(raw);
  return include == null ? ownedToken : stripIncluded(ownedToken, include, OWNED_TOKEN_STRIP);
}

export function parseOwnedTokens(raw: unknown[]): OwnedToken[];
export function parseOwnedTokens(raw: unknown[], include: OwnedTokenInclude): PartialOwnedToken[];
export function parseOwnedTokens(
  raw: unknown[],
  include?: OwnedTokenInclude,
): (OwnedToken | PartialOwnedToken)[] {
  return raw.map((value) =>
    include == null ? parseOwnedToken(value) : parseOwnedToken(value, include),
  );
}

function followerFromRaw(value: unknown): Follower {
  const raw = rawRecord(value);
  const base = parseV3Follower(raw);
  return FollowerSchema.parse({
    ...base,
    timestamp: base.followedAt,
    address: null,
    blockNumber: base.lastBlockNumber,
    transactionIndex: base.lastTransactionIndex,
    logIndex: base.lastLogIndex,
    followerProfile: raw.followerProfile == null ? null : profileFromRaw(raw.followerProfile),
    followedProfile: raw.followedProfile == null ? null : profileFromRaw(raw.followedProfile),
  });
}

export function parseFollower(raw: unknown): Follower;
export function parseFollower(raw: unknown, include: FollowerInclude): PartialFollower;
export function parseFollower(raw: unknown, include?: FollowerInclude): Follower | PartialFollower {
  const follower = followerFromRaw(raw);
  return include == null ? follower : stripIncluded(follower, include, FOLLOWER_STRIP);
}

export function parseFollowers(raw: unknown[]): Follower[];
export function parseFollowers(raw: unknown[], include: FollowerInclude): PartialFollower[];
export function parseFollowers(
  raw: unknown[],
  include?: FollowerInclude,
): (Follower | PartialFollower)[] {
  return raw.map((value) =>
    include == null ? parseFollower(value) : parseFollower(value, include),
  );
}

function creatorFromRaw(value: unknown): Creator {
  const raw = rawRecord(value);
  const base = parseV3Creator(raw);
  return CreatorSchema.parse({
    ...base,
    digitalAssetAddress: base.assetAddress,
    arrayIndex: safeLegacyArrayIndex(base.arrayIndex, 'arrayIndex'),
    timestamp: null,
    blockNumber: base.lastBlockNumber,
    transactionIndex: base.lastTransactionIndex,
    logIndex: base.lastLogIndex,
    creatorProfile: raw.creatorProfile == null ? null : profileFromRaw(raw.creatorProfile),
    digitalAsset: raw.digitalAsset == null ? null : digitalAssetFromRaw(raw.digitalAsset),
  });
}

export function parseCreator(raw: unknown): Creator;
export function parseCreator(raw: unknown, include: CreatorInclude): PartialCreator;
export function parseCreator(raw: unknown, include?: CreatorInclude): Creator | PartialCreator {
  const creator = creatorFromRaw(raw);
  return include == null ? creator : stripIncluded(creator, include, CREATOR_STRIP);
}

export function parseCreators(raw: unknown[]): Creator[];
export function parseCreators(raw: unknown[], include: CreatorInclude): PartialCreator[];
export function parseCreators(
  raw: unknown[],
  include?: CreatorInclude,
): (Creator | PartialCreator)[] {
  return raw.map((value) => (include == null ? parseCreator(value) : parseCreator(value, include)));
}

function issuedAssetFromRaw(value: unknown): IssuedAsset {
  const raw = rawRecord(value);
  const base = parseV3IssuedAsset(raw);
  return IssuedAssetSchema.parse({
    ...base,
    arrayIndex: safeLegacyArrayIndex(base.arrayIndex, 'arrayIndex'),
    timestamp: null,
    blockNumber: base.lastBlockNumber,
    transactionIndex: base.lastTransactionIndex,
    logIndex: base.lastLogIndex,
    issuerProfile: raw.issuerProfile == null ? null : profileFromRaw(raw.issuerProfile),
    digitalAsset: raw.digitalAsset == null ? null : digitalAssetFromRaw(raw.digitalAsset),
  });
}

export function parseIssuedAsset(raw: unknown): IssuedAsset;
export function parseIssuedAsset(raw: unknown, include: IssuedAssetInclude): PartialIssuedAsset;
export function parseIssuedAsset(
  raw: unknown,
  include?: IssuedAssetInclude,
): IssuedAsset | PartialIssuedAsset {
  const issuedAsset = issuedAssetFromRaw(raw);
  return include == null ? issuedAsset : stripIncluded(issuedAsset, include, ISSUED_ASSET_STRIP);
}

export function parseIssuedAssets(raw: unknown[]): IssuedAsset[];
export function parseIssuedAssets(
  raw: unknown[],
  include: IssuedAssetInclude,
): PartialIssuedAsset[];
export function parseIssuedAssets(
  raw: unknown[],
  include?: IssuedAssetInclude,
): (IssuedAsset | PartialIssuedAsset)[] {
  return raw.map((value) =>
    include == null ? parseIssuedAsset(value) : parseIssuedAsset(value, include),
  );
}

function eventRelations(raw: Record<string, unknown>): {
  universalProfile: Profile | null;
  digitalAsset: DigitalAsset | null;
} {
  return {
    universalProfile: raw.universalProfile == null ? null : profileFromRaw(raw.universalProfile),
    digitalAsset: raw.digitalAsset == null ? null : digitalAssetFromRaw(raw.digitalAsset),
  };
}

function dataChangedEventFromRaw(value: unknown): DataChangedEvent {
  const raw = rawRecord(value);
  const event = parseV3EventFact(raw);
  const decoded = rawRecord(event.decoded, 'decoded');
  const dataKey = rawNullableString(decoded.dataKey, 'decoded.dataKey');
  const dataValue = rawNullableString(decoded.dataValue, 'decoded.dataValue');
  if (dataKey == null || dataValue == null) throw new TypeError('DataChanged payload is malformed');
  return DataChangedEventSchema.parse({
    ...event,
    dataKey,
    dataValue,
    dataKeyName: resolveDataKeyName(dataKey),
    ...eventRelations(raw),
  });
}

export function parseDataChangedEvent(raw: unknown): DataChangedEvent;
export function parseDataChangedEvent(
  raw: unknown,
  include: DataChangedEventInclude,
): PartialDataChangedEvent;
export function parseDataChangedEvent(
  raw: unknown,
  include?: DataChangedEventInclude,
): DataChangedEvent | PartialDataChangedEvent {
  const event = dataChangedEventFromRaw(raw);
  return include == null ? event : stripIncluded(event, include, DATA_CHANGED_STRIP);
}

export function parseDataChangedEvents(raw: unknown[]): DataChangedEvent[];
export function parseDataChangedEvents(
  raw: unknown[],
  include: DataChangedEventInclude,
): PartialDataChangedEvent[];
export function parseDataChangedEvents(
  raw: unknown[],
  include?: DataChangedEventInclude,
): (DataChangedEvent | PartialDataChangedEvent)[] {
  return raw.map((value) =>
    include == null ? parseDataChangedEvent(value) : parseDataChangedEvent(value, include),
  );
}

function tokenIdDataChangedEventFromRaw(value: unknown): TokenIdDataChangedEvent {
  const raw = rawRecord(value);
  const event = parseV3EventFact(raw);
  const decoded = rawRecord(event.decoded, 'decoded');
  const dataKey = rawNullableString(decoded.dataKey, 'decoded.dataKey');
  const dataValue = rawNullableString(decoded.dataValue, 'decoded.dataValue');
  const tokenId = rawNullableString(decoded.tokenId, 'decoded.tokenId');
  if (dataKey == null || dataValue == null || tokenId == null) {
    throw new TypeError('TokenIdDataChanged payload is malformed');
  }
  return TokenIdDataChangedEventSchema.parse({
    ...event,
    dataKey,
    dataValue,
    tokenId,
    dataKeyName: resolveDataKeyName(dataKey),
    digitalAsset: raw.digitalAsset == null ? null : digitalAssetFromRaw(raw.digitalAsset),
    nft: null,
  });
}

export function parseTokenIdDataChangedEvent(raw: unknown): TokenIdDataChangedEvent;
export function parseTokenIdDataChangedEvent(
  raw: unknown,
  include: TokenIdDataChangedEventInclude,
): PartialTokenIdDataChangedEvent;
export function parseTokenIdDataChangedEvent(
  raw: unknown,
  include?: TokenIdDataChangedEventInclude,
): TokenIdDataChangedEvent | PartialTokenIdDataChangedEvent {
  const event = tokenIdDataChangedEventFromRaw(raw);
  return include == null ? event : stripIncluded(event, include, TOKEN_DATA_CHANGED_STRIP);
}

export function parseTokenIdDataChangedEvents(raw: unknown[]): TokenIdDataChangedEvent[];
export function parseTokenIdDataChangedEvents(
  raw: unknown[],
  include: TokenIdDataChangedEventInclude,
): PartialTokenIdDataChangedEvent[];
export function parseTokenIdDataChangedEvents(
  raw: unknown[],
  include?: TokenIdDataChangedEventInclude,
): (TokenIdDataChangedEvent | PartialTokenIdDataChangedEvent)[] {
  return raw.map((value) =>
    include == null
      ? parseTokenIdDataChangedEvent(value)
      : parseTokenIdDataChangedEvent(value, include),
  );
}

function universalReceiverEventFromRaw(value: unknown): UniversalReceiverEvent {
  const raw = rawRecord(value);
  const event = parseV3EventFact(raw);
  const decoded = rawRecord(event.decoded, 'decoded');
  const from = rawNullableString(decoded.from, 'decoded.from');
  const typeId = rawNullableString(decoded.typeId, 'decoded.typeId');
  if (from == null || typeId == null) throw new TypeError('UniversalReceiver payload is malformed');
  const amount = rawNullableString(decoded.value, 'decoded.value');
  return UniversalReceiverEventSchema.parse({
    ...event,
    from,
    typeId,
    typeIdName: resolveTypeIdName(typeId),
    value: amount == null ? null : BigInt(amount),
    receivedData: rawNullableString(decoded.receivedData, 'decoded.receivedData'),
    returnedValue: rawNullableString(decoded.returnedValue, 'decoded.returnedValue'),
    universalProfile: raw.universalProfile == null ? null : profileFromRaw(raw.universalProfile),
    fromProfile: null,
    fromAsset: null,
  });
}

export function parseUniversalReceiverEvent(raw: unknown): UniversalReceiverEvent;
export function parseUniversalReceiverEvent(
  raw: unknown,
  include: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent;
export function parseUniversalReceiverEvent(
  raw: unknown,
  include?: UniversalReceiverEventInclude,
): UniversalReceiverEvent | PartialUniversalReceiverEvent {
  const event = universalReceiverEventFromRaw(raw);
  return include == null ? event : stripIncluded(event, include, UNIVERSAL_RECEIVER_STRIP);
}

export function parseUniversalReceiverEvents(raw: unknown[]): UniversalReceiverEvent[];
export function parseUniversalReceiverEvents(
  raw: unknown[],
  include: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent[];
export function parseUniversalReceiverEvents(
  raw: unknown[],
  include?: UniversalReceiverEventInclude,
): (UniversalReceiverEvent | PartialUniversalReceiverEvent)[] {
  return raw.map((value) =>
    include == null
      ? parseUniversalReceiverEvent(value)
      : parseUniversalReceiverEvent(value, include),
  );
}

function encryptedAssetFromRaw(value: unknown): EncryptedAsset {
  const raw = rawRecord(value);
  const content = optionalRecord(raw.content);
  const metadata = optionalRecord(content?.LSP29EncryptedAsset);
  const encryption = optionalRecord(metadata?.encryption);
  const params = optionalRecord(encryption?.params);
  const file = optionalRecord(metadata?.file);
  const chunks = optionalRecord(metadata?.chunks);
  const ipfs = optionalRecord(chunks?.ipfs);
  const lumera = optionalRecord(chunks?.lumera);
  const arweave = optionalRecord(chunks?.arweave);
  const s3 = optionalRecord(chunks?.s3);
  return EncryptedAssetSchema.parse({
    id: rawNullableString(raw.id, 'id'),
    network: rawNullableString(raw.network, 'network'),
    chainId: rawSafeInteger(raw.chainId, 'chainId'),
    address: rawNullableString(raw.address, 'address'),
    contentId: optionalString(metadata?.id),
    revision: optionalNumber(metadata?.revision),
    arrayIndex: null,
    timestamp: rawNullableString(raw.fetchedAt, 'fetchedAt'),
    blockNumber: rawSafeInteger(raw.lastBlockNumber, 'lastBlockNumber'),
    transactionIndex: rawNullableSafeInteger(raw.lastTransactionIndex, 'lastTransactionIndex'),
    logIndex: rawNullableSafeInteger(raw.lastLogIndex, 'lastLogIndex'),
    title: optionalString(metadata?.title),
    description: optionalString(metadata?.description),
    encryption:
      encryption == null
        ? null
        : {
            provider: optionalString(encryption.provider),
            method: optionalString(encryption.method),
            condition: encryption.condition == null ? null : JSON.stringify(encryption.condition),
            encryptedKey:
              encryption.encryptedKey == null ? null : JSON.stringify(encryption.encryptedKey),
            tokenAddress: optionalString(params?.tokenAddress),
            requiredBalance: optionalString(params?.requiredBalance),
            requiredTokenId: optionalString(params?.requiredTokenId),
            followedAddresses: stringList(params?.followedAddresses),
            unlockTimestamp: optionalString(params?.unlockTimestamp),
          },
    file:
      file == null
        ? null
        : {
            hash: optionalString(file.hash),
            lastModified: optionalNumber(file.lastModified),
            name: optionalString(file.name),
            size: optionalNumber(file.size),
            type: optionalString(file.type),
          },
    chunks:
      chunks == null
        ? null
        : {
            iv: optionalString(chunks.iv),
            totalSize: optionalNumber(chunks.totalSize),
            ipfsCids: stringList(ipfs?.cids),
            lumeraActionIds: stringList(lumera?.actionIds),
            arweaveTransactionIds: stringList(arweave?.transactionIds),
            s3Keys: stringList(s3?.keys),
            s3Bucket: optionalString(s3?.bucket),
            s3Region: optionalString(s3?.region),
          },
    images: imageGroups(metadata?.images),
    universalProfile: raw.universalProfile == null ? null : profileFromRaw(raw.universalProfile),
    dataKey: rawNullableString(raw.dataKey, 'dataKey'),
    sourceRevision: rawNullableString(raw.sourceRevision, 'sourceRevision'),
    contentUri: rawNullableString(raw.contentUri, 'contentUri'),
    contentHash: rawNullableString(raw.contentHash, 'contentHash'),
    contentType: rawNullableString(raw.contentType, 'contentType'),
    contentLength: rawNullableSafeInteger(raw.contentLength, 'contentLength'),
    fetchedAt: rawNullableString(raw.fetchedAt, 'fetchedAt'),
    lastBlockNumber: rawSafeInteger(raw.lastBlockNumber, 'lastBlockNumber'),
    lastBlockHash: rawNullableString(raw.lastBlockHash, 'lastBlockHash'),
    lastTransactionHash: rawNullableString(raw.lastTransactionHash, 'lastTransactionHash'),
    lastTransactionIndex: rawNullableSafeInteger(raw.lastTransactionIndex, 'lastTransactionIndex'),
    lastLogIndex: rawNullableSafeInteger(raw.lastLogIndex, 'lastLogIndex'),
  });
}

export function parseEncryptedAsset(raw: unknown): EncryptedAsset;
export function parseEncryptedAsset(
  raw: unknown,
  include: EncryptedAssetInclude,
): PartialEncryptedAsset;
export function parseEncryptedAsset(
  raw: unknown,
  include?: EncryptedAssetInclude,
): EncryptedAsset | PartialEncryptedAsset {
  const encryptedAsset = encryptedAssetFromRaw(raw);
  return include == null
    ? encryptedAsset
    : stripIncluded(encryptedAsset, include, ENCRYPTED_ASSET_STRIP);
}

export function parseEncryptedAssets(raw: unknown[]): EncryptedAsset[];
export function parseEncryptedAssets(
  raw: unknown[],
  include: EncryptedAssetInclude,
): PartialEncryptedAsset[];
export function parseEncryptedAssets(
  raw: unknown[],
  include?: EncryptedAssetInclude,
): (EncryptedAsset | PartialEncryptedAsset)[] {
  return raw.map((value) =>
    include == null ? parseEncryptedAsset(value) : parseEncryptedAsset(value, include),
  );
}
