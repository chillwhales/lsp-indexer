import { resolveTypeIdHex } from '@chillwhales/lsp1';
import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventFilter,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
  UniversalReceiverEventSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  GetUniversalReceiverEventsDocument,
  UniversalReceiverEventSubscriptionDocument,
} from '../documents/universal-receiver-events';
import type {
  UniversalReceiverEventSubscriptionSubscription,
  Universal_Receiver_Bool_Exp,
  Universal_Receiver_Order_By,
} from '../graphql/graphql';
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

/** Translate UniversalReceiverEventFilter to a Hasura _bool_exp. */
export function buildUniversalReceiverEventWhere(
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

  if (filter.typeIdName) {
    const hex = resolveTypeIdHex(filter.typeIdName);
    if (hex) {
      // Type IDs are always full 32-byte keccak256 hashes — exact match (case-insensitive)
      conditions.push({
        type_id: { _ilike: hex },
      });
    }
    // Unknown names are silently ignored — typeIdName only accepts known LSP1 type ID names
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

/** Translate UniversalReceiverEventSort to a Hasura order_by. */
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

/** Build @include directive variables from include config. */
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

export interface FetchUniversalReceiverEventsResult<P = UniversalReceiverEvent> {
  /** Parsed universal receiver event records for the current page (narrowed by include) */
  universalReceiverEvents: P[];
  /** Total number of universal receiver event records matching the filter (for pagination UI) */
  totalCount: number;
}

/** Fetch a paginated list of universal receiver event records. No singular `fetchUniversalReceiverEvent` — event records have no natural key
 * (opaque Hasura ID only). */
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

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

/**
 * Raw subscription row type — extracted from the codegen subscription result.
 */
type RawUniversalReceiverEventSubscriptionRow =
  UniversalReceiverEventSubscriptionSubscription['universal_receiver'][number];

/** Build subscription config for useSubscription. */
export function buildUniversalReceiverEventSubscriptionConfig(params: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  include?: UniversalReceiverEventInclude;
}) {
  const where = buildUniversalReceiverEventWhere(params.filter);
  const orderBy = buildUniversalReceiverEventOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildUniversalReceiverEventIncludeVars(params.include);

  return {
    document: UniversalReceiverEventSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: UniversalReceiverEventSubscriptionSubscription) => result.universal_receiver,
    parser: (raw: RawUniversalReceiverEventSubscriptionRow[]) =>
      params.include
        ? parseUniversalReceiverEvents(raw, params.include)
        : parseUniversalReceiverEvents(raw),
  };
}
