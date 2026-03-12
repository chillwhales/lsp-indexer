import { resolveDataKeyHex } from '@chillwhales/erc725';
import type {
  DataChangedEvent,
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventResult,
  DataChangedEventSort,
  PartialDataChangedEvent,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  DataChangedEventSubscriptionDocument,
  GetDataChangedEventsDocument,
} from '../documents/data-changed-events';
import type {
  Data_Changed_Bool_Exp,
  Data_Changed_Order_By,
  DataChangedEventSubscriptionSubscription,
} from '../graphql/graphql';
import { parseDataChangedEvents } from '../parsers/data-changed-events';
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

/** Translate DataChangedEventFilter to a Hasura _bool_exp. */
export function buildDataChangedEventWhere(filter?: DataChangedEventFilter): Data_Changed_Bool_Exp {
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
      // Full 32-byte keys (66 chars with 0x prefix) use exact match;
      // shorter keys are prefixes (e.g., AddressPermissionsPrefix, LSP10VaultsMap,
      // array index keys) and need wildcard suffix for prefix matching
      const isPrefix = hex.length < 66;
      conditions.push({
        data_key: { _ilike: isPrefix ? `${hex}%` : hex },
      });
    }
    // Unknown names are silently ignored — dataKeyName only accepts known ERC725Y key names
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
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}

/** Translate DataChangedEventSort to a Hasura order_by. */
export function buildDataChangedEventOrderBy(
  sort?: DataChangedEventSort,
): Data_Changed_Order_By[] | undefined {
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
        ...buildBlockOrderSort('desc'),
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
        ...buildBlockOrderSort('desc'),
      ];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
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

export interface FetchDataChangedEventsResult<P = DataChangedEvent> {
  dataChangedEvents: P[];
  totalCount: number;
}

/** Fetch a paginated list of ERC725Y data changed event records. */
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
  const orderBy = buildDataChangedEventOrderBy(params.sort) ?? buildBlockOrderSort('desc');
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

/** Fetch the most recent DataChanged event for a given data key. */
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
        sort: { field: 'newest', direction: 'desc' },
        limit: 1,
        include: params.include,
      })
    : await fetchDataChangedEvents(url, {
        filter: params.filter,
        sort: { field: 'newest', direction: 'desc' },
        limit: 1,
      });

  return result.dataChangedEvents[0] ?? null;
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

/** Raw subscription row type extracted from codegen. */
type RawDataChangedEventSubscriptionRow =
  DataChangedEventSubscriptionSubscription['data_changed'][number];

/** Build subscription config for useSubscription. */
export function buildDataChangedEventSubscriptionConfig(params: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  include?: DataChangedEventInclude;
}) {
  const where = buildDataChangedEventWhere(params.filter);
  const orderBy = buildDataChangedEventOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildDataChangedEventIncludeVars(params.include);

  return {
    document: DataChangedEventSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: DataChangedEventSubscriptionSubscription) => result.data_changed,
    parser: (raw: RawDataChangedEventSubscriptionRow[]) =>
      params.include ? parseDataChangedEvents(raw, params.include) : parseDataChangedEvents(raw),
  };
}
