import { resolveDataKeyHex } from '@chillwhales/erc725';
import { resolveTypeIdHex } from '@chillwhales/lsp1';
import {
  AddressSchema,
  HashSchema,
  type CollectionAttribute,
  type CollectionAttributesResult,
  type Creator,
  type CreatorFilter,
  type CreatorInclude,
  type CreatorResult,
  type CreatorSort,
  type DataChangedEvent,
  type DataChangedEventFilter,
  type DataChangedEventInclude,
  type DataChangedEventResult,
  type DataChangedEventSort,
  type DigitalAsset,
  type DigitalAssetFilter,
  type DigitalAssetInclude,
  type DigitalAssetResult,
  type DigitalAssetSort,
  type DomainFilter,
  type DomainSort,
  type EncryptedAsset,
  type EncryptedAssetFilter,
  type EncryptedAssetInclude,
  type EncryptedAssetResult,
  type EncryptedAssetSort,
  type FollowCount,
  type Follower,
  type FollowerFilter,
  type FollowerInclude,
  type FollowerResult,
  type FollowerSort,
  type IsFollowingBatchResult,
  type IssuedAsset,
  type IssuedAssetFilter,
  type IssuedAssetInclude,
  type IssuedAssetResult,
  type IssuedAssetSort,
  type Nft,
  type NftFilter,
  type NftInclude,
  type NftResult,
  type NftSort,
  type OwnedAsset,
  type OwnedAssetFilter,
  type OwnedAssetInclude,
  type OwnedAssetResult,
  type OwnedAssetSort,
  type OwnedToken,
  type OwnedTokenFilter,
  type OwnedTokenInclude,
  type OwnedTokenResult,
  type OwnedTokenSort,
  type Profile,
  type ProfileFilter,
  type ProfileInclude,
  type ProfileResult,
  type ProfileSort,
  type TokenIdDataChangedEvent,
  type TokenIdDataChangedEventFilter,
  type TokenIdDataChangedEventInclude,
  type TokenIdDataChangedEventResult,
  type TokenIdDataChangedEventSort,
  type UniversalReceiverEvent,
  type UniversalReceiverEventFilter,
  type UniversalReceiverEventInclude,
  type UniversalReceiverEventResult,
  type UniversalReceiverEventSort,
  type UseCollectionAttributesParams,
  type UseCreatorsParams,
  type UseDataChangedEventsParams,
  type UseDigitalAssetParams,
  type UseDigitalAssetsParams,
  type UseEncryptedAssetsBatchParams,
  type UseEncryptedAssetsParams,
  type UseFollowedByMyFollowsParams,
  type UseFollowsParams,
  type UseIsFollowingBatchParams,
  type UseIssuedAssetsParams,
  type UseLatestDataChangedEventParams,
  type UseLatestTokenIdDataChangedEventParams,
  type UseMutualFollowersParams,
  type UseMutualFollowsParams,
  type UseNftParams,
  type UseNftsParams,
  type UseOwnedAssetParams,
  type UseOwnedAssetsParams,
  type UseOwnedTokenParams,
  type UseOwnedTokensParams,
  type UseProfileParams,
  type UseProfilesParams,
  type UseTokenIdDataChangedEventsParams,
  type UseUniversalReceiverEventsParams,
  type V3Domain,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { IndexerError } from '../errors';
import {
  TypedDocumentString as RuntimeTypedDocumentString,
  type TypedDocumentString,
  type V3CreatorsQueryVariables,
  type V3DigitalAssetsQueryVariables,
  type V3EventsQueryVariables,
  type V3FollowersQueryVariables,
  type V3IssuedAssetsQueryVariables,
  type V3MetadataRevisionsQueryVariables,
  type V3NftsQueryVariables,
  type V3OwnedAssetsQueryVariables,
  type V3OwnedTokensQueryVariables,
  type V3UniversalProfilesQueryVariables,
} from '../graphql/graphql';
import type { SubscriptionConfig } from '../subscriptions/types';
import {
  buildV3DomainVariables,
  fetchV3IndexedHeads,
  fetchV3MetadataRevisions,
  fetchV3Nfts,
  type V3DomainFieldMap,
} from './api-service';
import {
  V3CreatorsDocument,
  V3CreatorsSubscriptionDocument,
  V3DigitalAssetsDocument,
  V3DigitalAssetsSubscriptionDocument,
  V3EventsDocument,
  V3EventsSubscriptionDocument,
  V3FollowersDocument,
  V3FollowersSubscriptionDocument,
  V3IssuedAssetsDocument,
  V3IssuedAssetsSubscriptionDocument,
  V3MetadataRevisionsDocument,
  V3MetadataRevisionsSubscriptionDocument,
  V3NftsDocument,
  V3NftsSubscriptionDocument,
  V3OwnedAssetsDocument,
  V3OwnedAssetsSubscriptionDocument,
  V3OwnedTokensDocument,
  V3OwnedTokensSubscriptionDocument,
  V3UniversalProfilesDocument,
  V3UniversalProfilesSubscriptionDocument,
} from './operations';
import {
  parseCreator,
  parseDataChangedEvent,
  parseDigitalAsset,
  parseEncryptedAsset,
  parseFollower,
  parseIssuedAsset,
  parseNft,
  parseOwnedAsset,
  parseOwnedToken,
  parseProfile,
  parseTokenIdDataChangedEvent,
  parseUniversalReceiverEvent,
} from './rich-parsers';

interface RichQueryEnvelope {
  items: unknown[];
  total: { aggregate?: { count: number } | null };
}

interface ListControls {
  network: string;
  limit?: number;
  offset?: number;
}

type IncludedParams<Params, Include> = Omit<Params, 'include'> & { include?: Include };

type PackageField = V3DomainFieldMap[V3Domain];
type PackageFilter = DomainFilter<PackageField>;
type PackageSort = DomainSort<PackageField>;

function objectRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function count(result: RichQueryEnvelope): number {
  return result.total.aggregate?.count ?? 0;
}

async function queryRows<
  TResult extends RichQueryEnvelope,
  TVariables extends Record<string, unknown>,
  T,
>(
  url: string,
  document: TypedDocumentString<TResult, TVariables>,
  variables: TVariables,
  parser: (value: unknown) => T,
): Promise<{ rows: T[]; totalCount: number }> {
  const result = await execute(url, document, variables);
  try {
    return { rows: result.items.map(parser), totalCount: count(result) };
  } catch (error) {
    throw new IndexerError({
      category: 'PARSE',
      code: 'PARSE_FAILED',
      message: `Invalid v3 package response: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error instanceof Error ? error : undefined,
      query: document.toString(),
    });
  }
}

function addConditions(
  variables: Record<string, unknown>,
  conditions: Record<string, unknown>[],
): Record<string, unknown> {
  if (conditions.length === 0) return variables;
  const where = variables.where;
  const whereRecord = objectRecord(where);
  if (whereRecord == null) throw new TypeError('Expected a v3 where object');
  const currentValue = whereRecord._and;
  const current: unknown[] = Array.isArray(currentValue) ? currentValue : [];
  return { ...variables, where: { ...whereRecord, _and: [...current, ...conditions] } };
}

function address(value: string): string {
  const result = AddressSchema.safeParse(value);
  if (!result.success) {
    throw IndexerError.fromValidationError(
      result.error.issues.map((issue) => ({ ...issue, path: ['address', ...issue.path] })),
      'v3 familiar service',
    );
  }
  return result.data;
}

function hash(value: string, path: string): string {
  const result = HashSchema.safeParse(value);
  if (!result.success) {
    throw IndexerError.fromValidationError(
      result.error.issues.map((issue) => ({ ...issue, path: [path, ...issue.path] })),
      'v3 familiar service',
    );
  }
  return result.data;
}

function selectedProfile<const I extends ProfileInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): ProfileResult<I> {
  // Runtime stripping and the include generic are correlated here, but TypeScript cannot
  // preserve that relationship through the parser overloads.
  return (include == null ? parseProfile(raw) : parseProfile(raw, include)) as ProfileResult<I>;
}

function selectedDigitalAsset<const I extends DigitalAssetInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): DigitalAssetResult<I> {
  return (
    include == null ? parseDigitalAsset(raw) : parseDigitalAsset(raw, include)
  ) as DigitalAssetResult<I>;
}

function selectedNft<const I extends NftInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): NftResult<I> {
  return (include == null ? parseNft(raw) : parseNft(raw, include)) as NftResult<I>;
}

function selectedOwnedAsset<const I extends OwnedAssetInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): OwnedAssetResult<I> {
  return (
    include == null ? parseOwnedAsset(raw) : parseOwnedAsset(raw, include)
  ) as OwnedAssetResult<I>;
}

function selectedOwnedToken<const I extends OwnedTokenInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): OwnedTokenResult<I> {
  return (
    include == null ? parseOwnedToken(raw) : parseOwnedToken(raw, include)
  ) as OwnedTokenResult<I>;
}

function selectedFollower<const I extends FollowerInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): FollowerResult<I> {
  return (include == null ? parseFollower(raw) : parseFollower(raw, include)) as FollowerResult<I>;
}

function selectedCreator<const I extends CreatorInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): CreatorResult<I> {
  return (include == null ? parseCreator(raw) : parseCreator(raw, include)) as CreatorResult<I>;
}

function selectedIssuedAsset<const I extends IssuedAssetInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): IssuedAssetResult<I> {
  return (
    include == null ? parseIssuedAsset(raw) : parseIssuedAsset(raw, include)
  ) as IssuedAssetResult<I>;
}

function selectedDataChangedEvent<const I extends DataChangedEventInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): DataChangedEventResult<I> {
  return (
    include == null ? parseDataChangedEvent(raw) : parseDataChangedEvent(raw, include)
  ) as DataChangedEventResult<I>;
}

function selectedTokenIdDataChangedEvent<
  const I extends TokenIdDataChangedEventInclude | undefined,
>(raw: unknown, include: I | undefined): TokenIdDataChangedEventResult<I> {
  return (
    include == null ? parseTokenIdDataChangedEvent(raw) : parseTokenIdDataChangedEvent(raw, include)
  ) as TokenIdDataChangedEventResult<I>;
}

function selectedUniversalReceiverEvent<const I extends UniversalReceiverEventInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): UniversalReceiverEventResult<I> {
  return (
    include == null ? parseUniversalReceiverEvent(raw) : parseUniversalReceiverEvent(raw, include)
  ) as UniversalReceiverEventResult<I>;
}

function selectedEncryptedAsset<const I extends EncryptedAssetInclude | undefined>(
  raw: unknown,
  include: I | undefined,
): EncryptedAssetResult<I> {
  return (
    include == null ? parseEncryptedAsset(raw) : parseEncryptedAsset(raw, include)
  ) as EncryptedAssetResult<I>;
}

function unsupportedFeature(action: string, path: string, detail: string): never {
  throw IndexerError.fromValidationError(
    [{ path: path.split('.'), message: `${detail} is not available in the v3 API` }],
    action,
  );
}

function baseVariables(
  domain: V3Domain,
  controls: ListControls,
  filter?: PackageFilter,
  sort?: PackageSort[],
): Record<string, unknown> {
  return buildV3DomainVariables(domain, {
    network: controls.network,
    filter,
    sort,
    limit: controls.limit,
    offset: controls.offset,
  });
}

function profileVariables(params: UseProfilesParams): Record<string, unknown> {
  const filter: PackageFilter = {};
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.name) {
    conditions.push({
      metadataRevisions: {
        kind: { _eq: 'lsp3_profile' },
        content: { _contains: { LSP3Profile: { name: params.filter.name } } },
      },
    });
  }
  if (params.filter?.followedBy) {
    conditions.push({
      followedBy: {
        follower_address: { _eq: address(params.filter.followedBy) },
        is_following: { _eq: true },
      },
    });
  }
  if (params.filter?.following) {
    conditions.push({
      followed: {
        followed_address: { _eq: address(params.filter.following) },
        is_following: { _eq: true },
      },
    });
  }
  if (params.filter?.tokenOwned) {
    const owned = params.filter.tokenOwned;
    conditions.push(
      owned.tokenId
        ? {
            ownedTokens: {
              asset_address: { _eq: address(owned.address) },
              token_id: { _eq: hash(owned.tokenId, 'filter.tokenOwned.tokenId') },
              balance: { _gt: '0' },
            },
          }
        : {
            ownedAssets: {
              asset_address: { _eq: address(owned.address) },
              balance: { _gt: owned.minBalance ?? '0' },
            },
          },
    );
  }
  if (params.sort && params.sort.field !== 'newest' && params.sort.field !== 'oldest') {
    unsupportedFeature('profiles', 'sort.field', `Sort field ${params.sort.field}`);
  }
  const sort: PackageSort[] | undefined = params.sort
    ? [
        {
          field: 'lastBlockNumber',
          direction: params.sort.field === 'newest' ? 'desc' : 'asc',
        },
      ]
    : undefined;
  return addConditions(baseVariables('profiles', params, filter, sort), conditions);
}

export interface FetchProfilesResult<P = Profile> {
  profiles: P[];
  totalCount: number;
}

export async function fetchProfile<const I extends ProfileInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseProfileParams, I>,
): Promise<ProfileResult<I> | null> {
  const variables = baseVariables(
    'profiles',
    { network: params.network, limit: 1 },
    { address: { eq: address(params.address) } },
  ) as V3UniversalProfilesQueryVariables;
  const result = await queryRows(url, V3UniversalProfilesDocument, variables, (raw) =>
    selectedProfile<I>(raw, params.include),
  );
  return result.rows[0] ?? null;
}

export async function fetchProfiles<const I extends ProfileInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseProfilesParams, I>,
): Promise<FetchProfilesResult<ProfileResult<I>>> {
  const variables = profileVariables(params) as V3UniversalProfilesQueryVariables;
  const result = await queryRows(url, V3UniversalProfilesDocument, variables, (raw) =>
    selectedProfile<I>(raw, params.include),
  );
  return { profiles: result.rows, totalCount: result.totalCount };
}

function tokenTypeValue(value: DigitalAssetFilter['tokenType']): number | undefined {
  if (value === 'TOKEN') return 0;
  if (value === 'NFT') return 1;
  if (value === 'COLLECTION') return 2;
  return undefined;
}

function digitalAssetVariables(params: UseDigitalAssetsParams): Record<string, unknown> {
  const filter: PackageFilter = {};
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.name) filter.name = { eq: params.filter.name };
  if (params.filter?.symbol) filter.symbol = { eq: params.filter.symbol };
  const tokenType = tokenTypeValue(params.filter?.tokenType);
  if (tokenType != null) filter.tokenType = { eq: tokenType };
  if (params.filter?.ownerAddress) {
    filter.ownerAddress = { eq: address(params.filter.ownerAddress) };
  }
  if (params.filter?.holderAddress) {
    conditions.push({
      ownedAssets: {
        owner_address: { _eq: address(params.filter.holderAddress) },
        balance: { _gt: '0' },
      },
    });
  }
  if (params.filter?.category) {
    conditions.push({
      metadataRevisions: {
        kind: { _eq: 'lsp4_asset' },
        content: { _contains: { LSP4Metadata: { category: params.filter.category } } },
      },
    });
  }
  let sort: PackageSort[] | undefined;
  if (params.sort) {
    let field: PackageField;
    switch (params.sort.field) {
      case 'newest':
      case 'oldest':
        field = 'lastBlockNumber';
        break;
      case 'name':
      case 'symbol':
      case 'totalSupply':
        field = params.sort.field;
        break;
      default:
        unsupportedFeature('digital assets', 'sort.field', `Sort field ${params.sort.field}`);
    }
    sort = [
      {
        field,
        direction:
          params.sort.field === 'newest'
            ? 'desc'
            : params.sort.field === 'oldest'
              ? 'asc'
              : params.sort.direction,
        nulls: params.sort.nulls,
      },
    ];
  }
  return addConditions(baseVariables('digitalAssets', params, filter, sort), conditions);
}

export interface FetchDigitalAssetsResult<P = DigitalAsset> {
  digitalAssets: P[];
  totalCount: number;
}

export async function fetchDigitalAsset<
  const I extends DigitalAssetInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseDigitalAssetParams, I>,
): Promise<DigitalAssetResult<I> | null> {
  const variables = baseVariables(
    'digitalAssets',
    { network: params.network, limit: 1 },
    { address: { eq: address(params.address) } },
  ) as V3DigitalAssetsQueryVariables;
  const result = await queryRows(url, V3DigitalAssetsDocument, variables, (raw) =>
    selectedDigitalAsset<I>(raw, params.include),
  );
  return result.rows[0] ?? null;
}

export async function fetchDigitalAssets<
  const I extends DigitalAssetInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseDigitalAssetsParams, I>,
): Promise<FetchDigitalAssetsResult<DigitalAssetResult<I>>> {
  const variables = digitalAssetVariables(params) as V3DigitalAssetsQueryVariables;
  const result = await queryRows(url, V3DigitalAssetsDocument, variables, (raw) =>
    selectedDigitalAsset<I>(raw, params.include),
  );
  return { digitalAssets: result.rows, totalCount: result.totalCount };
}

function nftVariables(params: UseNftsParams): Record<string, unknown> {
  const filter: PackageFilter = {};
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.collectionAddress) {
    filter.address = { eq: address(params.filter.collectionAddress) };
  }
  if (params.filter?.tokenId) {
    filter.tokenId = { eq: hash(params.filter.tokenId, 'filter.tokenId') };
  }
  if (params.filter?.formattedTokenId) {
    filter.formattedTokenId = { eq: params.filter.formattedTokenId };
  }
  if (params.filter?.holderAddress) {
    filter.ownerAddress = { eq: address(params.filter.holderAddress) };
  }
  if (params.filter?.isBurned != null) filter.isBurned = { eq: params.filter.isBurned };
  if (params.filter?.isMinted != null) filter.isMinted = { eq: params.filter.isMinted };
  if (params.filter?.name) {
    conditions.push({
      metadataRevisions: {
        kind: { _eq: 'lsp4_token' },
        content: { _contains: { LSP4Metadata: { name: params.filter.name } } },
      },
    });
  }
  const extension: Record<string, unknown> = {};
  if (params.filter?.chillClaimed != null) {
    extension.chill_claimed = { _eq: params.filter.chillClaimed };
  }
  if (params.filter?.orbsClaimed != null) {
    extension.orbs_claimed = { _eq: params.filter.orbsClaimed };
  }
  if (params.filter?.maxLevel != null) extension.level = { _lte: params.filter.maxLevel };
  if (params.filter?.cooldownExpiryBefore != null) {
    extension.cooldown_expiry = { _lt: String(params.filter.cooldownExpiryBefore) };
  }
  if (Object.keys(extension).length > 0) conditions.push({ chillwhales: extension });
  if (params.sort?.field === 'score') {
    unsupportedFeature('NFTs', 'sort.field', 'Chillwhales score sorting');
  }
  const sort: PackageSort[] | undefined = params.sort
    ? [
        {
          field:
            params.sort.field === 'newest' || params.sort.field === 'oldest'
              ? 'lastBlockNumber'
              : params.sort.field === 'tokenId'
                ? 'tokenId'
                : params.sort.field === 'formattedTokenId'
                  ? 'formattedTokenId'
                  : 'lastBlockNumber',
          direction:
            params.sort.field === 'newest'
              ? 'desc'
              : params.sort.field === 'oldest'
                ? 'asc'
                : params.sort.direction,
          nulls: params.sort.nulls,
        },
      ]
    : undefined;
  return addConditions(baseVariables('nfts', params, filter, sort), conditions);
}

export interface FetchNftsResult<P = Nft> {
  nfts: P[];
  totalCount: number;
}

export async function fetchNft<const I extends NftInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseNftParams, I>,
): Promise<NftResult<I> | null> {
  if (params.tokenId == null && params.formattedTokenId == null) {
    throw IndexerError.fromValidationError(
      [{ path: ['tokenId'], message: 'tokenId or formattedTokenId is required' }],
      'fetchNft',
    );
  }
  const filter: PackageFilter = { address: { eq: address(params.address) } };
  if (params.tokenId) filter.tokenId = { eq: hash(params.tokenId, 'tokenId') };
  if (params.formattedTokenId) filter.formattedTokenId = { eq: params.formattedTokenId };
  const variables = baseVariables(
    'nfts',
    { network: params.network, limit: 1 },
    filter,
  ) as V3NftsQueryVariables;
  const result = await queryRows(url, V3NftsDocument, variables, (raw) =>
    selectedNft<I>(raw, params.include),
  );
  return result.rows[0] ?? null;
}

export async function fetchNfts<const I extends NftInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseNftsParams, I>,
): Promise<FetchNftsResult<NftResult<I>>> {
  const variables = nftVariables(params) as V3NftsQueryVariables;
  const result = await queryRows(url, V3NftsDocument, variables, (raw) =>
    selectedNft<I>(raw, params.include),
  );
  return { nfts: result.rows, totalCount: result.totalCount };
}

function ownershipSort(
  sort: OwnedAssetSort | OwnedTokenSort | undefined,
): PackageSort[] | undefined {
  if (!sort) return undefined;
  let field: PackageField;
  switch (sort.field) {
    case 'newest':
    case 'oldest':
      field = 'lastBlockNumber';
      break;
    case 'digitalAssetAddress':
      field = 'assetAddress';
      break;
    case 'holderAddress':
      field = 'ownerAddress';
      break;
    case 'balance':
    case 'tokenId':
      field = sort.field;
      break;
    default:
      unsupportedFeature('ownership', 'sort.field', `Sort field ${sort.field}`);
  }
  return [
    {
      field,
      direction:
        sort.field === 'newest' ? 'desc' : sort.field === 'oldest' ? 'asc' : sort.direction,
      nulls: sort.nulls,
    },
  ];
}

function ownedAssetVariables(params: UseOwnedAssetsParams): Record<string, unknown> {
  const filter: PackageFilter = {};
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.holderAddress) {
    filter.ownerAddress = { eq: address(params.filter.holderAddress) };
  }
  if (params.filter?.digitalAssetAddress) {
    filter.assetAddress = { eq: address(params.filter.digitalAssetAddress) };
  }
  if (params.filter?.holderName) {
    conditions.push({
      universalProfile: {
        metadataRevisions: {
          kind: { _eq: 'lsp3_profile' },
          content: { _contains: { LSP3Profile: { name: params.filter.holderName } } },
        },
      },
    });
  }
  if (params.filter?.assetName) {
    conditions.push({
      digitalAsset: { name: { _eq: params.filter.assetName } },
    });
  }
  return addConditions(
    baseVariables('ownedAssets', params, filter, ownershipSort(params.sort)),
    conditions,
  );
}

export interface FetchOwnedAssetsResult<P = OwnedAsset> {
  ownedAssets: P[];
  totalCount: number;
}

export async function fetchOwnedAsset<const I extends OwnedAssetInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseOwnedAssetParams, I>,
): Promise<OwnedAssetResult<I> | null> {
  const variables = baseVariables(
    'ownedAssets',
    { network: params.network, limit: 1 },
    { id: { eq: params.id } },
  ) as V3OwnedAssetsQueryVariables;
  const result = await queryRows(url, V3OwnedAssetsDocument, variables, (raw) =>
    selectedOwnedAsset<I>(raw, params.include),
  );
  return result.rows[0] ?? null;
}

export async function fetchOwnedAssets<const I extends OwnedAssetInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseOwnedAssetsParams, I>,
): Promise<FetchOwnedAssetsResult<OwnedAssetResult<I>>> {
  const variables = ownedAssetVariables(params) as V3OwnedAssetsQueryVariables;
  const result = await queryRows(url, V3OwnedAssetsDocument, variables, (raw) =>
    selectedOwnedAsset<I>(raw, params.include),
  );
  return { ownedAssets: result.rows, totalCount: result.totalCount };
}

function ownedTokenVariables(params: UseOwnedTokensParams): Record<string, unknown> {
  const filter: PackageFilter = {};
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.holderAddress) {
    filter.ownerAddress = { eq: address(params.filter.holderAddress) };
  }
  if (params.filter?.digitalAssetAddress) {
    filter.assetAddress = { eq: address(params.filter.digitalAssetAddress) };
  }
  if (params.filter?.tokenId) {
    filter.tokenId = { eq: hash(params.filter.tokenId, 'filter.tokenId') };
  }
  if (params.filter?.holderName) {
    conditions.push({
      universalProfile: {
        metadataRevisions: {
          kind: { _eq: 'lsp3_profile' },
          content: { _contains: { LSP3Profile: { name: params.filter.holderName } } },
        },
      },
    });
  }
  if (params.filter?.assetName) {
    conditions.push({ digitalAsset: { name: { _eq: params.filter.assetName } } });
  }
  if (params.filter?.tokenName) {
    conditions.push({
      nft: {
        metadataRevisions: {
          kind: { _eq: 'lsp4_token' },
          content: { _contains: { LSP4Metadata: { name: params.filter.tokenName } } },
        },
      },
    });
  }
  return addConditions(
    baseVariables('ownedTokens', params, filter, ownershipSort(params.sort)),
    conditions,
  );
}

export interface FetchOwnedTokensResult<P = OwnedToken> {
  ownedTokens: P[];
  totalCount: number;
}

export async function fetchOwnedToken<const I extends OwnedTokenInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseOwnedTokenParams, I>,
): Promise<OwnedTokenResult<I> | null> {
  const variables = baseVariables(
    'ownedTokens',
    { network: params.network, limit: 1 },
    { id: { eq: params.id } },
  ) as V3OwnedTokensQueryVariables;
  const result = await queryRows(url, V3OwnedTokensDocument, variables, (raw) =>
    selectedOwnedToken<I>(raw, params.include),
  );
  return result.rows[0] ?? null;
}

export async function fetchOwnedTokens<const I extends OwnedTokenInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseOwnedTokensParams, I>,
): Promise<FetchOwnedTokensResult<OwnedTokenResult<I>>> {
  const variables = ownedTokenVariables(params) as V3OwnedTokensQueryVariables;
  const result = await queryRows(url, V3OwnedTokensDocument, variables, (raw) =>
    selectedOwnedToken<I>(raw, params.include),
  );
  return { ownedTokens: result.rows, totalCount: result.totalCount };
}

function followerVariables(params: UseFollowsParams): Record<string, unknown> {
  const filter: PackageFilter = { isFollowing: { eq: true } };
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.followerAddress) {
    filter.followerAddress = { eq: address(params.filter.followerAddress) };
  }
  if (params.filter?.followedAddress) {
    filter.followedAddress = { eq: address(params.filter.followedAddress) };
  }
  if (params.filter?.timestampFrom != null || params.filter?.timestampTo != null) {
    filter.followedAt = {
      gte:
        params.filter.timestampFrom == null
          ? undefined
          : normalizeTimestampFilter(params.filter.timestampFrom),
      lte:
        params.filter.timestampTo == null
          ? undefined
          : normalizeTimestampFilter(params.filter.timestampTo),
    };
  }
  if (params.filter?.followerName) {
    conditions.push({
      followerUniversalProfile: {
        metadataRevisions: {
          kind: { _eq: 'lsp3_profile' },
          content: { _contains: { LSP3Profile: { name: params.filter.followerName } } },
        },
      },
    });
  }
  if (params.filter?.followedName) {
    conditions.push({
      followedUniversalProfile: {
        metadataRevisions: {
          kind: { _eq: 'lsp3_profile' },
          content: { _contains: { LSP3Profile: { name: params.filter.followedName } } },
        },
      },
    });
  }
  let sort: PackageSort[] | undefined;
  if (params.sort) {
    let field: PackageField;
    switch (params.sort.field) {
      case 'newest':
      case 'oldest':
        field = 'lastBlockNumber';
        break;
      case 'followerAddress':
      case 'followedAddress':
        field = params.sort.field;
        break;
      default:
        unsupportedFeature('followers', 'sort.field', `Sort field ${params.sort.field}`);
    }
    sort = [
      {
        field,
        direction:
          params.sort.field === 'newest'
            ? 'desc'
            : params.sort.field === 'oldest'
              ? 'asc'
              : params.sort.direction,
        nulls: params.sort.nulls,
      },
    ];
  }
  return addConditions(baseVariables('followers', params, filter, sort), conditions);
}

export interface FetchFollowsResult<P = Follower> {
  follows: P[];
  totalCount: number;
}

export async function fetchFollows<const I extends FollowerInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseFollowsParams, I>,
): Promise<FetchFollowsResult<FollowerResult<I>>> {
  const variables = followerVariables(params) as V3FollowersQueryVariables;
  const result = await queryRows(url, V3FollowersDocument, variables, (raw) =>
    selectedFollower<I>(raw, params.include),
  );
  return { follows: result.rows, totalCount: result.totalCount };
}

export async function fetchFollowCount(
  url: string,
  params: { network: string; address: string },
): Promise<FollowCount> {
  const [followers, following] = await Promise.all([
    fetchFollows(url, {
      network: params.network,
      filter: { followedAddress: params.address },
      limit: 1,
    }),
    fetchFollows(url, {
      network: params.network,
      filter: { followerAddress: params.address },
      limit: 1,
    }),
  ]);
  const chainId = followers.follows[0]?.chainId ?? following.follows[0]?.chainId;
  if (chainId == null) {
    const head = await fetchV3IndexedHeads(url, { network: params.network, limit: 1 });
    if (head.items[0] == null) {
      throw new IndexerError({
        category: 'PARSE',
        code: 'EMPTY_RESPONSE',
        message: `No indexed head exists for network ${params.network}`,
      });
    }
    return {
      network: params.network,
      chainId: head.items[0].chainId,
      followerCount: followers.totalCount,
      followingCount: following.totalCount,
    };
  }
  return {
    network: params.network,
    chainId,
    followerCount: followers.totalCount,
    followingCount: following.totalCount,
  };
}

export async function fetchIsFollowing(
  url: string,
  params: { network: string; followerAddress: string; followedAddress: string },
): Promise<boolean> {
  const result = await fetchFollows(url, {
    network: params.network,
    filter: {
      followerAddress: params.followerAddress,
      followedAddress: params.followedAddress,
    },
    limit: 1,
  });
  return result.totalCount > 0;
}

export async function fetchIsFollowingBatch(
  url: string,
  params: UseIsFollowingBatchParams,
): Promise<IsFollowingBatchResult> {
  const result: IsFollowingBatchResult = new Map();
  if (params.pairs.length === 0) return result;
  if (params.pairs.length > 100) {
    throw IndexerError.fromValidationError(
      [{ path: ['pairs'], message: 'At most 100 pairs can be checked in one request' }],
      'fetchIsFollowingBatch',
    );
  }
  const conditions = params.pairs.map((pair) => ({
    _and: [
      { follower_address: { _eq: address(pair.followerAddress) } },
      { followed_address: { _eq: address(pair.followedAddress) } },
      { is_following: { _eq: true } },
    ],
  }));
  const variables = addConditions(
    baseVariables('followers', { network: params.network, limit: 100 }),
    [{ _or: conditions }],
  ) as V3FollowersQueryVariables;
  const rows = await queryRows(url, V3FollowersDocument, variables, parseFollower);
  for (const pair of params.pairs) {
    result.set(`${address(pair.followerAddress)}:${address(pair.followedAddress)}`, false);
  }
  for (const row of rows.rows) {
    result.set(`${row.followerAddress}:${row.followedAddress}`, true);
  }
  return result;
}

function creatorVariables(params: UseCreatorsParams): Record<string, unknown> {
  const filter: PackageFilter = {};
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.creatorAddress) {
    filter.creatorAddress = { eq: address(params.filter.creatorAddress) };
  }
  if (params.filter?.digitalAssetAddress) {
    filter.assetAddress = { eq: address(params.filter.digitalAssetAddress) };
  }
  if (params.filter?.interfaceId) filter.interfaceId = { eq: params.filter.interfaceId };
  if (params.filter?.timestampFrom != null || params.filter?.timestampTo != null) {
    unsupportedFeature('creators', 'filter.timestamp', 'Creator timestamp filtering');
  }
  if (params.filter?.creatorName) {
    conditions.push({
      creatorProfile: {
        metadataRevisions: {
          kind: { _eq: 'lsp3_profile' },
          content: { _contains: { LSP3Profile: { name: params.filter.creatorName } } },
        },
      },
    });
  }
  if (params.filter?.digitalAssetName) {
    conditions.push({ digitalAsset: { name: { _eq: params.filter.digitalAssetName } } });
  }
  let sort: PackageSort[] | undefined;
  if (params.sort) {
    let field: PackageField;
    switch (params.sort.field) {
      case 'newest':
      case 'oldest':
        field = 'lastBlockNumber';
        break;
      case 'digitalAssetAddress':
        field = 'assetAddress';
        break;
      case 'creatorAddress':
      case 'arrayIndex':
        field = params.sort.field;
        break;
      default:
        unsupportedFeature('creators', 'sort.field', `Sort field ${params.sort.field}`);
    }
    sort = [
      {
        field,
        direction:
          params.sort.field === 'newest'
            ? 'desc'
            : params.sort.field === 'oldest'
              ? 'asc'
              : params.sort.direction,
        nulls: params.sort.nulls,
      },
    ];
  }
  return addConditions(baseVariables('creators', params, filter, sort), conditions);
}

export interface FetchCreatorsResult<P = Creator> {
  creators: P[];
  totalCount: number;
}

export async function fetchCreators<const I extends CreatorInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseCreatorsParams, I>,
): Promise<FetchCreatorsResult<CreatorResult<I>>> {
  const variables = creatorVariables(params) as V3CreatorsQueryVariables;
  const result = await queryRows(url, V3CreatorsDocument, variables, (raw) =>
    selectedCreator<I>(raw, params.include),
  );
  return { creators: result.rows, totalCount: result.totalCount };
}

function issuedAssetVariables(params: UseIssuedAssetsParams): Record<string, unknown> {
  const filter: PackageFilter = {};
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.issuerAddress) {
    filter.issuerAddress = { eq: address(params.filter.issuerAddress) };
  }
  if (params.filter?.assetAddress) {
    filter.assetAddress = { eq: address(params.filter.assetAddress) };
  }
  if (params.filter?.interfaceId) filter.interfaceId = { eq: params.filter.interfaceId };
  if (params.filter?.timestampFrom != null || params.filter?.timestampTo != null) {
    unsupportedFeature('issued assets', 'filter.timestamp', 'Issued-asset timestamp filtering');
  }
  if (params.filter?.issuerName) {
    conditions.push({
      universalProfile: {
        metadataRevisions: {
          kind: { _eq: 'lsp3_profile' },
          content: { _contains: { LSP3Profile: { name: params.filter.issuerName } } },
        },
      },
    });
  }
  if (params.filter?.digitalAssetName) {
    conditions.push({ digitalAsset: { name: { _eq: params.filter.digitalAssetName } } });
  }
  let sort: PackageSort[] | undefined;
  if (params.sort) {
    let field: PackageField;
    switch (params.sort.field) {
      case 'newest':
      case 'oldest':
        field = 'lastBlockNumber';
        break;
      case 'issuerAddress':
      case 'assetAddress':
      case 'arrayIndex':
        field = params.sort.field;
        break;
      default:
        unsupportedFeature('issued assets', 'sort.field', `Sort field ${params.sort.field}`);
    }
    sort = [
      {
        field,
        direction:
          params.sort.field === 'newest'
            ? 'desc'
            : params.sort.field === 'oldest'
              ? 'asc'
              : params.sort.direction,
        nulls: params.sort.nulls,
      },
    ];
  }
  return addConditions(baseVariables('issuedAssets', params, filter, sort), conditions);
}

export interface FetchIssuedAssetsResult<P = IssuedAsset> {
  issuedAssets: P[];
  totalCount: number;
}

export async function fetchIssuedAssets<const I extends IssuedAssetInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseIssuedAssetsParams, I>,
): Promise<FetchIssuedAssetsResult<IssuedAssetResult<I>>> {
  const variables = issuedAssetVariables(params) as V3IssuedAssetsQueryVariables;
  const result = await queryRows(url, V3IssuedAssetsDocument, variables, (raw) =>
    selectedIssuedAsset<I>(raw, params.include),
  );
  return { issuedAssets: result.rows, totalCount: result.totalCount };
}

function normalizeTimestampFilter(value: string | number): string {
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw IndexerError.fromValidationError(
      [{ path: ['timestamp'], message: 'Expected an ISO timestamp or unix seconds' }],
      'event filter',
    );
  }
  return date.toISOString();
}

function eventSort(
  sort: DataChangedEventSort | TokenIdDataChangedEventSort | UniversalReceiverEventSort | undefined,
): PackageSort[] | undefined {
  if (!sort) return undefined;
  if (sort.field !== 'newest' && sort.field !== 'oldest') {
    unsupportedFeature('events', 'sort.field', `Sort field ${sort.field}`);
  }
  return [
    {
      field: 'blockNumber',
      direction: sort.field === 'oldest' ? 'asc' : 'desc',
    },
    { field: 'transactionIndex', direction: sort.field === 'oldest' ? 'asc' : 'desc' },
    { field: 'logIndex', direction: sort.field === 'oldest' ? 'asc' : 'desc' },
  ];
}

function eventVariables(
  params: ListControls,
  eventName: 'DataChanged' | 'TokenIdDataChanged' | 'UniversalReceiver',
  filter:
    | DataChangedEventFilter
    | TokenIdDataChangedEventFilter
    | UniversalReceiverEventFilter
    | undefined,
  sort: DataChangedEventSort | TokenIdDataChangedEventSort | UniversalReceiverEventSort | undefined,
): Record<string, unknown> {
  const direct: PackageFilter = { eventName: { eq: eventName } };
  const conditions: Record<string, unknown>[] = [];
  if (filter?.address) direct.address = { eq: address(filter.address) };
  if (filter?.blockNumberFrom != null || filter?.blockNumberTo != null) {
    direct.blockNumber = { gte: filter.blockNumberFrom, lte: filter.blockNumberTo };
  }
  if (filter?.timestampFrom != null || filter?.timestampTo != null) {
    conditions.push({
      block_timestamp: {
        ...(filter.timestampFrom == null
          ? {}
          : { _gte: normalizeTimestampFilter(filter.timestampFrom) }),
        ...(filter.timestampTo == null
          ? {}
          : { _lte: normalizeTimestampFilter(filter.timestampTo) }),
      },
    });
  }

  if ('dataKey' in (filter ?? {}) || 'dataKeyName' in (filter ?? {})) {
    const dataFilter = filter as DataChangedEventFilter | TokenIdDataChangedEventFilter;
    const dataKey =
      dataFilter.dataKey ??
      (dataFilter.dataKeyName == null ? undefined : resolveDataKeyHex(dataFilter.dataKeyName));
    if (dataKey) {
      conditions.push({ decoded: { _contains: { dataKey: hash(dataKey, 'filter.dataKey') } } });
    }
  }
  if ('tokenId' in (filter ?? {}) && filter && 'tokenId' in filter && filter.tokenId) {
    conditions.push({
      decoded: { _contains: { tokenId: hash(filter.tokenId, 'filter.tokenId') } },
    });
  }
  if ('from' in (filter ?? {}) && filter && 'from' in filter && filter.from) {
    conditions.push({ decoded: { _contains: { from: address(filter.from) } } });
  }
  if ('typeId' in (filter ?? {}) || 'typeIdName' in (filter ?? {})) {
    const receiverFilter = filter as UniversalReceiverEventFilter;
    const typeId =
      receiverFilter.typeId ??
      (receiverFilter.typeIdName == null ? undefined : resolveTypeIdHex(receiverFilter.typeIdName));
    if (typeId) {
      conditions.push({ decoded: { _contains: { typeId: hash(typeId, 'filter.typeId') } } });
    }
  }
  if (filter && 'universalProfileName' in filter && filter.universalProfileName) {
    conditions.push({
      universalProfile: {
        metadataRevisions: {
          kind: { _eq: 'lsp3_profile' },
          content: { _contains: { LSP3Profile: { name: filter.universalProfileName } } },
        },
      },
    });
  }
  if (filter && 'digitalAssetName' in filter && filter.digitalAssetName) {
    conditions.push({ digitalAsset: { name: { _eq: filter.digitalAssetName } } });
  }
  if (filter && 'nftName' in filter && filter.nftName) {
    unsupportedFeature('token ID data changed events', 'filter.nftName', 'NFT name filtering');
  }
  if (filter && 'fromProfileName' in filter && filter.fromProfileName) {
    unsupportedFeature(
      'universal receiver events',
      'filter.fromProfileName',
      'Sender profile name filtering',
    );
  }
  if (filter && 'fromAssetName' in filter && filter.fromAssetName) {
    unsupportedFeature(
      'universal receiver events',
      'filter.fromAssetName',
      'Sender asset name filtering',
    );
  }
  return addConditions(baseVariables('events', params, direct, eventSort(sort)), conditions);
}

export interface FetchDataChangedEventsResult<P = DataChangedEvent> {
  dataChangedEvents: P[];
  totalCount: number;
}

export async function fetchDataChangedEvents<
  const I extends DataChangedEventInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseDataChangedEventsParams, I>,
): Promise<FetchDataChangedEventsResult<DataChangedEventResult<I>>> {
  const variables = eventVariables(
    params,
    'DataChanged',
    params.filter,
    params.sort,
  ) as V3EventsQueryVariables;
  const result = await queryRows(url, V3EventsDocument, variables, (raw) =>
    selectedDataChangedEvent<I>(raw, params.include),
  );
  return { dataChangedEvents: result.rows, totalCount: result.totalCount };
}

export async function fetchLatestDataChangedEvent<
  const I extends DataChangedEventInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseLatestDataChangedEventParams, I>,
): Promise<DataChangedEventResult<I> | null> {
  const variables = eventVariables(
    { network: params.network, limit: 1 },
    'DataChanged',
    params.filter,
    { field: 'newest', direction: 'desc' },
  ) as V3EventsQueryVariables;
  const result = await queryRows(url, V3EventsDocument, variables, (raw) =>
    selectedDataChangedEvent<I>(raw, params.include),
  );
  return result.rows[0] ?? null;
}

export interface FetchTokenIdDataChangedEventsResult<P = TokenIdDataChangedEvent> {
  tokenIdDataChangedEvents: P[];
  totalCount: number;
}

export async function fetchTokenIdDataChangedEvents<
  const I extends TokenIdDataChangedEventInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseTokenIdDataChangedEventsParams, I>,
): Promise<FetchTokenIdDataChangedEventsResult<TokenIdDataChangedEventResult<I>>> {
  const variables = eventVariables(
    params,
    'TokenIdDataChanged',
    params.filter,
    params.sort,
  ) as V3EventsQueryVariables;
  const result = await queryRows(url, V3EventsDocument, variables, (raw) =>
    selectedTokenIdDataChangedEvent<I>(raw, params.include),
  );
  return { tokenIdDataChangedEvents: result.rows, totalCount: result.totalCount };
}

export async function fetchLatestTokenIdDataChangedEvent<
  const I extends TokenIdDataChangedEventInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseLatestTokenIdDataChangedEventParams, I>,
): Promise<TokenIdDataChangedEventResult<I> | null> {
  const variables = eventVariables(
    { network: params.network, limit: 1 },
    'TokenIdDataChanged',
    params.filter,
    { field: 'newest', direction: 'desc' },
  ) as V3EventsQueryVariables;
  const result = await queryRows(url, V3EventsDocument, variables, (raw) =>
    selectedTokenIdDataChangedEvent<I>(raw, params.include),
  );
  return result.rows[0] ?? null;
}

export interface FetchUniversalReceiverEventsResult<P = UniversalReceiverEvent> {
  universalReceiverEvents: P[];
  totalCount: number;
}

export async function fetchUniversalReceiverEvents<
  const I extends UniversalReceiverEventInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseUniversalReceiverEventsParams, I>,
): Promise<FetchUniversalReceiverEventsResult<UniversalReceiverEventResult<I>>> {
  const variables = eventVariables(
    params,
    'UniversalReceiver',
    params.filter,
    params.sort,
  ) as V3EventsQueryVariables;
  const result = await queryRows(url, V3EventsDocument, variables, (raw) =>
    selectedUniversalReceiverEvent<I>(raw, params.include),
  );
  return { universalReceiverEvents: result.rows, totalCount: result.totalCount };
}

function encryptedAssetVariables(params: UseEncryptedAssetsParams): Record<string, unknown> {
  const filter: PackageFilter = { kind: { eq: 'lsp29_encrypted_asset' } };
  const conditions: Record<string, unknown>[] = [];
  if (params.filter?.address) filter.address = { eq: address(params.filter.address) };
  if (params.filter?.timestamp != null) {
    filter.fetchedAt = { gte: normalizeTimestampFilter(params.filter.timestamp) };
  }
  const encrypted: Record<string, unknown> = {};
  if (params.filter?.contentId) encrypted.id = params.filter.contentId;
  if (params.filter?.revision != null) encrypted.revision = params.filter.revision;
  if (params.filter?.encryptionMethod) {
    encrypted.encryption = { method: params.filter.encryptionMethod };
  }
  if (params.filter?.fileType) encrypted.file = { type: params.filter.fileType };
  if (params.filter?.fileSize != null) {
    unsupportedFeature(
      'encrypted assets',
      'filter.fileSize',
      'Nested JSON file-size range filtering',
    );
  }
  if (Object.keys(encrypted).length > 0) {
    conditions.push({ content: { _contains: { LSP29EncryptedAsset: encrypted } } });
  }
  if (params.filter?.universalProfileName) {
    conditions.push({
      universalProfile: {
        metadataRevisions: {
          kind: { _eq: 'lsp3_profile' },
          content: {
            _contains: { LSP3Profile: { name: params.filter.universalProfileName } },
          },
        },
      },
    });
  }
  if (
    params.sort &&
    params.sort.field !== 'newest' &&
    params.sort.field !== 'oldest' &&
    params.sort.field !== 'address'
  ) {
    unsupportedFeature('encrypted assets', 'sort.field', `Sort field ${params.sort.field}`);
  }
  const sort: PackageSort[] | undefined = params.sort
    ? [
        {
          field:
            params.sort.field === 'newest' || params.sort.field === 'oldest'
              ? 'lastBlockNumber'
              : params.sort.field === 'address'
                ? 'address'
                : 'lastBlockNumber',
          direction:
            params.sort.field === 'newest'
              ? 'desc'
              : params.sort.field === 'oldest'
                ? 'asc'
                : params.sort.direction,
          nulls: params.sort.nulls,
        },
      ]
    : undefined;
  return addConditions(baseVariables('metadataRevisions', params, filter, sort), conditions);
}

export interface FetchEncryptedAssetsResult<P = EncryptedAsset> {
  encryptedAssets: P[];
  totalCount: number;
}

export async function fetchEncryptedAssets<
  const I extends EncryptedAssetInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseEncryptedAssetsParams, I>,
): Promise<FetchEncryptedAssetsResult<EncryptedAssetResult<I>>> {
  const variables = encryptedAssetVariables(params) as V3MetadataRevisionsQueryVariables;
  const result = await queryRows(url, V3MetadataRevisionsDocument, variables, (raw) =>
    selectedEncryptedAsset<I>(raw, params.include),
  );
  return { encryptedAssets: result.rows, totalCount: result.totalCount };
}

export interface FetchEncryptedAssetsBatchResult<P = EncryptedAsset> {
  encryptedAssets: P[];
}

export async function fetchEncryptedAssetsBatch<
  const I extends EncryptedAssetInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseEncryptedAssetsBatchParams, I>,
): Promise<FetchEncryptedAssetsBatchResult<EncryptedAssetResult<I>>> {
  if (params.tuples.length === 0) return { encryptedAssets: [] };
  if (params.tuples.length > 100) {
    throw IndexerError.fromValidationError(
      [{ path: ['tuples'], message: 'At most 100 tuples can be fetched in one request' }],
      'fetchEncryptedAssetsBatch',
    );
  }
  const conditions = params.tuples.map((tuple) => ({
    _and: [
      { address: { _eq: address(tuple.address) } },
      {
        content: {
          _contains: {
            LSP29EncryptedAsset: { id: tuple.contentId, revision: tuple.revision },
          },
        },
      },
    ],
  }));
  const variables = addConditions(
    baseVariables(
      'metadataRevisions',
      { network: params.network, limit: Math.min(params.tuples.length, 100) },
      { kind: { eq: 'lsp29_encrypted_asset' } },
    ),
    [{ _or: conditions }],
  ) as V3MetadataRevisionsQueryVariables;
  const result = await queryRows(url, V3MetadataRevisionsDocument, variables, (raw) =>
    selectedEncryptedAsset<I>(raw, params.include),
  );
  return { encryptedAssets: result.rows };
}

function collectMetadataAttributes(content: unknown): CollectionAttribute[] {
  const contentRecord = objectRecord(content);
  const envelope = objectRecord(contentRecord?.LSP4Metadata);
  if (envelope == null) return [];
  const values = envelope.attributes;
  if (!Array.isArray(values)) return [];
  return values.flatMap((value: unknown) => {
    const record = objectRecord(value);
    if (record == null) return [];
    const key = typeof record.key === 'string' ? record.key : null;
    const itemValue = typeof record.value === 'string' ? record.value : null;
    const type = typeof record.type === 'string' ? record.type : null;
    return key == null || itemValue == null ? [] : [{ key, value: itemValue, type }];
  });
}

export async function fetchCollectionAttributes(
  url: string,
  params: UseCollectionAttributesParams,
): Promise<CollectionAttributesResult> {
  const [nfts, firstRevisions] = await Promise.all([
    fetchV3Nfts(url, {
      network: params.network,
      filter: { address: { eq: address(params.collectionAddress) } },
      limit: 1,
    }),
    fetchV3MetadataRevisions(url, {
      network: params.network,
      filter: {
        address: { eq: address(params.collectionAddress) },
        kind: { eq: 'lsp4_token' },
      },
      limit: 100,
    }),
  ]);
  const revisions = [...firstRevisions.items];
  for (let offset = revisions.length; offset < firstRevisions.totalCount; offset += 100) {
    const page = await fetchV3MetadataRevisions(url, {
      network: params.network,
      filter: {
        address: { eq: address(params.collectionAddress) },
        kind: { eq: 'lsp4_token' },
      },
      limit: 100,
      offset,
    });
    revisions.push(...page.items);
  }
  // Revisions arrive newest-first. Match the NFT parser by considering only the
  // latest metadata document for each token, otherwise obsolete traits leak into
  // collection filters forever.
  const latestByToken = new Map<string, (typeof revisions)[number]>();
  for (const revision of revisions) {
    const identity = `${revision.address}\u0000${revision.tokenId ?? ''}`;
    if (!latestByToken.has(identity)) latestByToken.set(identity, revision);
  }
  const distinct = new Map<string, CollectionAttribute>();
  for (const revision of latestByToken.values()) {
    for (const attribute of collectMetadataAttributes(revision.content)) {
      distinct.set(
        `${attribute.key}\u0000${attribute.value}\u0000${attribute.type ?? ''}`,
        attribute,
      );
    }
  }
  const sorted = [...distinct.values()].sort(
    (left, right) =>
      left.key.localeCompare(right.key) ||
      left.value.localeCompare(right.value) ||
      (left.type ?? '').localeCompare(right.type ?? ''),
  );
  const chainId = revisions[0]?.chainId ?? nfts.items[0]?.chainId;
  if (chainId != null) {
    return {
      network: params.network,
      chainId,
      attributes: sorted,
      totalCount: nfts.totalCount,
    };
  }
  const head = await fetchV3IndexedHeads(url, { network: params.network, limit: 1 });
  if (head.items[0] == null) {
    throw new IndexerError({
      category: 'PARSE',
      code: 'EMPTY_RESPONSE',
      message: `No indexed head exists for network ${params.network}`,
    });
  }
  return {
    network: params.network,
    chainId: head.items[0].chainId,
    attributes: sorted,
    totalCount: nfts.totalCount,
  };
}

async function fetchRelatedProfiles<const I extends ProfileInclude | undefined>(
  url: string,
  params: {
    network: string;
    sort?: ProfileSort;
    limit?: number;
    offset?: number;
    include?: I;
  },
  conditions: Record<string, unknown>[],
): Promise<FetchProfilesResult<ProfileResult<I>>> {
  const variables = addConditions(
    profileVariables({
      network: params.network,
      sort: params.sort,
      limit: params.limit,
      offset: params.offset,
      include: params.include,
    }),
    conditions,
  ) as V3UniversalProfilesQueryVariables;
  const result = await queryRows(url, V3UniversalProfilesDocument, variables, (raw) =>
    selectedProfile<I>(raw, params.include),
  );
  return { profiles: result.rows, totalCount: result.totalCount };
}

export async function fetchMutualFollows<const I extends ProfileInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseMutualFollowsParams, I>,
): Promise<FetchProfilesResult<ProfileResult<I>>> {
  return fetchRelatedProfiles(url, params, [
    {
      followedBy: {
        follower_address: { _eq: address(params.addressA) },
        is_following: { _eq: true },
      },
    },
    {
      followedBy: {
        follower_address: { _eq: address(params.addressB) },
        is_following: { _eq: true },
      },
    },
  ]);
}

export async function fetchMutualFollowers<const I extends ProfileInclude | undefined = undefined>(
  url: string,
  params: IncludedParams<UseMutualFollowersParams, I>,
): Promise<FetchProfilesResult<ProfileResult<I>>> {
  return fetchRelatedProfiles(url, params, [
    {
      followed: {
        followed_address: { _eq: address(params.addressA) },
        is_following: { _eq: true },
      },
    },
    {
      followed: {
        followed_address: { _eq: address(params.addressB) },
        is_following: { _eq: true },
      },
    },
  ]);
}

export async function fetchFollowedByMyFollows<
  const I extends ProfileInclude | undefined = undefined,
>(
  url: string,
  params: IncludedParams<UseFollowedByMyFollowsParams, I>,
): Promise<FetchProfilesResult<ProfileResult<I>>> {
  return fetchRelatedProfiles(url, params, [
    {
      followedBy: {
        follower_address: { _eq: address(params.myAddress) },
        is_following: { _eq: true },
      },
    },
    {
      followed: {
        followed_address: { _eq: address(params.targetAddress) },
        is_following: { _eq: true },
      },
    },
  ]);
}

interface RichSubscriptionEnvelope {
  items: unknown[];
}

export type RichSubscriptionConfig<T> = SubscriptionConfig<
  RichSubscriptionEnvelope,
  Record<string, unknown>,
  unknown,
  T
>;

type RichSubscriptionParams<Filter, Sort, Include> = {
  network: string;
  filter?: Filter;
  sort?: Sort;
  limit?: number;
  include?: Include;
};

function richSubscriptionConfig<T>(
  source: { toString(): string },
  variables: Record<string, unknown>,
  parser: (raw: unknown) => T,
): RichSubscriptionConfig<T> {
  return {
    document: new RuntimeTypedDocumentString<RichSubscriptionEnvelope, Record<string, unknown>>(
      source.toString(),
    ),
    variables,
    extract(result) {
      return result.items;
    },
    parser(rows) {
      return rows.map(parser);
    },
  };
}

export function buildProfileSubscriptionConfig<
  const I extends ProfileInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<ProfileFilter, ProfileSort, I>,
): RichSubscriptionConfig<ProfileResult<I>> {
  return richSubscriptionConfig(
    V3UniversalProfilesSubscriptionDocument,
    profileVariables(params),
    (raw) => selectedProfile<I>(raw, params.include),
  );
}

export function buildDigitalAssetSubscriptionConfig<
  const I extends DigitalAssetInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<DigitalAssetFilter, DigitalAssetSort, I>,
): RichSubscriptionConfig<DigitalAssetResult<I>> {
  return richSubscriptionConfig(
    V3DigitalAssetsSubscriptionDocument,
    digitalAssetVariables(params),
    (raw) => selectedDigitalAsset<I>(raw, params.include),
  );
}

export function buildNftSubscriptionConfig<const I extends NftInclude | undefined = undefined>(
  params: RichSubscriptionParams<NftFilter, NftSort, I>,
): RichSubscriptionConfig<NftResult<I>> {
  return richSubscriptionConfig(V3NftsSubscriptionDocument, nftVariables(params), (raw) =>
    selectedNft<I>(raw, params.include),
  );
}

export function buildOwnedAssetSubscriptionConfig<
  const I extends OwnedAssetInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<OwnedAssetFilter, OwnedAssetSort, I>,
): RichSubscriptionConfig<OwnedAssetResult<I>> {
  return richSubscriptionConfig(
    V3OwnedAssetsSubscriptionDocument,
    ownedAssetVariables(params),
    (raw) => selectedOwnedAsset<I>(raw, params.include),
  );
}

export function buildOwnedTokenSubscriptionConfig<
  const I extends OwnedTokenInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<OwnedTokenFilter, OwnedTokenSort, I>,
): RichSubscriptionConfig<OwnedTokenResult<I>> {
  return richSubscriptionConfig(
    V3OwnedTokensSubscriptionDocument,
    ownedTokenVariables(params),
    (raw) => selectedOwnedToken<I>(raw, params.include),
  );
}

export function buildFollowerSubscriptionConfig<
  const I extends FollowerInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<FollowerFilter, FollowerSort, I>,
): RichSubscriptionConfig<FollowerResult<I>> {
  return richSubscriptionConfig(V3FollowersSubscriptionDocument, followerVariables(params), (raw) =>
    selectedFollower<I>(raw, params.include),
  );
}

export function buildCreatorSubscriptionConfig<
  const I extends CreatorInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<CreatorFilter, CreatorSort, I>,
): RichSubscriptionConfig<CreatorResult<I>> {
  return richSubscriptionConfig(V3CreatorsSubscriptionDocument, creatorVariables(params), (raw) =>
    selectedCreator<I>(raw, params.include),
  );
}

export function buildIssuedAssetSubscriptionConfig<
  const I extends IssuedAssetInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<IssuedAssetFilter, IssuedAssetSort, I>,
): RichSubscriptionConfig<IssuedAssetResult<I>> {
  return richSubscriptionConfig(
    V3IssuedAssetsSubscriptionDocument,
    issuedAssetVariables(params),
    (raw) => selectedIssuedAsset<I>(raw, params.include),
  );
}

export function buildDataChangedEventSubscriptionConfig<
  const I extends DataChangedEventInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<DataChangedEventFilter, DataChangedEventSort, I>,
): RichSubscriptionConfig<DataChangedEventResult<I>> {
  return richSubscriptionConfig(
    V3EventsSubscriptionDocument,
    eventVariables(params, 'DataChanged', params.filter, params.sort),
    (raw) => selectedDataChangedEvent<I>(raw, params.include),
  );
}

export function buildTokenIdDataChangedEventSubscriptionConfig<
  const I extends TokenIdDataChangedEventInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<TokenIdDataChangedEventFilter, TokenIdDataChangedEventSort, I>,
): RichSubscriptionConfig<TokenIdDataChangedEventResult<I>> {
  return richSubscriptionConfig(
    V3EventsSubscriptionDocument,
    eventVariables(params, 'TokenIdDataChanged', params.filter, params.sort),
    (raw) => selectedTokenIdDataChangedEvent<I>(raw, params.include),
  );
}

export function buildUniversalReceiverEventSubscriptionConfig<
  const I extends UniversalReceiverEventInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<UniversalReceiverEventFilter, UniversalReceiverEventSort, I>,
): RichSubscriptionConfig<UniversalReceiverEventResult<I>> {
  return richSubscriptionConfig(
    V3EventsSubscriptionDocument,
    eventVariables(params, 'UniversalReceiver', params.filter, params.sort),
    (raw) => selectedUniversalReceiverEvent<I>(raw, params.include),
  );
}

export function buildEncryptedAssetSubscriptionConfig<
  const I extends EncryptedAssetInclude | undefined = undefined,
>(
  params: RichSubscriptionParams<EncryptedAssetFilter, EncryptedAssetSort, I>,
): RichSubscriptionConfig<EncryptedAssetResult<I>> {
  return richSubscriptionConfig(
    V3MetadataRevisionsSubscriptionDocument,
    encryptedAssetVariables(params),
    (raw) => selectedEncryptedAsset<I>(raw, params.include),
  );
}
