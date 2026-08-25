import {
  AddressSchema,
  HashSchema,
  HexSchema,
  NetworkIdSchema,
  TimestampSchema,
  type DomainSort,
  type V3Block,
  type V3ChillwhalesNft,
  type V3Controller,
  type V3Creator,
  type V3DataValue,
  type V3DigitalAsset,
  type V3Domain,
  type V3DomainResultMap,
  type V3EventFact,
  type V3Follower,
  type V3IndexedHead,
  type V3IssuedAsset,
  type V3ListParams,
  type V3ListResult,
  type V3MetadataRevision,
  type V3Nft,
  type V3OwnedAsset,
  type V3OwnedToken,
  type V3UniversalProfile,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { IndexerError } from '../errors';
import type {
  TypedDocumentString,
  V3BlocksQueryVariables,
  V3ChillwhalesNftsQueryVariables,
  V3ControllersQueryVariables,
  V3CreatorsQueryVariables,
  V3DataValuesQueryVariables,
  V3DigitalAssetsQueryVariables,
  V3EventsQueryVariables,
  V3FollowersQueryVariables,
  V3IndexedHeadsQueryVariables,
  V3IssuedAssetsQueryVariables,
  V3MetadataRevisionsQueryVariables,
  V3NftsQueryVariables,
  V3OwnedAssetsQueryVariables,
  V3OwnedTokensQueryVariables,
  V3UniversalProfilesQueryVariables,
} from '../graphql/graphql';
import {
  V3BlocksDocument,
  V3ChillwhalesNftsDocument,
  V3ControllersDocument,
  V3CreatorsDocument,
  V3DataValuesDocument,
  V3DigitalAssetsDocument,
  V3EventsDocument,
  V3FollowersDocument,
  V3IndexedHeadsDocument,
  V3IssuedAssetsDocument,
  V3MetadataRevisionsDocument,
  V3NftsDocument,
  V3OwnedAssetsDocument,
  V3OwnedTokensDocument,
  V3UniversalProfilesDocument,
} from './operations';
import {
  parseV3Block,
  parseV3ChillwhalesNft,
  parseV3Controller,
  parseV3Creator,
  parseV3DataValue,
  parseV3DigitalAsset,
  parseV3EventFact,
  parseV3Follower,
  parseV3IndexedHead,
  parseV3IssuedAsset,
  parseV3MetadataRevision,
  parseV3Nft,
  parseV3OwnedAsset,
  parseV3OwnedToken,
  parseV3UniversalProfile,
} from './parsers';

type FieldMap = Readonly<Record<string, string>>;

interface QueryEnvelope {
  items: unknown[];
  total: { aggregate?: { count: number } | null };
}

interface RuntimeListParams {
  network: string;
  filter?: unknown;
  sort?: DomainSort[];
  limit?: number;
  offset?: number;
}

const OPERATOR_MAP = {
  eq: '_eq',
  neq: '_neq',
  in: '_in',
  notIn: '_nin',
  gt: '_gt',
  gte: '_gte',
  lt: '_lt',
  lte: '_lte',
  isNull: '_is_null',
} as const;

function invalidInput(path: string, message: string): never {
  throw IndexerError.fromValidationError([{ path: path.split('.'), message }], 'v3 list');
}

const BLOCK_FIELDS = {
  id: 'id',
  network: 'network',
  chainId: 'chain_id',
  number: 'number',
  hash: 'hash',
  parentHash: 'parent_hash',
  timestamp: 'timestamp',
} as const;

const EVENT_FIELDS = {
  id: 'id',
  network: 'network',
  chainId: 'chain_id',
  blockNumber: 'block_number',
  blockHash: 'block_hash',
  transactionHash: 'transaction_hash',
  transactionIndex: 'transaction_index',
  logIndex: 'log_index',
  address: 'address',
  topic0: 'topic0',
  eventName: 'event_name',
  eventDomain: 'event_domain',
} as const;

const PROJECTION_FIELDS = {
  id: 'id',
  network: 'network',
  chainId: 'chain_id',
  lastBlockNumber: 'last_block_number',
  lastBlockHash: 'last_block_hash',
  lastTransactionHash: 'last_transaction_hash',
  lastTransactionIndex: 'last_transaction_index',
  lastLogIndex: 'last_log_index',
} as const;

const PROFILE_FIELDS = {
  ...PROJECTION_FIELDS,
  address: 'address',
  ownerAddress: 'owner_address',
  verification: 'verification',
} as const;

const DIGITAL_ASSET_FIELDS = {
  ...PROFILE_FIELDS,
  standard: 'standard',
  tokenType: 'token_type',
  name: 'name',
  symbol: 'symbol',
  decimals: 'decimals',
  totalSupply: 'total_supply',
  tokenIdFormat: 'token_id_format',
  tokenIdReferenceContract: 'token_id_reference_contract',
  baseUri: 'base_uri',
} as const;

const NFT_FIELDS = {
  ...PROFILE_FIELDS,
  tokenId: 'token_id',
  formattedTokenId: 'formatted_token_id',
  isMinted: 'is_minted',
  isBurned: 'is_burned',
  tokenUri: 'token_uri',
} as const;

const OWNED_ASSET_FIELDS = {
  ...PROJECTION_FIELDS,
  ownerAddress: 'owner_address',
  assetAddress: 'asset_address',
  balance: 'balance',
} as const;

const OWNED_TOKEN_FIELDS = {
  ...OWNED_ASSET_FIELDS,
  tokenId: 'token_id',
} as const;

const FOLLOWER_FIELDS = {
  ...PROJECTION_FIELDS,
  followerAddress: 'follower_address',
  followedAddress: 'followed_address',
  isFollowing: 'is_following',
  followedAt: 'followed_at',
  unfollowedAt: 'unfollowed_at',
} as const;

const CREATOR_FIELDS = {
  ...PROJECTION_FIELDS,
  assetAddress: 'asset_address',
  creatorAddress: 'creator_address',
  arrayIndex: 'array_index',
  interfaceId: 'interface_id',
  verified: 'verified',
} as const;

const ISSUED_ASSET_FIELDS = {
  ...PROJECTION_FIELDS,
  issuerAddress: 'issuer_address',
  assetAddress: 'asset_address',
  arrayIndex: 'array_index',
  interfaceId: 'interface_id',
} as const;

const CONTROLLER_FIELDS = {
  ...PROJECTION_FIELDS,
  profileAddress: 'profile_address',
  controllerAddress: 'controller_address',
  arrayIndex: 'array_index',
  permissions: 'permissions',
} as const;

const CHILLWHALES_FIELDS = {
  ...PROJECTION_FIELDS,
  address: 'address',
  tokenId: 'token_id',
  chillClaimed: 'chill_claimed',
  orbsClaimed: 'orbs_claimed',
  claimCheckAfterBlock: 'claim_check_after_block',
  level: 'level',
  cooldownExpiry: 'cooldown_expiry',
  faction: 'faction',
} as const;

const DATA_VALUE_FIELDS = {
  ...PROJECTION_FIELDS,
  address: 'address',
  tokenId: 'token_id',
  dataKey: 'data_key',
  dataValue: 'data_value',
} as const;

const METADATA_REVISION_FIELDS = {
  ...PROJECTION_FIELDS,
  address: 'address',
  tokenId: 'token_id',
  dataKey: 'data_key',
  kind: 'kind',
  sourceRevision: 'source_revision',
  contentUri: 'content_uri',
  contentHash: 'content_hash',
  contentType: 'content_type',
  contentLength: 'content_length',
  fetchedAt: 'fetched_at',
  isCurrent: 'is_current',
} as const;

const PROJECTION_RECENCY_ORDER: Record<string, string>[] = [
  { last_block_number: 'desc' },
  { last_transaction_index: 'desc_nulls_last' },
  { last_log_index: 'desc_nulls_last' },
];

const INDEXED_HEAD_FIELDS = {
  network: 'network',
  chainId: 'chain_id',
  blockNumber: 'block_number',
  blockHash: 'block_hash',
  blockTimestamp: 'block_timestamp',
  finalizedBlockNumber: 'finalized_block_number',
  finalizedBlockHash: 'finalized_block_hash',
  updatedAt: 'updated_at',
} as const;

function validatePagination(limit?: number, offset?: number): void {
  if (limit != null && (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)) {
    throw IndexerError.fromValidationError(
      [{ path: ['limit'], message: 'Must be an integer between 1 and 100' }],
      'v3 list',
    );
  }
  if (offset != null && (!Number.isSafeInteger(offset) || offset < 0)) {
    throw IndexerError.fromValidationError(
      [{ path: ['offset'], message: 'Must be a non-negative integer' }],
      'v3 list',
    );
  }
}

const ADDRESS_FIELDS = new Set([
  'address',
  'assetAddress',
  'controllerAddress',
  'creatorAddress',
  'followedAddress',
  'followerAddress',
  'issuerAddress',
  'ownerAddress',
  'profileAddress',
  'tokenIdReferenceContract',
]);
const HASH_FIELDS = new Set([
  'blockHash',
  'contentHash',
  'dataKey',
  'finalizedBlockHash',
  'hash',
  'lastBlockHash',
  'lastTransactionHash',
  'parentHash',
  'sourceRevision',
  'tokenId',
  'topic0',
  'transactionHash',
]);
const HEX_FIELDS = new Set(['dataValue', 'interfaceId', 'permissions']);
const BIGINT_FIELDS = new Set([
  'arrayIndex',
  'balance',
  'blockNumber',
  'chainId',
  'claimCheckAfterBlock',
  'cooldownExpiry',
  'finalizedBlockNumber',
  'lastBlockNumber',
  'number',
  'totalSupply',
]);
const INTEGER_FIELDS = new Set([
  'contentLength',
  'decimals',
  'lastLogIndex',
  'lastTransactionIndex',
  'level',
  'logIndex',
  'tokenIdFormat',
  'tokenType',
  'transactionIndex',
]);
const BOOLEAN_FIELDS = new Set([
  'chillClaimed',
  'isBurned',
  'isCurrent',
  'isFollowing',
  'isMinted',
  'orbsClaimed',
  'verified',
]);
const TIMESTAMP_FIELDS = new Set([
  'blockTimestamp',
  'fetchedAt',
  'followedAt',
  'timestamp',
  'unfollowedAt',
  'updatedAt',
]);
const ENUM_FIELDS: Readonly<Record<string, ReadonlySet<string>>> = {
  kind: new Set(['extension', 'lsp3_profile', 'lsp4_asset', 'lsp4_token', 'lsp29_encrypted_asset']),
  standard: new Set(['unknown', 'lsp7', 'lsp8']),
  verification: new Set(['unknown', 'verified', 'invalid']),
};

interface RuntimeStringSchema {
  safeParse(
    value: unknown,
  ):
    | { success: true; data: string }
    | { success: false; error: { issues: Array<{ message: string }> } };
}

function schemaValue(schema: RuntimeStringSchema, value: unknown, path: string): string {
  const parsed = schema.safeParse(value);
  if (!parsed.success) invalidInput(path, parsed.error.issues[0]?.message ?? 'Invalid value');
  return parsed.data;
}

function bigintValue(value: unknown, path: string): string {
  if (typeof value === 'bigint') {
    if (value < 0n) invalidInput(path, 'Must be a non-negative integer');
    return value.toString();
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      invalidInput(path, 'Must be a non-negative lossless integer');
    }
    return String(value);
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    invalidInput(path, 'Must be a non-negative integer');
  }
  return BigInt(value).toString();
}

