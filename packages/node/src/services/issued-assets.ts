import type {
  IssuedAsset,
  IssuedAssetFilter,
  IssuedAssetInclude,
  IssuedAssetResult,
  IssuedAssetSort,
  PartialIssuedAsset,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  GetIssuedAssetsDocument,
  IssuedAssetSubscriptionDocument,
} from '../documents/issued-assets';
import type {
  IssuedAssetSubscriptionSubscription,
  Lsp12_Issued_Asset_Bool_Exp,
  Lsp12_Issued_Asset_Order_By,
} from '../graphql/graphql';
import { parseIssuedAssets } from '../parsers/issued-assets';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import {
  buildBlockOrderSort,
  escapeLike,
  hasActiveIncludes,
  normalizeTimestamp,
  orderDir,
} from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/** Translate IssuedAssetFilter to a Hasura _bool_exp. */
export function buildIssuedAssetWhere(filter?: IssuedAssetFilter): Lsp12_Issued_Asset_Bool_Exp {
  if (!filter) return {};

  const conditions: Lsp12_Issued_Asset_Bool_Exp[] = [];

  if (filter.issuerAddress) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.issuerAddress)}%` },
    });
  }

  if (filter.assetAddress) {
    conditions.push({
      asset_address: { _ilike: `%${escapeLike(filter.assetAddress)}%` },
    });
  }

  if (filter.interfaceId) {
    conditions.push({
      interface_id: { _ilike: `%${escapeLike(filter.interfaceId)}%` },
    });
  }

  if (filter.issuerName) {
    conditions.push({
      universalProfile: {
        lsp3Profile: {
          name: { value: { _ilike: `%${escapeLike(filter.issuerName)}%` } },
        },
      },
    });
  }

  if (filter.digitalAssetName) {
    conditions.push({
      issuedAsset: {
        lsp4TokenName: {
          value: { _ilike: `%${escapeLike(filter.digitalAssetName)}%` },
        },
      },
    });
  }

  if (filter.timestampFrom != null) {
    conditions.push({
      timestamp: { _gte: normalizeTimestamp(filter.timestampFrom) },
    });
  }

  if (filter.timestampTo != null) {
    conditions.push({
      timestamp: { _lte: normalizeTimestamp(filter.timestampTo) },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}

/** Translate IssuedAssetSort to a Hasura order_by. */
function buildIssuedAssetOrderBy(
  sort?: IssuedAssetSort,
): Lsp12_Issued_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
    case 'issuerAddress':
      return [{ address: dir }, ...buildBlockOrderSort('desc')];
    case 'assetAddress':
      return [{ asset_address: dir }, ...buildBlockOrderSort('desc')];
    case 'arrayIndex':
      return [{ array_index: dir }, ...buildBlockOrderSort('desc')];
    case 'issuerName':
      return [
        {
          universalProfile: {
            lsp3Profile: {
              name: { value: orderDir(sort.direction, sort.nulls ?? 'last') },
            },
          },
        },
        ...buildBlockOrderSort('desc'),
      ];
    case 'digitalAssetName':
      return [
        {
          issuedAsset: {
            lsp4TokenName: {
              value: orderDir(sort.direction, sort.nulls ?? 'last'),
            },
          },
        },
        ...buildBlockOrderSort('desc'),
      ];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
export function buildIssuedAssetIncludeVars(include?: IssuedAssetInclude): Record<string, boolean> {
  if (!include) return {};

  const activeIssuerProfile = hasActiveIncludes(include.issuerProfile);
  const activeDigitalAsset = hasActiveIncludes(include.digitalAsset);

  const vars: Record<string, boolean> = {
    includeArrayIndex: include.arrayIndex ?? false,
    includeInterfaceId: include.interfaceId ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeBlockNumber: include.blockNumber ?? false,
    includeTransactionIndex: include.transactionIndex ?? false,
    includeLogIndex: include.logIndex ?? false,
    includeIssuerProfile: activeIssuerProfile,
    includeDigitalAsset: activeDigitalAsset,
  };

  // Issuer profile sub-includes: reuse profile include builder with "IssuerProfile" prefix
  if (activeIssuerProfile) {
    const profileVars = buildProfileIncludeVars(include.issuerProfile);
    for (const [key, val] of Object.entries(profileVars)) {
      vars[key.replace('includeProfile', 'includeIssuerProfile')] = val;
    }
  }

  // Digital asset sub-includes: reuse DA include builder (keys already prefixed).
  if (activeDigitalAsset) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    Object.assign(vars, daVars);
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

type RawIssuedAssetSubscriptionRow =
  IssuedAssetSubscriptionSubscription['lsp12_issued_asset'][number];

/** Build subscription config for useSubscription. */
export function buildIssuedAssetSubscriptionConfig(params: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  include?: IssuedAssetInclude;
}) {
  const where = buildIssuedAssetWhere(params.filter);
  const orderBy = buildIssuedAssetOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildIssuedAssetIncludeVars(params.include);

  return {
    document: IssuedAssetSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: IssuedAssetSubscriptionSubscription) => result.lsp12_issued_asset,
    parser: (raw: RawIssuedAssetSubscriptionRow[]) =>
      params.include ? parseIssuedAssets(raw, params.include) : parseIssuedAssets(raw),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

export interface FetchIssuedAssetsResult<P = IssuedAsset> {
  issuedAssets: P[];
  totalCount: number;
}

/** Fetch a paginated list of LSP12 issued asset records. */
export async function fetchIssuedAssets(
  url: string,
  params?: {
    filter?: IssuedAssetFilter;
    sort?: IssuedAssetSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchIssuedAssetsResult>;
export async function fetchIssuedAssets<const I extends IssuedAssetInclude>(
  url: string,
  params: {
    filter?: IssuedAssetFilter;
    sort?: IssuedAssetSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchIssuedAssetsResult<IssuedAssetResult<I>>>;
export async function fetchIssuedAssets(
  url: string,
  params: {
    filter?: IssuedAssetFilter;
    sort?: IssuedAssetSort;
    limit?: number;
    offset?: number;
    include?: IssuedAssetInclude;
  },
): Promise<FetchIssuedAssetsResult<PartialIssuedAsset>>;
export async function fetchIssuedAssets(
  url: string,
  params: {
    filter?: IssuedAssetFilter;
    sort?: IssuedAssetSort;
    limit?: number;
    offset?: number;
    include?: IssuedAssetInclude;
  } = {},
): Promise<FetchIssuedAssetsResult<PartialIssuedAsset>> {
  const where = buildIssuedAssetWhere(params.filter);
  const orderBy = buildIssuedAssetOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildIssuedAssetIncludeVars(params.include);

  const result = await execute(url, GetIssuedAssetsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      issuedAssets: parseIssuedAssets(result.lsp12_issued_asset, params.include),
      totalCount: result.lsp12_issued_asset_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    issuedAssets: parseIssuedAssets(result.lsp12_issued_asset),
    totalCount: result.lsp12_issued_asset_aggregate?.aggregate?.count ?? 0,
  };
}
