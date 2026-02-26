import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventFilter,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
  UniversalReceiverEventSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetUniversalReceiverEventsDocument } from '../documents/universal-receiver-events';
import type { Universal_Receiver_Bool_Exp, Universal_Receiver_Order_By } from '../graphql/graphql';
import { parseUniversalReceiverEvents } from '../parsers/universal-receiver-events';
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

/**
 * Translate a flat `UniversalReceiverEventFilter` to a Hasura `universal_receiver_bool_exp`.
 *
 * All 10 filter params for 8 filter fields — string fields use
 * `_ilike` + `escapeLike` for case-insensitive matching, timestamp and
 * blockNumber fields use `_gte` / `_lte`.
 *
 * Multiple conditions combine with `_and`. Empty filter = empty object.
 *
 * Filter → Hasura mapping:
 * - `address`              → `{ address: { _ilike: '%escapeLike%' } }`
 * - `from`                 → `{ from: { _ilike: '%escapeLike%' } }`
 * - `typeId`               → `{ type_id: { _ilike: '%escapeLike%' } }`
 * - `timestampFrom`        → `{ timestamp: { _gte: normalizeTimestamp } }`
 * - `timestampTo`          → `{ timestamp: { _lte: normalizeTimestamp } }`
 * - `blockNumberFrom`      → `{ block_number: { _gte: value } }` (Int comparison)
 * - `blockNumberTo`        → `{ block_number: { _lte: value } }`
 * - `universalProfileName` → `{ universalProfile: { lsp3Profile: { name: { value: { _ilike } } } } }` (nested)
 * - `fromProfileName`      → `{ fromProfile: { lsp3Profile: { name: { value: { _ilike } } } } }` (nested)
 * - `fromAssetName`        → `{ fromAsset: { lsp4TokenName: { value: { _ilike } } } }` (nested)
 */
function buildUniversalReceiverEventWhere(
  filter?: UniversalReceiverEventFilter,
): Universal_Receiver_Bool_Exp {
  if (!filter) return {};

  const conditions: Universal_Receiver_Bool_Exp[] = [];

  if (filter.address) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.address)}%` },
    });
  }

  if (filter.from) {
    conditions.push({
      from: { _ilike: `%${escapeLike(filter.from)}%` },
    });
  }

  if (filter.typeId) {
    conditions.push({
      type_id: { _ilike: `%${escapeLike(filter.typeId)}%` },
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

  if (filter.fromProfileName) {
    conditions.push({
      fromProfile: {
        lsp3Profile: {
          name: { value: { _ilike: `%${escapeLike(filter.fromProfileName)}%` } },
        },
      },
    });
  }

  if (filter.fromAssetName) {
    conditions.push({
      fromAsset: {
        lsp4TokenName: {
          value: { _ilike: `%${escapeLike(filter.fromAssetName)}%` },
        },
      },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `UniversalReceiverEventSort` to a Hasura `universal_receiver_order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'newest'`                → `buildBlockOrderSort('desc')` (block_number → transaction_index → log_index desc)
 * - `'oldest'`                → `buildBlockOrderSort('asc')` (block_number → transaction_index → log_index asc)
 * - `'universalProfileName'`  → `[{ universalProfile: { lsp3Profile: { name: { value: dir } } } }]` (nested)
 * - `'fromProfileName'`       → `[{ fromProfile: { lsp3Profile: { name: { value: dir } } } }]` (nested)
 * - `'fromAssetName'`         → `[{ fromAsset: { lsp4TokenName: { value: dir } } }]` (nested)
 *
 * Name sorts default to `nulls: 'last'` when not specified (names without values sort last).
 * `direction` and `nulls` are ignored for `'newest'` and `'oldest'` (self-describing fields).
 */
function buildUniversalReceiverEventOrderBy(
  sort?: UniversalReceiverEventSort,
): Universal_Receiver_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
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
    case 'fromProfileName':
      return [
        {
          fromProfile: {
            lsp3Profile: {
              name: { value: orderDir(sort.direction, sort.nulls ?? 'last') },
            },
          },
        },
      ];
    case 'fromAssetName':
      return [
        {
          fromAsset: {
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
 * Translate a `UniversalReceiverEventInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **2 data field variables:** `includeReceivedData`, `includeReturnedValue` (direct mapping).
 *
 * **3 relation prefix replacements (unique to this domain):**
 * - Receiving UP: `buildProfileIncludeVars` → `includeProfile*` → `includeUniversalProfile*`
 * - Sender UP: `buildProfileIncludeVars` → `includeProfile*` → `includeFromProfile*`
 * - Sender DA: `buildDigitalAssetIncludeVars` → `include*` → `includeFromAsset*`
 *
 * @param include - Optional include config; `undefined` = include everything
 * @returns Record of boolean variables for the GetUniversalReceiverEvents GraphQL document
 */