function normalizeFilterScalar(field: string, value: unknown, path: string): unknown {
  if (value == null) invalidInput(path, 'Use isNull to filter null values');
  if (ADDRESS_FIELDS.has(field)) return schemaValue(AddressSchema, value, path);
  if (HASH_FIELDS.has(field)) return schemaValue(HashSchema, value, path);
  if (HEX_FIELDS.has(field)) return schemaValue(HexSchema, value, path);
  if (BIGINT_FIELDS.has(field)) return bigintValue(value, path);
  if (INTEGER_FIELDS.has(field)) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
      invalidInput(path, 'Must be a non-negative safe integer');
    }
    return value;
  }
  if (BOOLEAN_FIELDS.has(field)) {
    if (typeof value !== 'boolean') invalidInput(path, 'Must be a boolean');
    return value;
  }
  if (TIMESTAMP_FIELDS.has(field)) return schemaValue(TimestampSchema, value, path);
  if (field === 'network') return schemaValue(NetworkIdSchema, value, path);
  if (typeof value !== 'string') invalidInput(path, 'Must be a string');
  const allowedValues = ENUM_FIELDS[field];
  if (allowedValues != null && !allowedValues.has(value)) {
    invalidInput(path, `Must be one of ${[...allowedValues].join(', ')}`);
  }
  return value;
}

