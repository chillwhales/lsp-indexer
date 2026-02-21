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
import { escapeLike, hasActiveIncludes, orderDir } from './utils';

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
 * - `owner`     → `{ owner: { _ilike: '%owner%' } }`
 * - `address`   → `{ address: { _ilike: '%address%' } }`
 * - `ownerName` → `{ universalProfile: { lsp3Profile: { name: { value: { _ilike: '%name%' } } } } }`
 * - `assetName` → `{ digitalAsset: { lsp4TokenName: { value: { _ilike: '%name%' } } } }`
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

  if (filter.ownerName) {
    conditions.push({
      universalProfile: {
        lsp3Profile: { name: { value: { _ilike: `%${escapeLike(filter.ownerName)}%` } } },
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
 * - When `include.digitalAsset` has at least one truthy sub-field → `includeDigitalAsset: true`
 *   with sub-include variables from `buildDigitalAssetIncludeVars`.
 * - When `include.digitalAsset` is `undefined`, `{}`, or all-false → `includeDigitalAsset: false`.
 *
 * **Universal profile sub-includes:**
 * - Same pattern as digital asset — only included when at least one sub-field is truthy.
 */
function buildIncludeVars(include?: OwnedAssetInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const activeDA = hasActiveIncludes(include.digitalAsset);
  const activeUP = hasActiveIncludes(include.universalProfile);

  const vars: Record<string, boolean> = {
    includeDigitalAsset: activeDA,
    includeUniversalProfile: activeUP,
    includeTokenIdCount: include.tokenIdCount ?? false,
  };

  // Digital asset sub-includes: reuse digital asset include builder.
  if (activeDA) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    Object.assign(vars, daVars);
  }

  // Profile sub-includes: reuse profile include builder with includeProfile* prefix.
  if (activeUP) {
    const profileVars = buildProfileIncludeVars(include.universalProfile);
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
