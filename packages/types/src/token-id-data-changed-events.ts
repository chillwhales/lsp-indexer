import { z } from 'zod';

import { DataKeyNameSchema } from '@chillwhales/erc725';

import { SortDirectionSchema, SortNullsSchema } from './common';
import {
  DigitalAssetIncludeSchema,
  DigitalAssetSchema,
  type DigitalAsset,
  type DigitalAssetInclude,
  type DigitalAssetResult,
} from './digital-assets';
import type { IncludeResult, PartialExcept } from './include-types';
import { NftSchema, type Nft, type NftResult } from './nfts';
import { OwnedTokenNftIncludeSchema, type OwnedTokenNftInclude } from './owned-tokens';

// ---------------------------------------------------------------------------
// Core domain schema
// ---------------------------------------------------------------------------

/**
 * An ERC725Y data change event for a specific token ID from the
 * `token_id_data_changed` Hasura table.
 *
 * Similar to `DataChangedEvent` but includes a `tokenId` field and has an
 * `nft` relation instead of `universalProfile`. Base fields (`address`,
 * `dataKey`, `dataValue`, `tokenId`) are always present; other fields
 * (including `dataKeyName`) are controlled by the `include` parameter.
 *
 * The `nft` field uses the full `Nft` type from the nfts domain (same as
 * owned-tokens), with per-field include control via `OwnedTokenNftInclude`
 * (NftInclude minus collection/holder — those aren't sub-relations here).
 */
