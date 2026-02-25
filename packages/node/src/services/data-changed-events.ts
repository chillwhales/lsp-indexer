import type {
  DataChangedEvent,
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventResult,
  DataChangedEventSort,
  PartialDataChangedEvent,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetDataChangedEventsDocument } from '../documents/data-changed-events';
import type { Data_Changed_Bool_Exp, Data_Changed_Order_By } from '../graphql/graphql';
import { parseDataChangedEvents } from '../parsers/data-changed-events';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import { escapeLike, hasActiveIncludes, normalizeTimestamp, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `DataChangedEventFilter` to a Hasura `data_changed_bool_exp`.
 *
 * All 9 filter fields — string fields use
 * `_ilike` + `escapeLike` for case-insensitive matching, timestamp and
 * blockNumber fields use `_gte` / `_lte`.
 *
 * Multiple conditions combine with `_and`. Empty filter = empty object.
 *
 * Filter → Hasura mapping:
 * - `address`              → `{ address: { _ilike: '%escapeLike%' } }`
 * - `dataKey`              → `{ data_key: { _ilike: '%escapeLike%' } }` (Hasura field is `data_key`)
 * - `dataKeyName`          → resolved to hex via `resolveDataKeyHex`, then `{ data_key: { _ilike } }`
 * - `timestampFrom`        → `{ timestamp: { _gte: normalizeTimestamp } }`
 * - `timestampTo`          → `{ timestamp: { _lte: normalizeTimestamp } }`
 * - `blockNumberFrom`      → `{ block_number: { _gte: value } }` (Int comparison)
 * - `blockNumberTo`        → `{ block_number: { _lte: value } }`
 * - `universalProfileName` → `{ universalProfile: { lsp3Profile: { name: { value: { _ilike } } } } }` (nested)
 * - `digitalAssetName`     → `{ digitalAsset: { lsp4TokenName: { value: { _ilike } } } }` (nested)
 */
function buildDataChangedEventWhere(filter?: DataChangedEventFilter): Data_Changed_Bool_Exp {
  if (!filter) return {};

  const conditions: Data_Changed_Bool_Exp[] = [];

  if (filter.address) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.address)}%` },
    });
  }

  if (filter.dataKey) {
    conditions.push({
      data_key: { _ilike: `%${escapeLike(filter.dataKey)}%` },
    });
  }

  if (filter.dataKeyName) {
    const hex = resolveDataKeyHex(filter.dataKeyName);
    if (hex) {
      // Resolved known name → exact match on the hex key
      conditions.push({
        data_key: { _ilike: hex },
      });
    } else {
      // Unknown name — pass through as substring match (best-effort)
      conditions.push({
        data_key: { _ilike: `%${escapeLike(filter.dataKeyName)}%` },
      });
    }
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

  if (filter.blockNumberFrom != null) {
    conditions.push({
      block_number: { _gte: filter.blockNumberFrom },
    });
  }

  if (filter.blockNumberTo != null) {
    conditions.push({
      block_number: { _lte: filter.blockNumberTo },
    });
  }

  if (filter.universalProfileName) {
    conditions.push({
      universalProfile: {
        lsp3Profile: {
          name: { value: { _ilike: `%${escapeLike(filter.universalProfileName)}%` } },
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

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `DataChangedEventSort` to a Hasura `data_changed_order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'timestamp'`             → `[{ timestamp: dir }]`
 * - `'blockNumber'`           → `[{ block_number: dir }]`
 * - `'universalProfileName'`  → `[{ universalProfile: { lsp3Profile: { name: { value: dir } } } }]` (nested)
 * - `'digitalAssetName'`      → `[{ digitalAsset: { lsp4TokenName: { value: dir } } }]` (nested)
 *
 * Name sorts default to `nulls: 'last'` when not specified (names without values sort last).
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 */
function buildDataChangedEventOrderBy(
  sort?: DataChangedEventSort,
): Data_Changed_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'timestamp':
      return [{ timestamp: dir }];
    case 'blockNumber':
      return [{ block_number: dir }];
    case 'universalProfileName':
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
 * Translate a `DataChangedEventInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **Profile sub-includes:** Reuses `buildProfileIncludeVars` with prefix replacement:
 * - `includeProfile*` → `includeUniversalProfile*` for universal profile sub-includes
 *
 * **Digital asset sub-includes:** Reuses `buildDigitalAssetIncludeVars` with prefix replacement:
 * - `include*` → `includeDigitalAsset*` for digital asset sub-includes
 *
 * @param include - Optional include config; `undefined` = include everything
 * @returns Record of boolean variables for the GetDataChangedEvents GraphQL document
 */