function normalizeFilterValue(
  field: string,
  operator: string,
  value: unknown,
  path: string,
): unknown {
  if (operator === 'isNull') {
    if (typeof value !== 'boolean') invalidInput(path, 'Must be a boolean');
    return value;
  }
  if (BOOLEAN_FIELDS.has(field) && ['gt', 'gte', 'lt', 'lte'].includes(operator)) {
    invalidInput(path, 'Boolean fields do not support range operators');
  }
  if (operator === 'in' || operator === 'notIn') {
    if (!Array.isArray(value)) invalidInput(path, 'Must be an array');
    return value.map((entry, index) => normalizeFilterScalar(field, entry, `${path}.${index}`));
  }
  if (Array.isArray(value)) invalidInput(path, 'Must be a scalar value');
  return normalizeFilterScalar(field, value, path);
}

function unknownEntries(value: object): [string, unknown][] {
  return Object.keys(value).map((key) => {
    const entry: unknown = Reflect.get(value, key);
    return [key, entry];
  });
}

function buildFilter(filter: unknown, fields: FieldMap): Record<string, unknown> {
  if (filter == null) return {};
  if (typeof filter !== 'object' || Array.isArray(filter)) {
    invalidInput('filter', 'Must be an object');
  }
  const result: Record<string, unknown> = {};

  for (const [field, condition] of unknownEntries(filter)) {
    if (field === 'and' || field === 'or') {
      if (!Array.isArray(condition)) invalidInput(`filter.${field}`, 'Must be an array');
      result[field === 'and' ? '_and' : '_or'] = condition.map((entry) => {
        if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
          invalidInput(`filter.${field}`, 'Entries must be filter objects');
        }
        return buildFilter(entry, fields);
      });
      continue;
    }
    if (field === 'not') {
      if (typeof condition !== 'object' || condition === null || Array.isArray(condition)) {
        invalidInput('filter.not', 'Must be a filter object');
      }
      result._not = buildFilter(condition, fields);
      continue;
    }

    const column = fields[field];
    if (!column) invalidInput(`filter.${field}`, 'Unsupported field');
    if (typeof condition !== 'object' || condition === null || Array.isArray(condition)) {
      invalidInput(`filter.${field}`, 'Must be an operator object');
    }
    const operators: Record<string, unknown> = {};
    for (const [operator, value] of unknownEntries(condition)) {
      if (value === undefined) continue;
      const graphqlOperator = OPERATOR_MAP[operator as keyof typeof OPERATOR_MAP];
      if (!graphqlOperator) invalidInput(`filter.${field}.${operator}`, 'Unsupported operator');
      const path = `filter.${field}.${operator}`;
      operators[graphqlOperator] = normalizeFilterValue(field, operator, value, path);
    }
    result[column] = operators;
  }

  return result;
}