export const TokenIdDataChangedEventSchema = z.object({
  /** Emitting contract address (always present) */
  address: z.string(),
  /** Raw hex ERC725Y data key (always present) */
  dataKey: z.string(),
  /** Raw hex data value (always present, no decoding) */
  dataValue: z.string(),
  /** Token ID the data change applies to (always present) */
  tokenId: z.string(),
  /** Resolved human-readable name for known ERC725Y keys, null if unknown (null = not included or key unknown) */
  dataKeyName: z.string().nullable(),
  /** Block number where event was emitted (null = not included) */
  blockNumber: z.number().nullable(),
  /** Timestamp when event was indexed (null = not included) */
  timestamp: z.string().nullable(),
  /** Log index within the transaction (null = not included) */
  logIndex: z.number().nullable(),
  /** Transaction index within the block (null = not included) */
  transactionIndex: z.number().nullable(),
  /** Digital Asset of the emitting address (null = not included) */
  digitalAsset: DigitalAssetSchema.nullable(),
  /** Full NFT details for the token (null = not included or no NFT record) */
  nft: NftSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema — 10 filter fields (10 keys, 2 use range pairs)
// ---------------------------------------------------------------------------

/**
 * Filter for token ID data changed event queries.
 *
 * All 10 filter fields — string fields use `_ilike` (case-insensitive),
 * timestamp and blockNumber fields use `_gte` / `_lte` for range filtering.
 * `dataKeyName` is resolved to a hex data key at the service layer.
 */
export const TokenIdDataChangedEventFilterSchema = z.object({
  /** Case-insensitive match on emitting contract address (uses _ilike) */
  address: z.string().optional(),
  /** Case-insensitive match on data key hex (uses _ilike) */
  dataKey: z.string().optional(),
  /** Known ERC725Y key name (e.g., 'LSP4Metadata') — resolved to hex at service layer */
  dataKeyName: DataKeyNameSchema.optional(),
  /** Case-insensitive match on token ID (uses _ilike) */
  tokenId: z.string().optional(),
  /** Timestamp lower bound (inclusive, _gte) */
  timestampFrom: z.union([z.string(), z.number()]).optional(),
  /** Timestamp upper bound (inclusive, _lte) */
  timestampTo: z.union([z.string(), z.number()]).optional(),
  /** Block number lower bound (inclusive, _gte) */
  blockNumberFrom: z.number().optional(),
  /** Block number upper bound (inclusive, _lte) */
  blockNumberTo: z.number().optional(),
  /** Case-insensitive search on DA name (nested: digitalAsset.lsp4TokenName.value._ilike) */
  digitalAssetName: z.string().optional(),
  /** Case-insensitive NFT name filter (nested through nft relation) */
  nftName: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Sort schema — 4 sort fields
// ---------------------------------------------------------------------------

/**
 * Fields available for sorting token ID data changed event lists.
 *
 * `newest` and `oldest` use deterministic block-order sorting
 * (block_number → transaction_index → log_index). `direction` and `nulls`
 * are ignored when these fields are selected.
 *
 * `digitalAssetName` is a nested sort via `digitalAsset.lsp4TokenName`.
 * `nftName` is a nested sort via `nft.lsp4Metadata.name`.
 * Both handled at service layer.
 */
export const TokenIdDataChangedEventSortFieldSchema = z.enum([
  'newest',
  'oldest',
  'digitalAssetName',
  'nftName',
]);

/** Zod schema for token ID data changed event sort configuration — validates field, direction, and null ordering. */
export const TokenIdDataChangedEventSortSchema = z.object({
  /** Which field to sort by */
  field: TokenIdDataChangedEventSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema (inverted default — omit = fetch everything)
// ---------------------------------------------------------------------------

/**
 * Controls which optional fields are fetched for token ID data changed event queries.
 *
 * **Inverted default:** When `include` is omitted, ALL fields are fetched
 * (opt-out rather than opt-in). When `include` is provided, only fields
 * set to `true` (or provided as sub-include objects) are included.
 *
 * **Relation sub-includes:** Both `digitalAsset` and `nft` accept sub-include
 * objects for per-field control. `nft` uses `OwnedTokenNftInclude` (NftInclude
 * minus collection/holder — those aren't sub-relations in the event context).
 */
export const TokenIdDataChangedEventIncludeSchema = z.object({
  /** Include resolved human-readable data key name (parser-derived from dataKey) */
  dataKeyName: z.boolean().optional(),
  /** Include block number */
  blockNumber: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include log index */
  logIndex: z.boolean().optional(),
  /** Include transaction index */
  transactionIndex: z.boolean().optional(),
  /** Include Digital Asset — `true` for all fields, or object for per-field control */
  digitalAsset: z.union([z.boolean(), DigitalAssetIncludeSchema]).optional(),
  /** Include NFT — `true` for all fields, or object for per-field control (8 metadata fields) */
  nft: z.union([z.boolean(), OwnedTokenNftIncludeSchema]).optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas — 3 hooks (latest single + paginated list + infinite)
// ---------------------------------------------------------------------------

/**
 * Params for useLatestTokenIdDataChangedEvent — fetch the most recent
 * TokenIdDataChanged event for a given address + tokenId + data key combination.
 *
 * Internally sorts by timestamp descending and returns the first result.
 * The `dataKey` can be provided as a raw hex string OR the `dataKeyName` filter
 * can be used with a human-readable name (e.g., 'LSP4Metadata') — the service
 * layer resolves it to hex automatically.
 */
export const UseLatestTokenIdDataChangedEventParamsSchema = z.object({
  filter: TokenIdDataChangedEventFilterSchema.optional(),
  include: TokenIdDataChangedEventIncludeSchema.optional(),
});

/** Params for useTokenIdDataChangedEvents — paginated list of token ID data changed events */
export const UseTokenIdDataChangedEventsParamsSchema = z.object({
  filter: TokenIdDataChangedEventFilterSchema.optional(),
  sort: TokenIdDataChangedEventSortSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: TokenIdDataChangedEventIncludeSchema.optional(),
});

/** Params for useInfiniteTokenIdDataChangedEvents — infinite scroll variant */
export const UseInfiniteTokenIdDataChangedEventsParamsSchema = z.object({
  filter: TokenIdDataChangedEventFilterSchema.optional(),
  sort: TokenIdDataChangedEventSortSchema.optional(),
  pageSize: z.number().optional(),
  include: TokenIdDataChangedEventIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

/** Clean camelCase token ID data changed event after parsing from Hasura. See {@link TokenIdDataChangedEventSchema}. */
export type TokenIdDataChangedEvent = z.infer<typeof TokenIdDataChangedEventSchema>;
/** Token ID data changed event query filter parameters. See {@link TokenIdDataChangedEventFilterSchema}. */
export type TokenIdDataChangedEventFilter = z.infer<typeof TokenIdDataChangedEventFilterSchema>;
/** Available fields for sorting token ID data changed events. See {@link TokenIdDataChangedEventSortFieldSchema}. */
export type TokenIdDataChangedEventSortField = z.infer<
  typeof TokenIdDataChangedEventSortFieldSchema
>;
/** Token ID data changed event sort configuration. See {@link TokenIdDataChangedEventSortSchema}. */
export type TokenIdDataChangedEventSort = z.infer<typeof TokenIdDataChangedEventSortSchema>;
/** Field inclusion config for token ID data changed event queries. See {@link TokenIdDataChangedEventIncludeSchema}. */
export type TokenIdDataChangedEventInclude = z.infer<typeof TokenIdDataChangedEventIncludeSchema>;
/** Parameters for the `useLatestTokenIdDataChangedEvent` hook. See {@link UseLatestTokenIdDataChangedEventParamsSchema}. */
export type UseLatestTokenIdDataChangedEventParams = z.infer<
  typeof UseLatestTokenIdDataChangedEventParamsSchema
>;
/** Parameters for the `useTokenIdDataChangedEvents` hook. See {@link UseTokenIdDataChangedEventsParamsSchema}. */
export type UseTokenIdDataChangedEventsParams = z.infer<
  typeof UseTokenIdDataChangedEventsParamsSchema
>;
/** Parameters for the `useInfiniteTokenIdDataChangedEvents` hook. See {@link UseInfiniteTokenIdDataChangedEventsParamsSchema}. */
export type UseInfiniteTokenIdDataChangedEventsParams = z.infer<
  typeof UseInfiniteTokenIdDataChangedEventsParamsSchema
>;

// ---------------------------------------------------------------------------
// Conditional include result type (DX-04)
// ---------------------------------------------------------------------------

/**
 * Scalar include fields: include schema key → TokenIdDataChangedEvent field name.
 * Relations (digitalAsset, nft) handled by resolver types.
 */
type TokenIdDataChangedEventScalarIncludeFieldMap = {
  dataKeyName: 'dataKeyName';
  blockNumber: 'blockNumber';
  timestamp: 'timestamp';
  logIndex: 'logIndex';
  transactionIndex: 'transactionIndex';
};

/**
 * Resolve nested `digitalAsset` relation based on include parameter.
 * When include has `digitalAsset` as a DigitalAssetInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveTokenIdDataChangedEventDA<I> = I extends { digitalAsset: infer D }
  ? D extends true
    ? { digitalAsset: DigitalAsset | null }
    : D extends DigitalAssetInclude
      ? { digitalAsset: DigitalAssetResult<D> | null }
      : {}
  : {};

/**
 * Resolve nested `nft` relation based on include parameter.
 * When `nft: true`, the full Nft type is present.
 * When `nft` is an OwnedTokenNftInclude object, the Nft type is narrowed by sub-include.
 */
type ResolveTokenIdDataChangedEventNft<I> = I extends { nft: infer N }
  ? N extends true
    ? { nft: Nft | null }
    : N extends OwnedTokenNftInclude
      ? { nft: NftResult<N> | null }
      : {}
  : {};

/**
 * TokenIdDataChangedEvent type narrowed by include parameter.
 *
 * - `TokenIdDataChangedEventResult` (no generic) → full `TokenIdDataChangedEvent` type (backward compatible)
 * - `TokenIdDataChangedEventResult<{}>` → `{ address; dataKey; dataValue; tokenId }` (base fields only)
 * - `TokenIdDataChangedEventResult<{ dataKeyName: true }>` → base + dataKeyName
 * - `TokenIdDataChangedEventResult<{ timestamp: true }>` → base + timestamp
 * - `TokenIdDataChangedEventResult<{ digitalAsset: { name: true } }>` → base + narrowed DA
 * - `TokenIdDataChangedEventResult<{ nft: true }>` → base + full NFT
 * - `TokenIdDataChangedEventResult<{ nft: { name: true } }>` → base + narrowed NFT
 *
 * @example
 * ```ts
 * type Full = TokenIdDataChangedEventResult;                                                  // = TokenIdDataChangedEvent (all fields)
 * type Minimal = TokenIdDataChangedEventResult<{}>;                                           // = { address; dataKey; dataValue; tokenId }
 * type WithName = TokenIdDataChangedEventResult<{ dataKeyName: true }>;                       // = base + dataKeyName
 * type WithTime = TokenIdDataChangedEventResult<{ timestamp: true }>;                         // = base + timestamp
 * type WithDA = TokenIdDataChangedEventResult<{ digitalAsset: { name: true } }>;              // = base + narrowed DA
 * type WithNft = TokenIdDataChangedEventResult<{ nft: true }>;                                // = base + full NFT
 * type WithNarrowNft = TokenIdDataChangedEventResult<{ nft: { name: true } }>;                // = base + { nft: { address; tokenId; isBurned; isMinted; name } }
 * ```
 */
export type TokenIdDataChangedEventResult<
  I extends TokenIdDataChangedEventInclude | undefined = undefined,
> = I extends undefined
  ? TokenIdDataChangedEvent
  : IncludeResult<
      TokenIdDataChangedEvent,
      'address' | 'dataKey' | 'dataValue' | 'tokenId',
      TokenIdDataChangedEventScalarIncludeFieldMap,
      I
    > &
      ResolveTokenIdDataChangedEventDA<NonNullable<I>> &
      ResolveTokenIdDataChangedEventNft<NonNullable<I>>;

/**
 * TokenIdDataChangedEvent with only base fields guaranteed — used for components
 * that accept any include-narrowed TokenIdDataChangedEvent.
 */
export type PartialTokenIdDataChangedEvent = PartialExcept<
  TokenIdDataChangedEvent,
  'address' | 'dataKey' | 'dataValue' | 'tokenId'
>;