export function buildDataChangedEventIncludeVars(
  include?: DataChangedEventInclude,
): Record<string, boolean> {
  if (!include) return {};

  const activeUP = hasActiveIncludes(include.universalProfile);
  const activeDA = hasActiveIncludes(include.digitalAsset);

  const vars: Record<string, boolean> = {
    includeBlockNumber: include.blockNumber ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeLogIndex: include.logIndex ?? false,
    includeTransactionIndex: include.transactionIndex ?? false,
    includeUniversalProfile: activeUP,
    includeDigitalAsset: activeDA,
  };

  // UP sub-includes: reuse profile include builder with "UniversalProfile" prefix
  if (activeUP) {
    const profileVars = buildProfileIncludeVars(include.universalProfile);
    for (const [key, val] of Object.entries(profileVars)) {
      // includeProfileName → includeUniversalProfileName
      vars[key.replace('includeProfile', 'includeUniversalProfile')] = val;
    }
  }

  // DA sub-includes: reuse DA include builder with "DigitalAsset" prefix
  if (activeDA) {
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
 * Result shape for paginated data changed event list queries.
 *
 * When the include parameter is provided, the `dataChangedEvents` array contains
 * narrowed types with only base fields + included fields.
 */
export interface FetchDataChangedEventsResult<P = DataChangedEvent> {
  /** Parsed data changed event records for the current page (narrowed by include) */
  dataChangedEvents: P[];
  /** Total number of data changed event records matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of ERC725Y data changed event records with filtering, sorting,
 * total count, and optional include narrowing.
 *
 * Serves both `useDataChangedEvents` (paginated) and `useInfiniteDataChangedEvents`
 * (infinite scroll) — the difference is how the hook manages pagination, not the
 * fetch function.
 *
 * No singular `fetchDataChangedEvent` exists because event records have no natural key
 * (opaque Hasura ID only). Developers query by filter instead.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed data changed events (narrowed by include) and total count
 */
export async function fetchDataChangedEvents(
  url: string,
  params?: {
    filter?: DataChangedEventFilter;
    sort?: DataChangedEventSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchDataChangedEventsResult>;
export async function fetchDataChangedEvents<const I extends DataChangedEventInclude>(
  url: string,
  params: {
    filter?: DataChangedEventFilter;
    sort?: DataChangedEventSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchDataChangedEventsResult<DataChangedEventResult<I>>>;
export async function fetchDataChangedEvents(
  url: string,
  params: {
    filter?: DataChangedEventFilter;
    sort?: DataChangedEventSort;
    limit?: number;
    offset?: number;
    include?: DataChangedEventInclude;
  },
): Promise<FetchDataChangedEventsResult<PartialDataChangedEvent>>;
export async function fetchDataChangedEvents(
  url: string,
  params: {
    filter?: DataChangedEventFilter;
    sort?: DataChangedEventSort;
    limit?: number;
    offset?: number;
    include?: DataChangedEventInclude;
  } = {},
): Promise<FetchDataChangedEventsResult<PartialDataChangedEvent>> {
  const where = buildDataChangedEventWhere(params.filter);
  const orderBy = buildDataChangedEventOrderBy(params.sort);
  const includeVars = buildDataChangedEventIncludeVars(params.include);

  const result = await execute(url, GetDataChangedEventsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      dataChangedEvents: parseDataChangedEvents(result.data_changed, params.include),
      totalCount: result.data_changed_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    dataChangedEvents: parseDataChangedEvents(result.data_changed),
    totalCount: result.data_changed_aggregate?.aggregate?.count ?? 0,
  };
}

/**
 * Fetch the most recent DataChanged event matching the given filter.
 *
 * Internally queries with `limit: 1` sorted by `timestamp desc` to return
 * the latest event for a given address + data key combination.
 *
 * The `dataKeyName` filter field accepts human-readable ERC725Y key names
 * (e.g., 'LSP3Profile') — the service layer resolves them to hex automatically.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter + optional include)
 * @returns The latest matching event (narrowed by include), or `null` if none found
 */
export async function fetchLatestDataChangedEvent(
  url: string,
  params?: { filter?: DataChangedEventFilter },
): Promise<DataChangedEvent | null>;
export async function fetchLatestDataChangedEvent<const I extends DataChangedEventInclude>(
  url: string,
  params: { filter?: DataChangedEventFilter; include: I },
): Promise<DataChangedEventResult<I> | null>;
export async function fetchLatestDataChangedEvent(
  url: string,
  params: { filter?: DataChangedEventFilter; include?: DataChangedEventInclude },
): Promise<PartialDataChangedEvent | null>;
export async function fetchLatestDataChangedEvent(
  url: string,
  params: { filter?: DataChangedEventFilter; include?: DataChangedEventInclude } = {},
): Promise<PartialDataChangedEvent | null> {
  const result = params.include
    ? await fetchDataChangedEvents(url, {
        filter: params.filter,
        sort: { field: 'timestamp', direction: 'desc' },
        limit: 1,
        include: params.include,
      })
    : await fetchDataChangedEvents(url, {
        filter: params.filter,
        sort: { field: 'timestamp', direction: 'desc' },
        limit: 1,
      });

  return result.dataChangedEvents[0] ?? null;
}
