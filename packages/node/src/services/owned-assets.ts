import type {
  OwnedAsset,
  OwnedAssetFilter,
  OwnedAssetInclude,
  OwnedAssetResult,
  OwnedAssetSort,
  OwnedTokenOwnedAssetInclude,
  PartialOwnedAsset,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  GetOwnedAssetDocument,
  GetOwnedAssetsDocument,
  OwnedAssetSubscriptionDocument,
} from '../documents/owned-assets';
import type {
  OwnedAssetSubscriptionSubscription,
  Owned_Asset_Bool_Exp,
  Owned_Asset_Order_By,
} from '../graphql/graphql';
import { parseOwnedAsset, parseOwnedAssets } from '../parsers/owned-assets';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import { buildBlockOrderSort, escapeLike, hasActiveIncludes, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/** Translate OwnedAssetFilter to a Hasura _bool_exp. */
export function buildOwnedAssetWhere(filter?: OwnedAssetFilter): Owned_Asset_Bool_Exp {
  if (!filter) return {};

  const conditions: Owned_Asset_Bool_Exp[] = [];

  if (filter.holderAddress) {
    conditions.push({
      owner: { _ilike: `%${escapeLike(filter.holderAddress)}%` },
    });
  }

  if (filter.digitalAssetAddress) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.digitalAssetAddress)}%` },
    });
  }

  if (filter.holderName) {
    conditions.push({
      universalProfile: {
        lsp3Profile: { name: { value: { _ilike: `%${escapeLike(filter.holderName)}%` } } },
      },
    });
  }

  if (filter.assetName) {
    conditions.push({
      digitalAsset: {
        lsp4TokenName: { value: { _ilike: `%${escapeLike(filter.assetName)}%` } },
      },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}

/** Translate OwnedAssetSort to a Hasura order_by. */
function buildOwnedAssetOrderBy(sort?: OwnedAssetSort): Owned_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
    case 'balance':
      return [{ balance: dir }, ...buildBlockOrderSort('desc')];
    case 'digitalAssetAddress':
      return [{ address: dir }, ...buildBlockOrderSort('desc')];
    case 'holderAddress':
      return [{ owner: dir }, ...buildBlockOrderSort('desc')];
    case 'digitalAssetName':
      return [{ digitalAsset: { lsp4TokenName: { value: dir } } }, ...buildBlockOrderSort('desc')];
    case 'tokenIdCount':
      return [{ tokenIds_aggregate: { count: dir } }, ...buildBlockOrderSort('desc')];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
function buildIncludeVars(include?: OwnedAssetInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const activeDA = hasActiveIncludes(include.digitalAsset);
  const activeHolder = hasActiveIncludes(include.holder);

  const vars: Record<string, boolean> = {
    includeBalance: include.balance ?? false,
    includeBlockNumber: include.blockNumber ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeTransactionIndex: include.transactionIndex ?? false,
    includeLogIndex: include.logIndex ?? false,
    includeDigitalAsset: activeDA,
    includeProfile: activeHolder,
    includeTokenIdCount: include.tokenIdCount ?? false,
  };

  // Digital asset sub-includes: reuse DA include builder (keys already prefixed).
  if (activeDA) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    Object.assign(vars, daVars);
  }

  // Profile sub-includes: reuse profile include builder (keys already match GQL vars).
  if (activeHolder) {
    const profileVars = buildProfileIncludeVars(include.holder);
    Object.assign(vars, profileVars);
  }

  return vars;
}

/** Build owned-asset sub-include variables for cross-domain contexts. */
export function buildOwnedAssetIncludeVars(
  include?: boolean | OwnedTokenOwnedAssetInclude,
): Record<string, boolean> {
  if (!include) {
    return {};
  }
  if (include === true) {
    return {};
  }

  return {
    includeOwnedAssetBalance: include.balance ?? false,
    includeOwnedAssetBlockNumber: include.blockNumber ?? false,
    includeOwnedAssetTimestamp: include.timestamp ?? false,
    includeOwnedAssetTransactionIndex: include.transactionIndex ?? false,
    includeOwnedAssetLogIndex: include.logIndex ?? false,
  };
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

/** Raw subscription row type extracted from codegen. */
type RawOwnedAssetSubscriptionRow = OwnedAssetSubscriptionSubscription['owned_asset'][number];

/** Build subscription config for useSubscription. */
export function buildOwnedAssetSubscriptionConfig(params: {
  filter?: OwnedAssetFilter;
  sort?: OwnedAssetSort;
  limit?: number;
  include?: OwnedAssetInclude;
}) {
  const where = buildOwnedAssetWhere(params.filter);
  const orderBy = buildOwnedAssetOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildIncludeVars(params.include);

  return {
    document: OwnedAssetSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: OwnedAssetSubscriptionSubscription) => result.owned_asset,
    parser: (raw: RawOwnedAssetSubscriptionRow[]) =>
      params.include ? parseOwnedAssets(raw, params.include) : parseOwnedAssets(raw),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/** Fetch a single owned asset by ID. */
export async function fetchOwnedAsset(
  url: string,
  params: { id: string },
): Promise<OwnedAsset | null>;
export async function fetchOwnedAsset<const I extends OwnedAssetInclude>(
  url: string,
  params: { id: string; include: I },
): Promise<OwnedAssetResult<I> | null>;
export async function fetchOwnedAsset(
  url: string,
  params: { id: string; include?: OwnedAssetInclude },
): Promise<PartialOwnedAsset | null>;
export async function fetchOwnedAsset(
  url: string,
  params: { id: string; include?: OwnedAssetInclude },
): Promise<PartialOwnedAsset | null> {
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetOwnedAssetDocument, {
    where: { id: { _eq: params.id } },
    ...includeVars,
  });

  const raw = result.owned_asset[0];
  if (!raw) return null;
  if (params.include) return parseOwnedAsset(raw, params.include);
  return parseOwnedAsset(raw);
}

export interface FetchOwnedAssetsResult<P = OwnedAsset> {
  ownedAssets: P[];
  totalCount: number;
}

/** Fetch a paginated list of owned assets. */
export async function fetchOwnedAssets(
  url: string,
  params?: {
    filter?: OwnedAssetFilter;
    sort?: OwnedAssetSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchOwnedAssetsResult>;
export async function fetchOwnedAssets<const I extends OwnedAssetInclude>(
  url: string,
  params: {
    filter?: OwnedAssetFilter;
    sort?: OwnedAssetSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchOwnedAssetsResult<OwnedAssetResult<I>>>;
export async function fetchOwnedAssets(
  url: string,
  params: {
    filter?: OwnedAssetFilter;
    sort?: OwnedAssetSort;
    limit?: number;
    offset?: number;
    include?: OwnedAssetInclude;
  },
): Promise<FetchOwnedAssetsResult<PartialOwnedAsset>>;
export async function fetchOwnedAssets(
  url: string,
  params: {
    filter?: OwnedAssetFilter;
    sort?: OwnedAssetSort;
    limit?: number;
    offset?: number;
    include?: OwnedAssetInclude;
  } = {},
): Promise<FetchOwnedAssetsResult<PartialOwnedAsset>> {
  const where = buildOwnedAssetWhere(params.filter);
  const orderBy = buildOwnedAssetOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetOwnedAssetsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      ownedAssets: parseOwnedAssets(result.owned_asset, params.include),
      totalCount: result.owned_asset_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    ownedAssets: parseOwnedAssets(result.owned_asset),
    totalCount: result.owned_asset_aggregate?.aggregate?.count ?? 0,
  };
}
