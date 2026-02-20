import type {
  OwnedAsset,
  OwnedAssetFilter,
  OwnedAssetInclude,
  OwnedAssetSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetOwnedAssetDocument, GetOwnedAssetsDocument } from '../documents/owned-assets';
import type { Owned_Asset_Bool_Exp, Owned_Asset_Order_By } from '../graphql/graphql';
import { parseOwnedAsset, parseOwnedAssets } from '../parsers/owned-assets';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import { escapeLike, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `OwnedAssetFilter` to a Hasura `owned_asset_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `owner`              → `{ owner: { _ilike: '%owner%' } }`
 * - `address`            → `{ address: { _ilike: '%address%' } }`
 * - `digitalAssetId`     → `{ digital_asset_id: { _ilike: '%digitalAssetId%' } }`
 * - `universalProfileId` → `{ universal_profile_id: { _ilike: '%universalProfileId%' } }`
 *
 * All string fields use `_ilike` + `escapeLike` for case-insensitive matching
 * (EIP-55 mixed-case address prevention).
 */
function buildWhere(filter?: OwnedAssetFilter): Owned_Asset_Bool_Exp {
  if (!filter) return {};

  const conditions: Owned_Asset_Bool_Exp[] = [];

  if (filter.owner) {
    conditions.push({
      owner: { _ilike: `%${escapeLike(filter.owner)}%` },
    });
  }

  if (filter.address) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.address)}%` },
    });
  }

  if (filter.digitalAssetId) {
    conditions.push({
      digital_asset_id: { _ilike: `%${escapeLike(filter.digitalAssetId)}%` },
    });
  }

  if (filter.universalProfileId) {
    conditions.push({
      universal_profile_id: { _ilike: `%${escapeLike(filter.universalProfileId)}%` },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `OwnedAssetSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - Direct columns: `balance`, `timestamp`, `address`, `owner`, `block`
 *   → `[{ [field]: dir }]`
 * - Nested `digitalAssetName`
 *   → `[{ digitalAsset: { lsp4TokenName: { value: dir } } }]`
 * - Nested `tokenIdCount`
 *   → `[{ tokenIds_aggregate: { count: dir } }]`
 *
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 */
function buildOrderBy(sort?: OwnedAssetSort): Owned_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'balance':
    case 'timestamp':
    case 'address':
    case 'owner':
    case 'block':
      return [{ [sort.field]: dir }];
    case 'digitalAssetName':
      return [{ digitalAsset: { lsp4TokenName: { value: dir } } }];
    case 'tokenIdCount':
      return [{ tokenIds_aggregate: { count: dir } }];
    default:
      return undefined;
  }
}

/**
 * Translate an `OwnedAssetInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **Digital asset sub-includes:**
 * - When `include.digitalAsset` is **provided** (even as `{}`) → `includeDigitalAsset: true`
 *   with sub-include variables from `buildDigitalAssetIncludeVars`.
 * - When `include.digitalAsset` is **undefined** → `includeDigitalAsset: false`.
 */
function buildIncludeVars(include?: OwnedAssetInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const vars: Record<string, boolean> = {
    includeDigitalAsset: include.digitalAsset !== undefined, // provided (even {}) = include
    includeUniversalProfile: include.universalProfile !== undefined, // provided (even {}) = include
    includeTokenIdCount: include.tokenIdCount ?? false,
  };

  // Digital asset sub-includes: reuse digital asset include builder.
  // When digitalAsset is empty {} → buildDigitalAssetIncludeVars returns {} → GraphQL defaults apply.
  // When digitalAsset has explicit keys → each key is mapped to include* variables.
  if (include.digitalAsset) {
    const daVars = buildDigitalAssetIncludeVars(
      Object.keys(include.digitalAsset).length > 0 ? include.digitalAsset : undefined,
    );
    Object.assign(vars, daVars);
  }

  // Profile sub-includes: reuse profile include builder with includeProfile* prefix.
  // Same pattern as digital asset sub-includes.
  if (include.universalProfile) {
    const profileVars = buildProfileIncludeVars(
      Object.keys(include.universalProfile).length > 0 ? include.universalProfile : undefined,
    );
    Object.assign(vars, profileVars);
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single owned asset by ID.
 *
 * Translates the ID to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `OwnedAsset`, or `null` if
 * the ID doesn't exist.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (id + optional include)
 * @returns The parsed owned asset, or `null` if not found
 */
export async function fetchOwnedAsset(
  url: string,
  params: { id: string; include?: OwnedAssetInclude },
): Promise<OwnedAsset | null> {
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetOwnedAssetDocument, {
    where: { id: { _eq: params.id } },
    ...includeVars,
  });

  const raw = result.owned_asset[0];
  return raw ? parseOwnedAsset(raw) : null;
}

/**
 * Result shape for paginated owned asset list queries.
 */
export interface FetchOwnedAssetsResult {
  /** Parsed owned assets for the current page */
  ownedAssets: OwnedAsset[];
  /** Total number of owned assets matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of owned assets with filtering, sorting, and total count.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed owned assets and total count
 */
export async function fetchOwnedAssets(
  url: string,
  params: {
    filter?: OwnedAssetFilter;
    sort?: OwnedAssetSort;
    limit?: number;
    offset?: number;
    include?: OwnedAssetInclude;
  } = {},
): Promise<FetchOwnedAssetsResult> {
  const where = buildWhere(params.filter);
  const orderBy = buildOrderBy(params.sort);
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetOwnedAssetsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  return {
    ownedAssets: parseOwnedAssets(result.owned_asset),
    totalCount: result.owned_asset_aggregate?.aggregate?.count ?? 0,
  };
}
