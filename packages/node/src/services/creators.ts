import type {
  Creator,
  CreatorFilter,
  CreatorInclude,
  CreatorResult,
  CreatorSort,
  PartialCreator,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetCreatorsDocument } from '../documents/creators';
import type { Lsp4_Creator_Bool_Exp, Lsp4_Creator_Order_By } from '../graphql/graphql';
import { parseCreators } from '../parsers/creators';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import { escapeLike, hasActiveIncludes, normalizeTimestamp, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `CreatorFilter` to a Hasura `lsp4_creator_bool_exp`.
 *
 * All 7 filter fields — string fields use `_ilike` + `escapeLike` for
 * case-insensitive matching, timestamp fields use `_gte` / `_lte`.
 *
 * Multiple conditions combine with `_and`. Empty filter = empty object.
 *
 * Filter → Hasura mapping:
 * - `creatorAddress`    → `{ creator_address: { _ilike: '%escapeLike%' } }` (partial match)
 * - `digitalAssetAddress` → `{ address: { _ilike: '%escapeLike%' } }` (partial match)
 * - `interfaceId`       → `{ interface_id: { _ilike: '%escapeLike%' } }` (partial match)
 * - `creatorName`       → `{ creatorProfile: { lsp3Profile: { name: { value: { _ilike } } } } }` (nested)
 * - `digitalAssetName`  → `{ digitalAsset: { lsp4TokenName: { value: { _ilike } } } }` (nested)
 * - `timestampFrom`     → `{ timestamp: { _gte: normalizeTimestamp } }`
 * - `timestampTo`       → `{ timestamp: { _lte: normalizeTimestamp } }`
 */
function buildCreatorWhere(filter?: CreatorFilter): Lsp4_Creator_Bool_Exp {
  if (!filter) return {};

  const conditions: Lsp4_Creator_Bool_Exp[] = [];

  if (filter.creatorAddress) {
    conditions.push({
      creator_address: { _ilike: `%${escapeLike(filter.creatorAddress)}%` },
    });
  }

  if (filter.digitalAssetAddress) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.digitalAssetAddress)}%` },
    });
  }

  if (filter.interfaceId) {
    conditions.push({
      interface_id: { _ilike: `%${escapeLike(filter.interfaceId)}%` },
    });
  }

  if (filter.creatorName) {
    conditions.push({
      creatorProfile: {
        lsp3Profile: {
          name: { value: { _ilike: `%${escapeLike(filter.creatorName)}%` } },
        },
      },
    });
  }

  if (filter.digitalAssetName) {
    conditions.push({
      digitalAsset: {
        lsp4TokenName: {
          value: { _ilike: `%${escapeLike(filter.digitalAssetName)}%` },
        },
      },
    });
  }

  if (filter.timestampFrom) {
    conditions.push({
      timestamp: { _gte: normalizeTimestamp(filter.timestampFrom) },
    });
  }

  if (filter.timestampTo) {
    conditions.push({
      timestamp: { _lte: normalizeTimestamp(filter.timestampTo) },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `CreatorSort` to a Hasura `lsp4_creator_order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'timestamp'`          → `[{ timestamp: dir }]`
 * - `'creatorAddress'`     → `[{ creator_address: dir }]`
 * - `'digitalAssetAddress'` → `[{ address: dir }]`
 * - `'arrayIndex'`         → `[{ array_index: dir }]`
 * - `'creatorName'`        → `[{ creatorProfile: { lsp3Profile: { name: { value: dir } } } }]` (nested)
 * - `'digitalAssetName'`   → `[{ digitalAsset: { lsp4TokenName: { value: dir } } }]` (nested)
 *
 * Name sorts default to `nulls: 'last'` when not specified (names without values sort last).
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 */
function buildCreatorOrderBy(sort?: CreatorSort): Lsp4_Creator_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'timestamp':
      return [{ timestamp: dir }];
    case 'creatorAddress':
      return [{ creator_address: dir }];
    case 'digitalAssetAddress':
      return [{ address: dir }];
    case 'arrayIndex':
      return [{ array_index: dir }];
    case 'creatorName':
      return [
        {
          creatorProfile: {
            lsp3Profile: {
              name: { value: orderDir(sort.direction, sort.nulls ?? 'last') },
            },
          },
        },
      ];
    case 'digitalAssetName':
      return [
        {
          digitalAsset: {
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
 * Translate a `CreatorInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **Profile sub-includes:** Reuses `buildProfileIncludeVars` with prefix replacement:
 * - `includeProfile*` → `includeCreatorProfile*` for creator profile sub-includes
 *
 * **Digital asset sub-includes:** Reuses `buildDigitalAssetIncludeVars` with prefix replacement:
 * - `include*` → `includeDigitalAsset*` for digital asset sub-includes
 *
 * @param include - Optional include config; `undefined` = include everything
 * @returns Record of boolean variables for the GetCreators GraphQL document
 */
export function buildCreatorIncludeVars(include?: CreatorInclude): Record<string, boolean> {
  if (!include) return {};

  const activeCreatorProfile = hasActiveIncludes(include.creatorProfile);
  const activeDigitalAsset = hasActiveIncludes(include.digitalAsset);

  const vars: Record<string, boolean> = {
    includeArrayIndex: include.arrayIndex ?? false,
    includeInterfaceId: include.interfaceId ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeCreatorProfile: activeCreatorProfile,
    includeDigitalAsset: activeDigitalAsset,
  };

  // Creator profile sub-includes: reuse profile include builder with "CreatorProfile" prefix
  if (activeCreatorProfile) {
    const profileVars = buildProfileIncludeVars(include.creatorProfile);
    for (const [key, val] of Object.entries(profileVars)) {
      vars[key.replace('includeProfile', 'includeCreatorProfile')] = val;
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
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated creator list queries.
 *
 * When the include parameter is provided, the `creators` array contains
 * narrowed types with only base fields + included fields.
 */
export interface FetchCreatorsResult<P = Creator> {
  /** Parsed creator records for the current page (narrowed by include) */
  creators: P[];
  /** Total number of creator records matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of LSP4 creator records with filtering, sorting,
 * total count, and optional include narrowing.
 *
 * Serves both `useCreators` (paginated) and `useInfiniteCreators` (infinite scroll) —
 * the difference is how the hook manages pagination, not the fetch function.
 *
 * No singular `fetchCreator` exists because creator records have no natural key
 * (opaque Hasura ID only). Developers query by filter instead.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed creators (narrowed by include) and total count
 */
export async function fetchCreators(
  url: string,
  params?: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchCreatorsResult>;
export async function fetchCreators<const I extends CreatorInclude>(
  url: string,
  params: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchCreatorsResult<CreatorResult<I>>>;
export async function fetchCreators(
  url: string,
  params: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
    include?: CreatorInclude;
  },
): Promise<FetchCreatorsResult<PartialCreator>>;
export async function fetchCreators(
  url: string,
  params: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
    include?: CreatorInclude;
  } = {},
): Promise<FetchCreatorsResult<PartialCreator>> {
  const where = buildCreatorWhere(params.filter);
  const orderBy = buildCreatorOrderBy(params.sort);
  const includeVars = buildCreatorIncludeVars(params.include);

  const result = await execute(url, GetCreatorsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      creators: parseCreators(result.lsp4_creator, params.include),
      totalCount: result.lsp4_creator_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    creators: parseCreators(result.lsp4_creator),
    totalCount: result.lsp4_creator_aggregate?.aggregate?.count ?? 0,
  };
}