export function buildUniversalReceiverEventIncludeVars(
  include?: UniversalReceiverEventInclude,
): Record<string, boolean> {
  if (!include) return {};

  const activeUP = hasActiveIncludes(include.universalProfile);
  const activeFromProfile = hasActiveIncludes(include.fromProfile);
  const activeFromAsset = hasActiveIncludes(include.fromAsset);

  const vars: Record<string, boolean> = {
    includeValue: include.value ?? false,
    includeReceivedData: include.receivedData ?? false,
    includeReturnedValue: include.returnedValue ?? false,
    includeBlockNumber: include.blockNumber ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeLogIndex: include.logIndex ?? false,
    includeTransactionIndex: include.transactionIndex ?? false,
    includeUniversalProfile: activeUP,
    includeFromProfile: activeFromProfile,
    includeFromAsset: activeFromAsset,
  };

  // Receiving UP sub-includes: includeProfile* → includeUniversalProfile*
  if (activeUP) {
    const profileVars = buildProfileIncludeVars(include.universalProfile);
    for (const [key, val] of Object.entries(profileVars)) {
      vars[key.replace('includeProfile', 'includeUniversalProfile')] = val;
    }
  }

  // Sender UP sub-includes: includeProfile* → includeFromProfile*
  if (activeFromProfile) {
    const fromProfileVars = buildProfileIncludeVars(include.fromProfile);
    for (const [key, val] of Object.entries(fromProfileVars)) {
      vars[key.replace('includeProfile', 'includeFromProfile')] = val;
    }
  }

  // Sender DA sub-includes: include* → includeFromAsset*
  if (activeFromAsset) {
    const fromAssetVars = buildDigitalAssetIncludeVars(include.fromAsset);
    for (const [key, val] of Object.entries(fromAssetVars)) {
      vars[key.replace('include', 'includeFromAsset')] = val;
    }
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated universal receiver event list queries.
 *
 * When the include parameter is provided, the `universalReceiverEvents` array contains
 * narrowed types with only base fields + included fields.
 */
export interface FetchUniversalReceiverEventsResult<P = UniversalReceiverEvent> {
  /** Parsed universal receiver event records for the current page (narrowed by include) */
  universalReceiverEvents: P[];
  /** Total number of universal receiver event records matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of universal receiver event records with filtering, sorting,
 * total count, and optional include narrowing.
 *
 * Serves both `useUniversalReceiverEvents` (paginated) and `useInfiniteUniversalReceiverEvents`
 * (infinite scroll) — the difference is how the hook manages pagination, not the
 * fetch function.
 *
 * No singular `fetchUniversalReceiverEvent` exists because event records have no natural key
 * (opaque Hasura ID only). Developers query by filter instead.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed universal receiver events (narrowed by include) and total count
 */
export async function fetchUniversalReceiverEvents(
  url: string,
  params?: {
    filter?: UniversalReceiverEventFilter;
    sort?: UniversalReceiverEventSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchUniversalReceiverEventsResult>;
export async function fetchUniversalReceiverEvents<const I extends UniversalReceiverEventInclude>(
  url: string,
  params: {
    filter?: UniversalReceiverEventFilter;
    sort?: UniversalReceiverEventSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchUniversalReceiverEventsResult<UniversalReceiverEventResult<I>>>;
export async function fetchUniversalReceiverEvents(
  url: string,
  params: {
    filter?: UniversalReceiverEventFilter;
    sort?: UniversalReceiverEventSort;
    limit?: number;
    offset?: number;
    include?: UniversalReceiverEventInclude;
  },
): Promise<FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>>;
export async function fetchUniversalReceiverEvents(
  url: string,
  params: {
    filter?: UniversalReceiverEventFilter;
    sort?: UniversalReceiverEventSort;
    limit?: number;
    offset?: number;
    include?: UniversalReceiverEventInclude;
  } = {},
): Promise<FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>> {
  const where = buildUniversalReceiverEventWhere(params.filter);
  const orderBy = buildUniversalReceiverEventOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildUniversalReceiverEventIncludeVars(params.include);

  const result = await execute(url, GetUniversalReceiverEventsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      universalReceiverEvents: parseUniversalReceiverEvents(
        result.universal_receiver,
        params.include,
      ),
      totalCount: result.universal_receiver_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    universalReceiverEvents: parseUniversalReceiverEvents(result.universal_receiver),
    totalCount: result.universal_receiver_aggregate?.aggregate?.count ?? 0,
  };
}