function orderValue(sort: DomainSort): string {
  if (sort.direction !== 'asc' && sort.direction !== 'desc') {
    invalidInput('sort.direction', 'Must be asc or desc');
  }
  if (sort.nulls != null && sort.nulls !== 'first' && sort.nulls !== 'last') {
    invalidInput('sort.nulls', 'Must be first or last');
  }
  if (!sort.nulls) return sort.direction;
  return `${sort.direction}_nulls_${sort.nulls}`;
}

function buildOrder(
  sort: DomainSort[] | undefined,
  fields: FieldMap,
  defaults: Record<string, string>[],
  suffix: string[],
): Record<string, string>[] {
  if (sort != null && !Array.isArray(sort)) invalidInput('sort', 'Must be an array');
  const order = sort?.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      invalidInput(`sort.${index}`, 'Must be a sort object');
    }
    const column = fields[entry.field];
    if (!column) invalidInput(`sort.${entry.field}`, 'Unsupported field');
    return { [column]: orderValue(entry) };
  }) ?? [...defaults];
  const selected = new Set(order.flatMap((entry) => Object.keys(entry)));
  for (const column of suffix) {
    if (!selected.has(column)) order.push({ [column]: 'asc' });
  }
  return order;
}

function buildVariables(
  params: RuntimeListParams,
  fields: FieldMap,
  defaults: Record<string, string>[],
  suffix = ['chain_id', 'id'],
): Record<string, unknown> {
  const networkResult = NetworkIdSchema.safeParse(params.network);
  if (!networkResult.success) {
    throw IndexerError.fromValidationError(
      networkResult.error.issues.map((issue) => ({
        ...issue,
        path: ['network', ...issue.path],
      })),
      'v3 list',
    );
  }
  const network = networkResult.data;
  validatePagination(params.limit, params.offset);
  const domainFilter = buildFilter(params.filter, fields);
  const filters: Record<string, unknown>[] = [{ network: { _eq: network } }];
  if (Object.keys(domainFilter).length > 0) filters.push(domainFilter);
  return {
    where: { _and: filters },
    orderBy: buildOrder(params.sort, fields, defaults, suffix),
    limit: params.limit,
    offset: params.offset,
  };
}

