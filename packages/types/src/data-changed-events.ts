import { z } from 'zod';

import { SortDirectionSchema, SortNullsSchema } from './common';
import {
  DigitalAssetIncludeSchema,
  DigitalAssetSchema,
  type DigitalAsset,
  type DigitalAssetInclude,
  type DigitalAssetResult,
} from './digital-assets';
import type { IncludeResult, PartialExcept } from './include-types';
import {
  ProfileIncludeSchema,
  ProfileSchema,
  type Profile,
  type ProfileInclude,
  type ProfileResult,
} from './profiles';

// ---------------------------------------------------------------------------
// Core domain schema
// ---------------------------------------------------------------------------

/**
 * An ERC725Y data change event from the `data_changed` Hasura table.
 *
 * Represents a single `DataChanged` event emitted by a Universal Profile or
 * Digital Asset contract. Base fields (`address`, `dataKey`, `dataValue`,
 * `dataKeyName`) are always present; other fields are controlled by the
 * `include` parameter.
 */
export const DataChangedEventSchema = z.object({
  /** Emitting contract address — either a UP or DA (always present) */
  address: z.string(),
  /** Raw hex ERC725Y data key (always present) */
  dataKey: z.string(),
  /** Raw hex data value (always present, no decoding) */
  dataValue: z.string(),
  /** Resolved human-readable name for known ERC725Y keys, null if unknown (always present) */
  dataKeyName: z.string().nullable(),
  /** Block number where event was emitted (null = not included) */
  blockNumber: z.number().nullable(),
  /** Timestamp when event was indexed (null = not included) */
  timestamp: z.string().nullable(),
  /** Log index within the transaction (null = not included) */
  logIndex: z.number().nullable(),
  /** Transaction index within the block (null = not included) */
  transactionIndex: z.number().nullable(),
  /** Universal Profile of the emitting address (null = not included or address is a DA) */
  universalProfile: ProfileSchema.nullable(),
  /** Digital Asset of the emitting address (null = not included or address is a UP) */
  digitalAsset: DigitalAssetSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema — 8 filter fields (8 keys, 2 use range pairs)
// ---------------------------------------------------------------------------

/**
 * Filter for data changed event queries.
 *
 * All 9 filter fields — string fields use `_ilike` (case-insensitive),
 * timestamp and blockNumber fields use `_gte` / `_lte` for range filtering.
 * `dataKeyName` is resolved to a hex data key at the service layer.
 */
export const DataChangedEventFilterSchema = z.object({
  /** Case-insensitive match on emitting contract address (uses _ilike) */
  address: z.string().optional(),
  /** Case-insensitive match on data key hex (uses _ilike) */
  dataKey: z.string().optional(),
  /** Human-readable ERC725Y key name (e.g., 'LSP3Profile') — resolved to hex at service layer */
  dataKeyName: z.string().optional(),
  /** Timestamp lower bound (inclusive, _gte) */
  timestampFrom: z.union([z.string(), z.number()]).optional(),
  /** Timestamp upper bound (inclusive, _lte) */
  timestampTo: z.union([z.string(), z.number()]).optional(),
  /** Block number lower bound (inclusive, _gte) */
  blockNumberFrom: z.number().optional(),
  /** Block number upper bound (inclusive, _lte) */
  blockNumberTo: z.number().optional(),
  /** Case-insensitive search on UP name (nested: universalProfile.lsp3Profile.name.value._ilike) */
  universalProfileName: z.string().optional(),
  /** Case-insensitive search on DA name (nested: digitalAsset.lsp4TokenName.value._ilike) */
  digitalAssetName: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Sort schema — 4 sort fields
// ---------------------------------------------------------------------------

/**
 * Fields available for sorting data changed event lists.
 *
 * `universalProfileName` is a nested sort via `universalProfile.lsp3Profile.name`.
 * `digitalAssetName` is a nested sort via `digitalAsset.lsp4TokenName`.
 * Both handled at service layer.
 */
export const DataChangedEventSortFieldSchema = z.enum([
  'timestamp',
  'blockNumber',
  'universalProfileName',
  'digitalAssetName',
]);

export const DataChangedEventSortSchema = z.object({
  /** Which field to sort by */
  field: DataChangedEventSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema (inverted default — omit = fetch everything)
// ---------------------------------------------------------------------------

/**
 * Controls which optional fields are fetched for data changed event queries.
 *
 * **Inverted default:** When `include` is omitted, ALL fields are fetched
 * (opt-out rather than opt-in). When `include` is provided, only fields
 * set to `true` (or provided as sub-include objects) are included.
 *
 * **Relation sub-includes:** `universalProfile` and `digitalAsset` accept
 * sub-include objects for full control over which nested fields to fetch.
 */
export const DataChangedEventIncludeSchema = z.object({
  /** Include block number */
  blockNumber: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include log index */
  logIndex: z.boolean().optional(),
  /** Include transaction index */
  transactionIndex: z.boolean().optional(),
  /** Include Universal Profile — `true` for all fields, or object for per-field control */
  universalProfile: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
  /** Include Digital Asset — `true` for all fields, or object for per-field control */
  digitalAsset: z.union([z.boolean(), DigitalAssetIncludeSchema]).optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas — 3 hooks (latest single + paginated list + infinite)
// ---------------------------------------------------------------------------

/**
 * Params for useLatestDataChangedEvent — fetch the most recent DataChanged event
 * for a given address + data key combination.
 *
 * Internally sorts by timestamp descending and returns the first result.
 * The `dataKey` can be provided as a raw hex string OR the `dataKeyName` filter
 * can be used with a human-readable name (e.g., 'LSP3Profile') — the service
 * layer resolves it to hex automatically.
 */
export const UseLatestDataChangedEventParamsSchema = z.object({
  filter: DataChangedEventFilterSchema.optional(),
  include: DataChangedEventIncludeSchema.optional(),
});

/** Params for useDataChangedEvents — paginated list of data changed events */
export const UseDataChangedEventsParamsSchema = z.object({
  filter: DataChangedEventFilterSchema.optional(),
  sort: DataChangedEventSortSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: DataChangedEventIncludeSchema.optional(),
});

/** Params for useInfiniteDataChangedEvents — infinite scroll variant */
export const UseInfiniteDataChangedEventsParamsSchema = z.object({
  filter: DataChangedEventFilterSchema.optional(),
  sort: DataChangedEventSortSchema.optional(),
  pageSize: z.number().optional(),
  include: DataChangedEventIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type DataChangedEvent = z.infer<typeof DataChangedEventSchema>;
export type DataChangedEventFilter = z.infer<typeof DataChangedEventFilterSchema>;
export type DataChangedEventSortField = z.infer<typeof DataChangedEventSortFieldSchema>;
export type DataChangedEventSort = z.infer<typeof DataChangedEventSortSchema>;
export type DataChangedEventInclude = z.infer<typeof DataChangedEventIncludeSchema>;
export type UseLatestDataChangedEventParams = z.infer<typeof UseLatestDataChangedEventParamsSchema>;
export type UseDataChangedEventsParams = z.infer<typeof UseDataChangedEventsParamsSchema>;
export type UseInfiniteDataChangedEventsParams = z.infer<
  typeof UseInfiniteDataChangedEventsParamsSchema
>;

// ---------------------------------------------------------------------------
// Conditional include result type (DX-04)
// ---------------------------------------------------------------------------

/**
 * Scalar include fields: include schema key → DataChangedEvent field name.
 * Relations (universalProfile, digitalAsset) handled by resolver types.
 */
type DataChangedEventScalarIncludeFieldMap = {
  blockNumber: 'blockNumber';
  timestamp: 'timestamp';
  logIndex: 'logIndex';
  transactionIndex: 'transactionIndex';
};

/**
 * Resolve nested `universalProfile` relation based on include parameter.
 * When include has `universalProfile` as a ProfileInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveDataChangedEventUP<I> = I extends { universalProfile: infer P }
  ? P extends true
    ? { universalProfile: Profile | null }
    : P extends ProfileInclude
      ? { universalProfile: ProfileResult<P> | null }
      : {}
  : {};

/**
 * Resolve nested `digitalAsset` relation based on include parameter.
 * When include has `digitalAsset` as a DigitalAssetInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveDataChangedEventDA<I> = I extends { digitalAsset: infer D }
  ? D extends true
    ? { digitalAsset: DigitalAsset | null }
    : D extends DigitalAssetInclude
      ? { digitalAsset: DigitalAssetResult<D> | null }
      : {}
  : {};

/**
 * DataChangedEvent type narrowed by include parameter.
 *
 * - `DataChangedEventResult` (no generic) → full `DataChangedEvent` type (backward compatible)
 * - `DataChangedEventResult<{}>` → `{ address; dataKey; dataValue; dataKeyName }` (base fields only)
 * - `DataChangedEventResult<{ timestamp: true }>` → base + timestamp
 * - `DataChangedEventResult<{ universalProfile: { name: true } }>` → base + narrowed UP
 * - `DataChangedEventResult<{ digitalAsset: { name: true } }>` → base + narrowed DA
 *
 * @example
 * ```ts
 * type Full = DataChangedEventResult;                                                  // = DataChangedEvent (all fields)
 * type Minimal = DataChangedEventResult<{}>;                                           // = { address; dataKey; dataValue; dataKeyName }
 * type WithTime = DataChangedEventResult<{ timestamp: true }>;                         // = base + timestamp
 * type WithUP = DataChangedEventResult<{ universalProfile: { name: true } }>;          // = base + narrowed UP
 * type WithDA = DataChangedEventResult<{ digitalAsset: { name: true } }>;              // = base + narrowed DA
 * ```
 */
export type DataChangedEventResult<I extends DataChangedEventInclude | undefined = undefined> =
  I extends undefined
    ? DataChangedEvent
    : IncludeResult<
        DataChangedEvent,
        'address' | 'dataKey' | 'dataValue' | 'dataKeyName',
        DataChangedEventScalarIncludeFieldMap,
        I
      > &
        ResolveDataChangedEventUP<NonNullable<I>> &
        ResolveDataChangedEventDA<NonNullable<I>>;

/**
 * DataChangedEvent with only base fields guaranteed — used for components that accept
 * any include-narrowed DataChangedEvent.
 */
export type PartialDataChangedEvent = PartialExcept<
  DataChangedEvent,
  'address' | 'dataKey' | 'dataValue' | 'dataKeyName'
>;
