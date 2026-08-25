import { z } from 'zod';

import {
  AddressSchema,
  BlockRefSchema,
  ChainIdSchema,
  EventRefSchema,
  HashSchema,
  HexSchema,
  NetworkIdSchema,
  NetworkRefSchema,
  PaginationSchema,
  ProjectionRefSchema,
  SortDirectionSchema,
  SortNullsSchema,
  TimestampSchema,
  VerificationStatusSchema,
} from './common';

// ---------------------------------------------------------------------------
// GraphQL-neutral filtering, sorting, and includes
// ---------------------------------------------------------------------------

export const ScalarFilterSchema = z.object({
  eq: z.unknown().optional(),
  neq: z.unknown().optional(),
  in: z.array(z.unknown()).optional(),
  notIn: z.array(z.unknown()).optional(),
  gt: z.unknown().optional(),
  gte: z.unknown().optional(),
  lt: z.unknown().optional(),
  lte: z.unknown().optional(),
  isNull: z.boolean().optional(),
});

export const DomainSortSchema = z.object({
  field: z.string().min(1),
  direction: SortDirectionSchema,
  nulls: SortNullsSchema.optional(),
});

export const DomainIncludeSchema = z.record(z.string(), z.boolean());

export type ScalarFilter<T = unknown> = Omit<
  z.infer<typeof ScalarFilterSchema>,
  'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'gte' | 'lt' | 'lte'
> & {
  eq?: T;
  neq?: T;
  in?: T[];
  notIn?: T[];
  gt?: T;
  gte?: T;
  lt?: T;
  lte?: T;
};

type DomainFilterLogic<Field extends string> = {
  and?: DomainFilter<Field>[];
  or?: DomainFilter<Field>[];
  not?: DomainFilter<Field>;
};

export type DomainFilter<Field extends string = string> = string extends Field
  ? Record<string, ScalarFilter | DomainFilter<Field>[] | DomainFilter<Field> | undefined> &
      DomainFilterLogic<Field>
  : Partial<Record<Field, ScalarFilter>> & DomainFilterLogic<Field>;

export type DomainSort<Field extends string = string> = {
  field: Field;
  direction: z.infer<typeof SortDirectionSchema>;
  nulls?: z.infer<typeof SortNullsSchema>;
};

export type DomainInclude<Relation extends string = string> = Partial<Record<Relation, boolean>>;

export interface V3ListParams<Field extends string = string> {
  network: z.infer<typeof NetworkIdSchema>;
  filter?: DomainFilter<Field>;
  sort?: DomainSort<Field>[];
  limit?: number;
  offset?: number;
}

export interface V3ListResult<T> {
  items: T[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Public v3 API records
// ---------------------------------------------------------------------------

const IdSchema = z.string().min(1);
const NullableAddressSchema = AddressSchema.nullable();
const NullableHashSchema = HashSchema.nullable();

export const V3BlockSchema = BlockRefSchema.extend({
  id: IdSchema,
  number: z.number().int().nonnegative().safe(),
  hash: HashSchema,
  parentHash: HashSchema,
});

export const V3EventFactSchema = EventRefSchema.extend({
  id: IdSchema,
  parentHash: HashSchema,
  address: AddressSchema,
  topic0: HashSchema,
  topics: z.array(HashSchema).min(1),
  data: HexSchema,
  eventName: z.string().nullable(),
  eventDomain: z.string().nullable(),
  decoded: z.record(z.string(), z.unknown()).nullable(),
});

export const V3UniversalProfileSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  address: AddressSchema,
  ownerAddress: NullableAddressSchema,
  verification: VerificationStatusSchema,
});

export const V3DigitalAssetSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  address: AddressSchema,
  ownerAddress: NullableAddressSchema,
  standard: z.enum(['unknown', 'lsp7', 'lsp8']),
  tokenType: z.number().int().safe().nullable(),
  name: z.string().nullable(),
  symbol: z.string().nullable(),
  decimals: z.number().int().nonnegative().safe().nullable(),
  totalSupply: z.bigint().nonnegative().nullable(),
  tokenIdFormat: z.number().int().safe().nullable(),
  tokenIdReferenceContract: NullableAddressSchema,
  baseUri: z.string().nullable(),
  verification: VerificationStatusSchema,
});

export const V3NftSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  address: AddressSchema,
  tokenId: HashSchema,
  formattedTokenId: z.string().nullable(),
  isMinted: z.boolean(),
  isBurned: z.boolean(),
  ownerAddress: NullableAddressSchema,
  tokenUri: z.string().nullable(),
  verification: VerificationStatusSchema,
});

export const V3OwnedAssetSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  ownerAddress: AddressSchema,
  assetAddress: AddressSchema,
  balance: z.bigint().nonnegative(),
});

export const V3OwnedTokenSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  ownerAddress: AddressSchema,
  assetAddress: AddressSchema,
  tokenId: HashSchema,
  balance: z.bigint().nonnegative(),
});

export const V3FollowerSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  followerAddress: AddressSchema,
  followedAddress: AddressSchema,
  isFollowing: z.boolean(),
  followedAt: TimestampSchema.nullable(),
  unfollowedAt: TimestampSchema.nullable(),
});

export const V3CreatorSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  assetAddress: AddressSchema,
  creatorAddress: AddressSchema,
  arrayIndex: z.bigint().nonnegative(),
  interfaceId: HexSchema.nullable(),
  verified: z.boolean(),
});

