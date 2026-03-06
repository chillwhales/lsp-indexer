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
import { escapeLike, hasActiveIncludes, normalizeTimestamp, orderDir } from './utils';

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
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/** Translate IssuedAssetSort to a Hasura order_by. */
function buildIssuedAssetOrderBy(
  sort?: IssuedAssetSort,
): Lsp12_Issued_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'timestamp':
      return [{ timestamp: dir }];
    case 'issuerAddress':
      return [{ address: dir }];
    case 'assetAddress':
      return [{ asset_address: dir }];
    case 'arrayIndex':
      return [{ array_index: dir }];
    case 'issuerName':
      return [
        {
          universalProfile: {
            lsp3Profile: {
              name: { value: orderDir(sort.direction, sort.nulls ?? 'last') },
            },
          },
        },
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
      ];
    default:
      return undefined;
  }
}

/**
 * Translate an `IssuedAssetInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **Profile sub-includes:** Reuses `buildProfileIncludeVars` with prefix replacement:
 * - `includeProfile*` → `includeIssuerProfile*` for issuer profile sub-includes
 *
 * **Digital asset sub-includes:** Reuses `buildDigitalAssetIncludeVars` with prefix replacement:
 * - `include*` → `includeDigitalAsset*` for digital asset sub-includes
 *
 */
export function buildIssuedAssetIncludeVars(include?: IssuedAssetInclude): Record<string, boolean> {
  if (!include) return {};

  const activeIssuerProfile = hasActiveIncludes(include.issuerProfile);
  const activeDigitalAsset = hasActiveIncludes(include.digitalAsset);

  const vars: Record<string, boolean> = {
    includeArrayIndex: include.arrayIndex ?? false,
    includeInterfaceId: include.interfaceId ?? false,
    includeTimestamp: include.timestamp ?? false,
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

  // Digital asset sub-includes: reuse DA include builder with "DigitalAsset" prefix
  if (activeDigitalAsset) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    for (const [key, val] of Object.entries(daVars)) {
      vars[key.replace('include', 'includeDigitalAsset')] = val;
    }
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
  const orderBy = buildIssuedAssetOrderBy(params.sort);
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
  /** Parsed issued asset records for the current page (narrowed by include) */
  issuedAssets: P[];
  /** Total number of issued asset records matching the filter (for pagination UI) */
  totalCount: number;
}

/** Fetch a paginated list of LSP12 issued asset records. No singular `fetchIssuedAsset` — issued asset records have no natural key
 * (opaque Hasura ID only). */
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
  const orderBy = buildIssuedAssetOrderBy(params.sort);
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