async function fetchQuery<
  TResult extends QueryEnvelope,
  TVariables extends Record<string, unknown>,
  T,
>(
  url: string,
  document: TypedDocumentString<TResult, TVariables>,
  variables: TVariables,
  parser: (value: unknown) => T,
): Promise<V3ListResult<T>> {
  const result = await execute(url, document, variables);
  try {
    return {
      items: result.items.map(parser),
      totalCount: result.total.aggregate?.count ?? 0,
    };
  } catch (error) {
    throw new IndexerError({
      category: 'PARSE',
      code: 'PARSE_FAILED',
      message: `Invalid v3 API response: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error instanceof Error ? error : undefined,
      query: document.toString(),
    });
  }
}

export type V3BlockField = keyof typeof BLOCK_FIELDS;
export type V3EventField = keyof typeof EVENT_FIELDS;
export type V3UniversalProfileField = keyof typeof PROFILE_FIELDS;
export type V3DigitalAssetField = keyof typeof DIGITAL_ASSET_FIELDS;
export type V3NftField = keyof typeof NFT_FIELDS;
export type V3OwnedAssetField = keyof typeof OWNED_ASSET_FIELDS;
export type V3OwnedTokenField = keyof typeof OWNED_TOKEN_FIELDS;
export type V3FollowerField = keyof typeof FOLLOWER_FIELDS;
export type V3CreatorField = keyof typeof CREATOR_FIELDS;
export type V3IssuedAssetField = keyof typeof ISSUED_ASSET_FIELDS;
export type V3ControllerField = keyof typeof CONTROLLER_FIELDS;
export type V3ChillwhalesNftField = keyof typeof CHILLWHALES_FIELDS;
export type V3DataValueField = keyof typeof DATA_VALUE_FIELDS;
export type V3MetadataRevisionField = keyof typeof METADATA_REVISION_FIELDS;
export type V3IndexedHeadField = keyof typeof INDEXED_HEAD_FIELDS;

export interface V3DomainFieldMap {
  blocks: V3BlockField;
  events: V3EventField;
  profiles: V3UniversalProfileField;
  digitalAssets: V3DigitalAssetField;
  nfts: V3NftField;
  ownedAssets: V3OwnedAssetField;
  ownedTokens: V3OwnedTokenField;
  followers: V3FollowerField;
  creators: V3CreatorField;
  issuedAssets: V3IssuedAssetField;
  controllers: V3ControllerField;
  chillwhalesNfts: V3ChillwhalesNftField;
  dataValues: V3DataValueField;
  metadataRevisions: V3MetadataRevisionField;
  indexedHeads: V3IndexedHeadField;
}

export type V3DomainListParams<Domain extends V3Domain> = V3ListParams<V3DomainFieldMap[Domain]>;

/** Build schema-validated Hasura variables for a public v3 domain. */
export function buildV3DomainVariables<Domain extends V3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
): Record<string, unknown> {
  switch (domain) {
    case 'blocks':
      return buildVariables(params, BLOCK_FIELDS, [{ number: 'desc' }]);
    case 'events':
      return buildVariables(params, EVENT_FIELDS, [
        { block_number: 'desc' },
        { transaction_index: 'desc' },
        { log_index: 'desc' },
      ]);
    case 'profiles':
      return buildVariables(params, PROFILE_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'digitalAssets':
      return buildVariables(params, DIGITAL_ASSET_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'nfts':
      return buildVariables(params, NFT_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'ownedAssets':
      return buildVariables(params, OWNED_ASSET_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'ownedTokens':
      return buildVariables(params, OWNED_TOKEN_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'followers':
      return buildVariables(params, FOLLOWER_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'creators':
      return buildVariables(params, CREATOR_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'issuedAssets':
      return buildVariables(params, ISSUED_ASSET_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'controllers':
      return buildVariables(params, CONTROLLER_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'chillwhalesNfts':
      return buildVariables(params, CHILLWHALES_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'dataValues':
      return buildVariables(params, DATA_VALUE_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'metadataRevisions':
      return buildVariables(params, METADATA_REVISION_FIELDS, PROJECTION_RECENCY_ORDER);
    case 'indexedHeads':
      return buildVariables(
        params,
        INDEXED_HEAD_FIELDS,
        [{ chain_id: 'asc' }],
        ['chain_id', 'network'],
      );
  }
}

export async function fetchV3Blocks(
  url: string,
  params: V3ListParams<V3BlockField>,
): Promise<V3ListResult<V3Block>> {
  const variables = buildVariables(params, BLOCK_FIELDS, [
    { number: 'desc' },
  ]) as V3BlocksQueryVariables;
  return fetchQuery(url, V3BlocksDocument, variables, parseV3Block);
}

export async function fetchV3Events(
  url: string,
  params: V3ListParams<V3EventField>,
): Promise<V3ListResult<V3EventFact>> {
  const variables = buildVariables(params, EVENT_FIELDS, [
    { block_number: 'desc' },
    { transaction_index: 'desc' },
    { log_index: 'desc' },
  ]) as V3EventsQueryVariables;
  return fetchQuery(url, V3EventsDocument, variables, parseV3EventFact);
}

export async function fetchV3UniversalProfiles(
  url: string,
  params: V3ListParams<V3UniversalProfileField>,
): Promise<V3ListResult<V3UniversalProfile>> {
  const variables = buildVariables(
    params,
    PROFILE_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3UniversalProfilesQueryVariables;
  return fetchQuery(url, V3UniversalProfilesDocument, variables, parseV3UniversalProfile);
}

export async function fetchV3DigitalAssets(
  url: string,
  params: V3ListParams<V3DigitalAssetField>,
): Promise<V3ListResult<V3DigitalAsset>> {
  const variables = buildVariables(
    params,
    DIGITAL_ASSET_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3DigitalAssetsQueryVariables;
  return fetchQuery(url, V3DigitalAssetsDocument, variables, parseV3DigitalAsset);
}

export async function fetchV3Nfts(
  url: string,
  params: V3ListParams<V3NftField>,
): Promise<V3ListResult<V3Nft>> {
  const variables = buildVariables(
    params,
    NFT_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3NftsQueryVariables;
  return fetchQuery(url, V3NftsDocument, variables, parseV3Nft);
}

export async function fetchV3OwnedAssets(
  url: string,
  params: V3ListParams<V3OwnedAssetField>,
): Promise<V3ListResult<V3OwnedAsset>> {
  const variables = buildVariables(
    params,
    OWNED_ASSET_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3OwnedAssetsQueryVariables;
  return fetchQuery(url, V3OwnedAssetsDocument, variables, parseV3OwnedAsset);
}

export async function fetchV3OwnedTokens(
  url: string,
  params: V3ListParams<V3OwnedTokenField>,
): Promise<V3ListResult<V3OwnedToken>> {
  const variables = buildVariables(
    params,
    OWNED_TOKEN_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3OwnedTokensQueryVariables;
  return fetchQuery(url, V3OwnedTokensDocument, variables, parseV3OwnedToken);
}

export async function fetchV3Followers(
  url: string,
  params: V3ListParams<V3FollowerField>,
): Promise<V3ListResult<V3Follower>> {
  const variables = buildVariables(
    params,
    FOLLOWER_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3FollowersQueryVariables;
  return fetchQuery(url, V3FollowersDocument, variables, parseV3Follower);
}

export async function fetchV3Creators(
  url: string,
  params: V3ListParams<V3CreatorField>,
): Promise<V3ListResult<V3Creator>> {
  const variables = buildVariables(
    params,
    CREATOR_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3CreatorsQueryVariables;
  return fetchQuery(url, V3CreatorsDocument, variables, parseV3Creator);
}

export async function fetchV3IssuedAssets(
  url: string,
  params: V3ListParams<V3IssuedAssetField>,
): Promise<V3ListResult<V3IssuedAsset>> {
  const variables = buildVariables(
    params,
    ISSUED_ASSET_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3IssuedAssetsQueryVariables;
  return fetchQuery(url, V3IssuedAssetsDocument, variables, parseV3IssuedAsset);
}

export async function fetchV3Controllers(
  url: string,
  params: V3ListParams<V3ControllerField>,
): Promise<V3ListResult<V3Controller>> {
  const variables = buildVariables(
    params,
    CONTROLLER_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3ControllersQueryVariables;
  return fetchQuery(url, V3ControllersDocument, variables, parseV3Controller);
}

export async function fetchV3ChillwhalesNfts(
  url: string,
  params: V3ListParams<V3ChillwhalesNftField>,
): Promise<V3ListResult<V3ChillwhalesNft>> {
  const variables = buildVariables(
    params,
    CHILLWHALES_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3ChillwhalesNftsQueryVariables;
  return fetchQuery(url, V3ChillwhalesNftsDocument, variables, parseV3ChillwhalesNft);
}

export async function fetchV3DataValues(
  url: string,
  params: V3ListParams<V3DataValueField>,
): Promise<V3ListResult<V3DataValue>> {
  const variables = buildVariables(
    params,
    DATA_VALUE_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3DataValuesQueryVariables;
  return fetchQuery(url, V3DataValuesDocument, variables, parseV3DataValue);
}

export async function fetchV3MetadataRevisions(
  url: string,
  params: V3ListParams<V3MetadataRevisionField>,
): Promise<V3ListResult<V3MetadataRevision>> {
  const variables = buildVariables(
    params,
    METADATA_REVISION_FIELDS,
    PROJECTION_RECENCY_ORDER,
  ) as V3MetadataRevisionsQueryVariables;
  return fetchQuery(url, V3MetadataRevisionsDocument, variables, parseV3MetadataRevision);
}

export async function fetchV3IndexedHeads(
  url: string,
  params: V3ListParams<V3IndexedHeadField>,
): Promise<V3ListResult<V3IndexedHead>> {
  const variables = buildVariables(
    params,
    INDEXED_HEAD_FIELDS,
    [{ chain_id: 'asc' }],
    ['chain_id', 'network'],
  ) as V3IndexedHeadsQueryVariables;
  return fetchQuery(url, V3IndexedHeadsDocument, variables, parseV3IndexedHead);
}

export const v3Api = {
  blocks: fetchV3Blocks,
  events: fetchV3Events,
  profiles: fetchV3UniversalProfiles,
  digitalAssets: fetchV3DigitalAssets,
  nfts: fetchV3Nfts,
  ownedAssets: fetchV3OwnedAssets,
  ownedTokens: fetchV3OwnedTokens,
  followers: fetchV3Followers,
  creators: fetchV3Creators,
  issuedAssets: fetchV3IssuedAssets,
  controllers: fetchV3Controllers,
  chillwhalesNfts: fetchV3ChillwhalesNfts,
  dataValues: fetchV3DataValues,
  metadataRevisions: fetchV3MetadataRevisions,
  indexedHeads: fetchV3IndexedHeads,
} as const satisfies Record<V3Domain, (...args: never[]) => unknown>;

/**
 * Fetch any public v3 domain through one exhaustively typed entry point.
 *
 * This is the shared transport boundary used by framework adapters. Domain-specific
 * filter fields and result records remain correlated through `Domain`.
 */
export function fetchV3Domain<Domain extends V3Domain>(
  url: string,
  domain: Domain,
  params: V3DomainListParams<Domain>,
): Promise<V3ListResult<V3DomainResultMap[Domain]>> {
  // `v3Api` is exhaustive, but TypeScript loses the correlation between a generic
  // indexed key and that function's parameter/result types. Reflect.apply keeps the
  // runtime dispatch centralized while the explicit return signature preserves the
  // proven public correlation.
  return Reflect.apply(v3Api[domain], undefined, [url, params]);
}

/** Short names for v3 domains that did not exist in the v2 package surface. */
export function fetchBlocks(
  url: string,
  params: V3ListParams<V3BlockField>,
): Promise<V3ListResult<V3Block>> {
  return fetchV3Blocks(url, params);
}

export function fetchEvents(
  url: string,
  params: V3ListParams<V3EventField>,
): Promise<V3ListResult<V3EventFact>> {
  return fetchV3Events(url, params);
}

export function fetchUniversalProfiles(
  url: string,
  params: V3ListParams<V3UniversalProfileField>,
): Promise<V3ListResult<V3UniversalProfile>> {
  return fetchV3UniversalProfiles(url, params);
}

export function fetchControllers(
  url: string,
  params: V3ListParams<V3ControllerField>,
): Promise<V3ListResult<V3Controller>> {
  return fetchV3Controllers(url, params);
}

export function fetchChillwhalesNfts(
  url: string,
  params: V3ListParams<V3ChillwhalesNftField>,
): Promise<V3ListResult<V3ChillwhalesNft>> {
  return fetchV3ChillwhalesNfts(url, params);
}

export function fetchDataValues(
  url: string,
  params: V3ListParams<V3DataValueField>,
): Promise<V3ListResult<V3DataValue>> {
  return fetchV3DataValues(url, params);
}

export function fetchMetadataRevisions(
  url: string,
  params: V3ListParams<V3MetadataRevisionField>,
): Promise<V3ListResult<V3MetadataRevision>> {
  return fetchV3MetadataRevisions(url, params);
}

export function fetchIndexedHeads(
  url: string,
  params: V3ListParams<V3IndexedHeadField>,
): Promise<V3ListResult<V3IndexedHead>> {
  return fetchV3IndexedHeads(url, params);
}

export async function fetchIndexedHead(
  url: string,
  params: { network: string },
): Promise<V3IndexedHead | null> {
  const result = await fetchV3IndexedHeads(url, { network: params.network, limit: 1 });
  return result.items[0] ?? null;
}
