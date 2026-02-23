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
 * - `holderAddress`       → `{ owner: { _ilike: '%holder%' } }`
 * - `digitalAssetAddress` → `{ address: { _ilike: '%address%' } }`
 * - `holderName`          → `{ universalProfile: { lsp3Profile: { name: { value: { _ilike: '%name%' } } } } }`
 * - `assetName`           → `{ digitalAsset: { lsp4TokenName: { value: { _ilike: '%name%' } } } }`
 *
 * All string fields use `_ilike` + `escapeLike` for case-insensitive matching
 * (EIP-55 mixed-case address prevention).
 */
function buildOwnedAssetWhere(filter?: OwnedAssetFilter): Owned_Asset_Bool_Exp {
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
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `OwnedAssetSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - Direct columns: `balance`, `timestamp`, `block`
 *   → `[{ [field]: dir }]`
 * - Renamed: `digitalAssetAddress` → `[{ address: dir }]`
 * - Renamed: `holderAddress` → `[{ owner: dir }]`
 * - Nested `digitalAssetName`
 *   → `[{ digitalAsset: { lsp4TokenName: { value: dir } } }]`
 * - Nested `tokenIdCount`
 *   → `[{ tokenIds_aggregate: { count: dir } }]`
 *
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 */
function buildOwnedAssetOrderBy(sort?: OwnedAssetSort): Owned_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'balance':
    case 'timestamp':
    case 'block':
      return [{ [sort.field]: dir }];
    case 'digitalAssetAddress':
      return [{ address: dir }];
    case 'holderAddress':
      return [{ owner: dir }];
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
 * **Direct column includes:**
 * - `balance`, `block`, `timestamp` map to `includeBalance`, `includeBlock`, `includeTimestamp`.
 *
 * **Digital asset sub-includes:**
 * - When `include.digitalAsset` has at least one truthy sub-field → `includeDigitalAsset: true`
 *   with sub-include variables from `buildDigitalAssetIncludeVars`.
 * - When `include.digitalAsset` is `undefined`, `{}`, or all-false → `includeDigitalAsset: false`.
 *
 * **Holder (universal profile) sub-includes:**
 * - Same pattern as digital asset — only included when at least one sub-field is truthy.
 *   Variable name: `includeHolder` (maps to `$includeHolder` in GraphQL document).
 */
function buildIncludeVars(include?: OwnedAssetInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const activeDA = hasActiveIncludes(include.digitalAsset);
  const activeHolder = hasActiveIncludes(include.holder);

  const vars: Record<string, boolean> = {
    includeBalance: include.balance ?? false,
    includeBlock: include.block ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeDigitalAsset: activeDA,
    includeHolder: activeHolder,
    includeTokenIdCount: include.tokenIdCount ?? false,
  };

  // Digital asset sub-includes: reuse digital asset include builder.
  if (activeDA) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    Object.assign(vars, daVars);
  }

  // Profile sub-includes: reuse profile include builder with includeProfile* prefix.
  if (activeHolder) {
    const profileVars = buildProfileIncludeVars(include.holder);
    Object.assign(vars, profileVars);
  }

  return vars;
}

/**
 * Build owned-asset sub-include variables for use in cross-domain contexts.
 *
 * Used by owned-tokens when building include variables for the nested `ownedAsset` relation.
 * Maps `OwnedTokenOwnedAssetInclude` fields to `includeOwnedAsset*` prefixed variables.
 *
 * Returns `{}` when include is undefined (GraphQL defaults all to true).
 */
export function buildOwnedAssetIncludeVars(
  include?: OwnedTokenOwnedAssetInclude,
): Record<string, boolean> {
  if (!include) {
    return {};
  }

  return {
    includeOwnedAssetBalance: include.balance ?? false,
    includeOwnedAssetBlock: include.block ?? false,
    includeOwnedAssetTimestamp: include.timestamp ?? false,
  };
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

/**
 * Result shape for paginated owned asset list queries.
 *
 * When the include parameter `I` is provided, the `ownedAssets` array contains
 * narrowed types with only base fields + included fields.
 */
export interface FetchOwnedAssetsResult<P = OwnedAsset> {
  /** Parsed owned assets for the current page (narrowed by include) */
  ownedAssets: P[];
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
  const orderBy = buildOwnedAssetOrderBy(params.sort);
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