export const V3IssuedAssetSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  issuerAddress: AddressSchema,
  assetAddress: AddressSchema,
  arrayIndex: z.bigint().nonnegative(),
  interfaceId: HexSchema.nullable(),
});

export const V3ControllerSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  profileAddress: AddressSchema,
  controllerAddress: AddressSchema,
  arrayIndex: z.bigint().nonnegative(),
  permissions: HexSchema.nullable(),
  allowedCalls: z.unknown().nullable(),
  allowedDataKeys: z.unknown().nullable(),
});

export const V3ChillwhalesNftSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  address: AddressSchema,
  tokenId: HashSchema,
  chillClaimed: z.boolean(),
  orbsClaimed: z.boolean(),
  claimCheckAfterBlock: z.number().int().nonnegative().safe(),
  level: z.number().int().nonnegative().safe().nullable(),
  cooldownExpiry: z.number().int().nonnegative().safe().nullable(),
  faction: z.string().nullable(),
});

export const V3DataValueSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  address: AddressSchema,
  tokenId: HashSchema.nullable(),
  dataKey: HashSchema,
  dataValue: HexSchema,
});

export const MetadataKindSchema = z.enum([
  'lsp3_profile',
  'lsp4_asset',
  'lsp4_token',
  'lsp29_encrypted_asset',
  'extension',
]);

export const V3MetadataRevisionSchema = ProjectionRefSchema.extend({
  id: IdSchema,
  address: AddressSchema,
  tokenId: HashSchema.nullable(),
  dataKey: HashSchema,
  kind: MetadataKindSchema,
  /** Hash of the source data value or URI that produced this immutable revision. */
  sourceRevision: HashSchema,
  contentUri: z.string(),
  contentHash: NullableHashSchema,
  contentType: z.string().nullable(),
  contentLength: z.number().int().nonnegative().safe().nullable(),
  content: z.unknown(),
  fetchedAt: TimestampSchema,
});

export const V3IndexedHeadSchema = NetworkRefSchema.extend({
  blockNumber: z.number().int().nonnegative().safe(),
  blockHash: HashSchema,
  blockTimestamp: TimestampSchema,
  finalizedBlockNumber: z.number().int().nonnegative().safe().nullable(),
  finalizedBlockHash: NullableHashSchema,
  updatedAt: TimestampSchema,
});

export type V3Block = z.infer<typeof V3BlockSchema>;
export type V3EventFact = z.infer<typeof V3EventFactSchema>;
export type V3UniversalProfile = z.infer<typeof V3UniversalProfileSchema>;
export type V3DigitalAsset = z.infer<typeof V3DigitalAssetSchema>;
export type V3Nft = z.infer<typeof V3NftSchema>;
export type V3OwnedAsset = z.infer<typeof V3OwnedAssetSchema>;
export type V3OwnedToken = z.infer<typeof V3OwnedTokenSchema>;
export type V3Follower = z.infer<typeof V3FollowerSchema>;
export type V3Creator = z.infer<typeof V3CreatorSchema>;
export type V3IssuedAsset = z.infer<typeof V3IssuedAssetSchema>;
export type V3Controller = z.infer<typeof V3ControllerSchema>;
export type V3ChillwhalesNft = z.infer<typeof V3ChillwhalesNftSchema>;
export type V3DataValue = z.infer<typeof V3DataValueSchema>;
export type V3MetadataRevision = z.infer<typeof V3MetadataRevisionSchema>;
export type V3IndexedHead = z.infer<typeof V3IndexedHeadSchema>;
export type MetadataKind = z.infer<typeof MetadataKindSchema>;

export const V3DomainSchema = z.enum([
  'blocks',
  'events',
  'profiles',
  'digitalAssets',
  'nfts',
  'ownedAssets',
  'ownedTokens',
  'followers',
  'creators',
  'issuedAssets',
  'controllers',
  'chillwhalesNfts',
  'dataValues',
  'metadataRevisions',
  'indexedHeads',
]);

export type V3Domain = z.infer<typeof V3DomainSchema>;

export interface V3DomainResultMap {
  blocks: V3Block;
  events: V3EventFact;
  profiles: V3UniversalProfile;
  digitalAssets: V3DigitalAsset;
  nfts: V3Nft;
  ownedAssets: V3OwnedAsset;
  ownedTokens: V3OwnedToken;
  followers: V3Follower;
  creators: V3Creator;
  issuedAssets: V3IssuedAsset;
  controllers: V3Controller;
  chillwhalesNfts: V3ChillwhalesNft;
  dataValues: V3DataValue;
  metadataRevisions: V3MetadataRevision;
  indexedHeads: V3IndexedHead;
}

export const V3ListParamsSchema = z
  .object({
    network: NetworkIdSchema,
    // Domain field names differ per root. The Node query builder validates the
    // recursive operators against that root's allowlist before making a request.
    filter: z.record(z.string(), z.unknown()).optional(),
    sort: z.array(DomainSortSchema).optional(),
  })
  .extend(PaginationSchema.shape);

export type V3ListInput = z.infer<typeof V3ListParamsSchema>;

// Keep these schema imports exercised and re-export the scalar contracts through this module.
export const V3ScalarSchemas = {
  address: AddressSchema,
  chainId: ChainIdSchema,
  hash: HashSchema,
  network: NetworkIdSchema,
} as const;
