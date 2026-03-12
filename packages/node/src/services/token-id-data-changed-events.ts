import { resolveDataKeyHex } from '@chillwhales/erc725';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  TokenIdDataChangedEventSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  GetTokenIdDataChangedEventsDocument,
  TokenIdDataChangedEventSubscriptionDocument,
} from '../documents/token-id-data-changed-events';
import type {
  Token_Id_Data_Changed_Bool_Exp,
  Token_Id_Data_Changed_Order_By,
  TokenIdDataChangedEventSubscriptionSubscription,
} from '../graphql/graphql';
import { parseTokenIdDataChangedEvents } from '../parsers/token-id-data-changed-events';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildNftIncludeVars } from './nfts';
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

/** Translate TokenIdDataChangedEventFilter to a Hasura _bool_exp. */
export function buildTokenIdDataChangedEventWhere(
  filter?: TokenIdDataChangedEventFilter,
): Token_Id_Data_Changed_Bool_Exp {
  if (!filter) return {};

  const conditions: Token_Id_Data_Changed_Bool_Exp[] = [];

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

  if (filter.tokenId) {
    conditions.push({
      token_id: { _ilike: `%${escapeLike(filter.tokenId)}%` },
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

  if (filter.digitalAssetName) {
    conditions.push({
      digitalAsset: {
        lsp4TokenName: {
          value: { _ilike: `%${escapeLike(filter.digitalAssetName)}%` },
        },
      },
    });
  }

  if (filter.nftName) {
    // NFT name searches both lsp4Metadata and lsp4MetadataBaseUri using _or,
    // matching the established NFT name filter pattern from the nfts service.
    const namePattern = `%${escapeLike(filter.nftName)}%`;
    conditions.push({
      nft: {
        _or: [
          { lsp4Metadata: { name: { value: { _ilike: namePattern } } } },
          { lsp4MetadataBaseUri: { name: { value: { _ilike: namePattern } } } },
        ],
      },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}

/** Translate TokenIdDataChangedEventSort to a Hasura order_by. */
export function buildTokenIdDataChangedEventOrderBy(
  sort?: TokenIdDataChangedEventSort,
): Token_Id_Data_Changed_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
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
    case 'nftName':
      return [
        {
          nft: {
            lsp4Metadata: {
              name: { value: orderDir(sort.direction, sort.nulls ?? 'last') },
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
export function buildTokenIdDataChangedEventIncludeVars(
  include?: TokenIdDataChangedEventInclude,
): Record<string, boolean> {
  if (!include) return {};

  const activeDA = hasActiveIncludes(include.digitalAsset);
  const activeNft = hasActiveIncludes(include.nft);

  const vars: Record<string, boolean> = {
    includeBlockNumber: include.blockNumber ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeLogIndex: include.logIndex ?? false,
    includeTransactionIndex: include.transactionIndex ?? false,
    includeDigitalAsset: activeDA,
    includeNft: activeNft,
  };

  // DA sub-includes: reuse DA include builder with "DigitalAsset" prefix
  if (activeDA) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    for (const [key, val] of Object.entries(daVars)) {
      vars[key.replace('include', 'includeDigitalAsset')] = val;
    }
  }

  // NFT sub-includes: reuse NFT include builder with includeNft* prefix
  if (activeNft) {
    const nftVars = buildNftIncludeVars(include.nft);
    Object.assign(vars, nftVars);
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

export interface FetchTokenIdDataChangedEventsResult<P = TokenIdDataChangedEvent> {
  tokenIdDataChangedEvents: P[];
  totalCount: number;
}

/** Fetch a paginated list of ERC725Y per-token data changed event records. */
export async function fetchTokenIdDataChangedEvents(
  url: string,
  params?: {
    filter?: TokenIdDataChangedEventFilter;
    sort?: TokenIdDataChangedEventSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchTokenIdDataChangedEventsResult>;
export async function fetchTokenIdDataChangedEvents<const I extends TokenIdDataChangedEventInclude>(
  url: string,
  params: {
    filter?: TokenIdDataChangedEventFilter;
    sort?: TokenIdDataChangedEventSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchTokenIdDataChangedEventsResult<TokenIdDataChangedEventResult<I>>>;
export async function fetchTokenIdDataChangedEvents(
  url: string,
  params: {
    filter?: TokenIdDataChangedEventFilter;
    sort?: TokenIdDataChangedEventSort;
    limit?: number;
    offset?: number;
    include?: TokenIdDataChangedEventInclude;
  },
): Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>>;
export async function fetchTokenIdDataChangedEvents(
  url: string,
  params: {
    filter?: TokenIdDataChangedEventFilter;
    sort?: TokenIdDataChangedEventSort;
    limit?: number;
    offset?: number;
    include?: TokenIdDataChangedEventInclude;
  } = {},
): Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>> {
  const where = buildTokenIdDataChangedEventWhere(params.filter);
  const orderBy = buildTokenIdDataChangedEventOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildTokenIdDataChangedEventIncludeVars(params.include);

  const result = await execute(url, GetTokenIdDataChangedEventsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      tokenIdDataChangedEvents: parseTokenIdDataChangedEvents(
        result.token_id_data_changed,
        params.include,
      ),
      totalCount: result.token_id_data_changed_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    tokenIdDataChangedEvents: parseTokenIdDataChangedEvents(result.token_id_data_changed),
    totalCount: result.token_id_data_changed_aggregate?.aggregate?.count ?? 0,
  };
}

/** Fetch the most recent TokenIdDataChanged event matching the given filter. */
export async function fetchLatestTokenIdDataChangedEvent(
  url: string,
  params?: { filter?: TokenIdDataChangedEventFilter },
): Promise<TokenIdDataChangedEvent | null>;
export async function fetchLatestTokenIdDataChangedEvent<
  const I extends TokenIdDataChangedEventInclude,
>(
  url: string,
  params: { filter?: TokenIdDataChangedEventFilter; include: I },
): Promise<TokenIdDataChangedEventResult<I> | null>;
export async function fetchLatestTokenIdDataChangedEvent(
  url: string,
  params: { filter?: TokenIdDataChangedEventFilter; include?: TokenIdDataChangedEventInclude },
): Promise<PartialTokenIdDataChangedEvent | null>;
export async function fetchLatestTokenIdDataChangedEvent(
  url: string,
  params: { filter?: TokenIdDataChangedEventFilter; include?: TokenIdDataChangedEventInclude } = {},
): Promise<PartialTokenIdDataChangedEvent | null> {
  const result = params.include
    ? await fetchTokenIdDataChangedEvents(url, {
        filter: params.filter,
        sort: { field: 'newest', direction: 'desc' },
        limit: 1,
        include: params.include,
      })
    : await fetchTokenIdDataChangedEvents(url, {
        filter: params.filter,
        sort: { field: 'newest', direction: 'desc' },
        limit: 1,
      });

  return result.tokenIdDataChangedEvents[0] ?? null;
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

/** Raw subscription row type extracted from codegen. */
type RawTokenIdDataChangedEventSubscriptionRow =
  TokenIdDataChangedEventSubscriptionSubscription['token_id_data_changed'][number];

/** Build subscription config for useSubscription. */
export function buildTokenIdDataChangedEventSubscriptionConfig(params: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  include?: TokenIdDataChangedEventInclude;
}) {
  const where = buildTokenIdDataChangedEventWhere(params.filter);
  const orderBy = buildTokenIdDataChangedEventOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildTokenIdDataChangedEventIncludeVars(params.include);

  return {
    document: TokenIdDataChangedEventSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: TokenIdDataChangedEventSubscriptionSubscription) =>
      result.token_id_data_changed,
    parser: (raw: RawTokenIdDataChangedEventSubscriptionRow[]) =>
      params.include
        ? parseTokenIdDataChangedEvents(raw, params.include)
        : parseTokenIdDataChangedEvents(raw),
  };
}
