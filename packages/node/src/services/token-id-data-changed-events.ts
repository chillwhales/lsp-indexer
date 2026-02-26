import { resolveDataKeyHex } from '@lsp-indexer/data-keys';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  TokenIdDataChangedEventSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetTokenIdDataChangedEventsDocument } from '../documents/token-id-data-changed-events';
import type {
  Token_Id_Data_Changed_Bool_Exp,
  Token_Id_Data_Changed_Order_By,
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

/**
 * Translate a flat `TokenIdDataChangedEventFilter` to a Hasura
 * `token_id_data_changed_bool_exp`.
 *
 * All 10 filter fields — string fields use
 * `_ilike` + `escapeLike` for case-insensitive matching, timestamp and
 * blockNumber fields use `_gte` / `_lte`.
 *
 * Multiple conditions combine with `_and`. Empty filter = empty object.
 *
 * Filter → Hasura mapping:
 * - `address`         → `{ address: { _ilike: '%escapeLike%' } }`
 * - `dataKey`         → `{ data_key: { _ilike: '%escapeLike%' } }`
 * - `dataKeyName`     → resolved to hex via `resolveDataKeyHex`; full keys use exact match, prefix keys use `hex%` wildcard
 * - `tokenId`         → `{ token_id: { _ilike: '%escapeLike%' } }`
 * - `timestampFrom`   → `{ timestamp: { _gte: normalizeTimestamp } }`
 * - `timestampTo`     → `{ timestamp: { _lte: normalizeTimestamp } }`
 * - `blockNumberFrom` → `{ block_number: { _gte: value } }` (Int comparison)
 * - `blockNumberTo`   → `{ block_number: { _lte: value } }`
 * - `digitalAssetName` → `{ digitalAsset: { lsp4TokenName: { value: { _ilike } } } }` (nested)
 * - `nftName`         → `{ nft: { _or: [lsp4Metadata.name, lsp4MetadataBaseUri.name] } }` (nested, dual source)
 */
function buildTokenIdDataChangedEventWhere(
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
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `TokenIdDataChangedEventSort` to a Hasura
 * `token_id_data_changed_order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'newest'`           → `buildBlockOrderSort('desc')` (block_number → transaction_index → log_index desc)
 * - `'oldest'`           → `buildBlockOrderSort('asc')` (block_number → transaction_index → log_index asc)
 * - `'digitalAssetName'` → `[{ digitalAsset: { lsp4TokenName: { value: dir } } }]` (nested)
 * - `'nftName'`          → `[{ nft: { lsp4Metadata: { name: { value: dir } } } }]` (nested)
 *
 * Name sorts default to `nulls: 'last'` when not specified (names without values sort last).
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 * `direction` and `nulls` are ignored for `'newest'` and `'oldest'` (self-describing fields).
 */
function buildTokenIdDataChangedEventOrderBy(
  sort?: TokenIdDataChangedEventSort,
): Token_Id_Data_Changed_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

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
      ];
    default:
      return undefined;
  }
}

/**
 * Translate a `TokenIdDataChangedEventInclude` to GraphQL boolean variables
 * for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **Digital asset sub-includes:** Reuses `buildDigitalAssetIncludeVars` with prefix replacement:
 * - `include*` → `includeDigitalAsset*` for digital asset sub-includes
 *
 * **NFT sub-includes:** Reuses `buildNftIncludeVars` for per-field NFT include control.
 * Same pattern as owned-tokens — 8 NFT metadata fields with individual `@include` toggles.
 *
 * @param include - Optional include config; `undefined` = include everything
 * @returns Record of boolean variables for the GetTokenIdDataChangedEvents GraphQL document
 */
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

/**
 * Result shape for paginated token ID data changed event list queries.
 *
 * When the include parameter is provided, the `tokenIdDataChangedEvents` array
 * contains narrowed types with only base fields + included fields.
 */
export interface FetchTokenIdDataChangedEventsResult<P = TokenIdDataChangedEvent> {
  /** Parsed token ID data changed event records for the current page (narrowed by include) */
  tokenIdDataChangedEvents: P[];
  /** Total number of token ID data changed event records matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of ERC725Y per-token data changed event records with filtering,
 * sorting, total count, and optional include narrowing.
 *
 * Serves both `useTokenIdDataChangedEvents` (paginated) and
 * `useInfiniteTokenIdDataChangedEvents` (infinite scroll) — the difference is how
 * the hook manages pagination, not the fetch function.
 *
 * No singular `fetchTokenIdDataChangedEvent` exists because event records have no
 * natural key (opaque Hasura ID only). Developers query by filter instead.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed token ID data changed events (narrowed by include) and total count
 */
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

/**
 * Fetch the most recent TokenIdDataChanged event matching the given filter.
 *
 * Internally queries with `limit: 1` sorted by `timestamp desc` to return
 * the latest event for a given address + tokenId + data key combination.
 *
 * The `dataKeyName` filter field accepts human-readable ERC725Y key names
 * (e.g., 'LSP4Metadata') — the service layer resolves them to hex automatically.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter + optional include)
 * @returns The latest matching event (narrowed by include), or `null` if none found
 */
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
