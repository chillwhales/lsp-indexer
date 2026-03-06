import { z } from 'zod';

import { TypeIdNameSchema } from '@chillwhales/lsp1';

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
 * A universal receiver event from the `universal_receiver` Hasura table.
 *
 * Represents a single `universalReceiver` call received by a Universal Profile
 * or other LSP1-compatible contract. Triggered whenever a UP receives tokens,
 * NFTs, or other value. Base fields (`address`, `from`, `typeId`, `value`) are
 * always present; `receivedData`, `returnedValue`, and `value` are includable
 * scalar fields, and 3 relation includes are also controlled by the `include`
 * parameter.
 */
export const UniversalReceiverEventSchema = z.object({
  /** Receiving contract address — the UP that received the universalReceiver call (always present) */
  address: z.string(),
  /** Sender address — who/what triggered the call (always present) */
  from: z.string(),
  /** LSP1 type identifier — bytes32 hash identifying the operation type (always present) */
  typeId: z.string(),
  /** Resolved human-readable name for known LSP1 type IDs, null if unknown (null = not included or type ID unknown) */
  typeIdName: z.string().nullable(),
  /** Raw hex data received in the universalReceiver call (null = not included) */
  receivedData: z.string().nullable(),
  /** Raw hex return value from the universalReceiver call (null = not included) */
  returnedValue: z.string().nullable(),
  /** Wei value transferred with the call (bigint for uint256 precision, null = not included) */
  value: z.bigint().nullable(),
  /** Block number where event was emitted (null = not included) */
  blockNumber: z.number().nullable(),
  /** Timestamp when event was indexed (null = not included) */
  timestamp: z.string().nullable(),
  /** Log index within the transaction (null = not included) */
  logIndex: z.number().nullable(),
  /** Transaction index within the block (null = not included) */
  transactionIndex: z.number().nullable(),
  /** Universal Profile of the receiving address (null = not included or address is not a UP) */
  universalProfile: ProfileSchema.nullable(),
  /** Universal Profile of the sender address (null = not included or sender is not a UP) */
  fromProfile: ProfileSchema.nullable(),
  /** Digital Asset of the sender — the asset being transferred (null = not included or sender is not a DA) */
  fromAsset: DigitalAssetSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema — 8 filter fields (10 params due to 2 range fields)
// ---------------------------------------------------------------------------

/**
 * Filter for universal receiver event queries.
 *
 * All 8 filter fields — string fields use `_ilike` (case-insensitive),
 * timestamp and blockNumber fields use `_gte` / `_lte` for range filtering.
 */
export const UniversalReceiverEventFilterSchema = z.object({
  /** Case-insensitive match on receiving contract address (uses _ilike) */
  address: z.string().optional(),
  /** Case-insensitive match on sender address (uses _ilike) */
  from: z.string().optional(),
  /** Case-insensitive match on LSP1 type identifier (uses _ilike) */
  typeId: z.string().optional(),
  /** Known LSP1 type ID name (e.g., 'LSP7Tokens_SenderNotification') — resolved to hex at service layer */
  typeIdName: TypeIdNameSchema.optional(),
  /** Timestamp lower bound (inclusive, _gte) */
  timestampFrom: z.union([z.string(), z.number()]).optional(),
  /** Timestamp upper bound (inclusive, _lte) */
  timestampTo: z.union([z.string(), z.number()]).optional(),
  /** Block number lower bound (inclusive, _gte) */
  blockNumberFrom: z.number().optional(),
  /** Block number upper bound (inclusive, _lte) */
  blockNumberTo: z.number().optional(),
  /** Case-insensitive search on receiving UP name (nested: universalProfile.lsp3Profile.name.value._ilike) */
  universalProfileName: z.string().optional(),
  /** Case-insensitive search on sender UP name (nested: fromProfile.lsp3Profile.name.value._ilike) */
  fromProfileName: z.string().optional(),
  /** Case-insensitive search on sender DA name (nested: fromAsset.lsp4TokenName.value._ilike) */
  fromAssetName: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Sort schema — 5 sort fields
// ---------------------------------------------------------------------------

/**
 * Fields available for sorting universal receiver event lists.
 *
 * `newest` and `oldest` use deterministic block-order sorting
 * (block_number → transaction_index → log_index). `direction` and `nulls`
 * are ignored when these fields are selected.
 *
 * `universalProfileName` is a nested sort via `universalProfile.lsp3Profile.name`.
 * `fromProfileName` is a nested sort via `fromProfile.lsp3Profile.name`.
 * `fromAssetName` is a nested sort via `fromAsset.lsp4TokenName`.
 * All handled at service layer.
 */
export const UniversalReceiverEventSortFieldSchema = z.enum([
  'newest',
  'oldest',
  'universalProfileName',
  'fromProfileName',
  'fromAssetName',
]);

export const UniversalReceiverEventSortSchema = z.object({
  /** Which field to sort by */
  field: UniversalReceiverEventSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema (inverted default — omit = fetch everything)
// ---------------------------------------------------------------------------

/**
 * Controls which optional fields are fetched for universal receiver event queries.
 *
 * **Inverted default:** When `include` is omitted, ALL fields are fetched
 * (opt-out rather than opt-in). When `include` is provided, only fields
 * set to `true` (or provided as sub-include objects) are included.
 *
 * **Relation sub-includes:** `universalProfile` and `fromProfile` accept
 * ProfileInclude sub-objects, `fromAsset` accepts DigitalAssetInclude sub-objects.
 */
export const UniversalReceiverEventIncludeSchema = z.object({
  /** Include resolved human-readable type ID name (parser-derived from typeId) */
  typeIdName: z.boolean().optional(),
  /** Include wei value transferred with the call */
  value: z.boolean().optional(),
  /** Include raw hex data received in the universalReceiver call */
  receivedData: z.boolean().optional(),
  /** Include raw hex return value from the universalReceiver call */
  returnedValue: z.boolean().optional(),
  /** Include block number */
  blockNumber: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include log index */
  logIndex: z.boolean().optional(),
  /** Include transaction index */
  transactionIndex: z.boolean().optional(),
  /** Include receiving Universal Profile — `true` for all fields, or object for per-field control */
  universalProfile: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
  /** Include sender Universal Profile — `true` for all fields, or object for per-field control */
  fromProfile: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
  /** Include sender Digital Asset — `true` for all fields, or object for per-field control */
  fromAsset: z.union([z.boolean(), DigitalAssetIncludeSchema]).optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas — 2 hooks (no singular — event tables have no natural key)
// ---------------------------------------------------------------------------

/** Params for useUniversalReceiverEvents — paginated list of universal receiver events */
export const UseUniversalReceiverEventsParamsSchema = z.object({
  filter: UniversalReceiverEventFilterSchema.optional(),
  sort: UniversalReceiverEventSortSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: UniversalReceiverEventIncludeSchema.optional(),
});

/** Params for useInfiniteUniversalReceiverEvents — infinite scroll variant */
export const UseInfiniteUniversalReceiverEventsParamsSchema = z.object({
  filter: UniversalReceiverEventFilterSchema.optional(),
  sort: UniversalReceiverEventSortSchema.optional(),
  pageSize: z.number().optional(),
  include: UniversalReceiverEventIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type UniversalReceiverEvent = z.infer<typeof UniversalReceiverEventSchema>;
export type UniversalReceiverEventFilter = z.infer<typeof UniversalReceiverEventFilterSchema>;
export type UniversalReceiverEventSortField = z.infer<typeof UniversalReceiverEventSortFieldSchema>;
export type UniversalReceiverEventSort = z.infer<typeof UniversalReceiverEventSortSchema>;
export type UniversalReceiverEventInclude = z.infer<typeof UniversalReceiverEventIncludeSchema>;
export type UseUniversalReceiverEventsParams = z.infer<
  typeof UseUniversalReceiverEventsParamsSchema
>;
export type UseInfiniteUniversalReceiverEventsParams = z.infer<
  typeof UseInfiniteUniversalReceiverEventsParamsSchema
>;

// ---------------------------------------------------------------------------
// Conditional include result type (DX-04)
// ---------------------------------------------------------------------------

/**
 * Scalar include fields: include schema key → UniversalReceiverEvent field name.
 * Relations (universalProfile, fromProfile, fromAsset) handled by resolver types.
 */
type UniversalReceiverEventScalarIncludeFieldMap = {
  typeIdName: 'typeIdName';
  value: 'value';
  receivedData: 'receivedData';
  returnedValue: 'returnedValue';
  blockNumber: 'blockNumber';
  timestamp: 'timestamp';
  logIndex: 'logIndex';
  transactionIndex: 'transactionIndex';
};

/**
 * Resolve nested `universalProfile` relation (receiving UP) based on include parameter.
 * When include has `universalProfile` as a ProfileInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveUniversalReceiverEventUP<I> = I extends { universalProfile: infer P }
  ? P extends true
    ? { universalProfile: Profile | null }
    : P extends ProfileInclude
      ? { universalProfile: ProfileResult<P> | null }
      : {}
  : {};

/**
 * Resolve nested `fromProfile` relation (sender UP) based on include parameter.
 * When include has `fromProfile` as a ProfileInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveUniversalReceiverEventFromProfile<I> = I extends { fromProfile: infer P }
  ? P extends true
    ? { fromProfile: Profile | null }
    : P extends ProfileInclude
      ? { fromProfile: ProfileResult<P> | null }
      : {}
  : {};

/**
 * Resolve nested `fromAsset` relation (sender DA) based on include parameter.
 * When include has `fromAsset` as a DigitalAssetInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveUniversalReceiverEventFromAsset<I> = I extends { fromAsset: infer D }
  ? D extends true
    ? { fromAsset: DigitalAsset | null }
    : D extends DigitalAssetInclude
      ? { fromAsset: DigitalAssetResult<D> | null }
      : {}
  : {};

/**
 * UniversalReceiverEvent type narrowed by include parameter.
 *
 * - `UniversalReceiverEventResult` (no generic) → full `UniversalReceiverEvent` type (backward compatible)
 * - `UniversalReceiverEventResult<{}>` → `{ address; from; typeId }` (base fields only)
 * - `UniversalReceiverEventResult<{ value: true }>` → base + value
 * - `UniversalReceiverEventResult<{ receivedData: true }>` → base + receivedData
 * - `UniversalReceiverEventResult<{ timestamp: true }>` → base + timestamp
 * - `UniversalReceiverEventResult<{ universalProfile: { name: true } }>` → base + narrowed receiving UP
 * - `UniversalReceiverEventResult<{ fromProfile: true }>` → base + full sender UP
 * - `UniversalReceiverEventResult<{ fromAsset: { name: true } }>` → base + narrowed sender DA
 *
 * @example
 * ```ts
 * type Full = UniversalReceiverEventResult;                                            // = UniversalReceiverEvent (all fields)
 * type Minimal = UniversalReceiverEventResult<{}>;                                     // = { address; from; typeId }
 * type WithVal = UniversalReceiverEventResult<{ value: true }>;                        // = base + value
 * type WithData = UniversalReceiverEventResult<{ receivedData: true }>;                // = base + receivedData
 * type WithTime = UniversalReceiverEventResult<{ timestamp: true }>;                   // = base + timestamp
 * type WithUP = UniversalReceiverEventResult<{ universalProfile: { name: true } }>;    // = base + narrowed UP
 * type WithDA = UniversalReceiverEventResult<{ fromAsset: { name: true } }>;           // = base + narrowed DA
 * ```
 */
export type UniversalReceiverEventResult<
  I extends UniversalReceiverEventInclude | undefined = undefined,
> = I extends undefined
  ? UniversalReceiverEvent
  : IncludeResult<
      UniversalReceiverEvent,
      'address' | 'from' | 'typeId',
      UniversalReceiverEventScalarIncludeFieldMap,
      I
    > &
      ResolveUniversalReceiverEventUP<NonNullable<I>> &
      ResolveUniversalReceiverEventFromProfile<NonNullable<I>> &
      ResolveUniversalReceiverEventFromAsset<NonNullable<I>>;

/**
 * UniversalReceiverEvent with only base fields guaranteed — used for components that accept
 * any include-narrowed UniversalReceiverEvent.
 */
export type PartialUniversalReceiverEvent = PartialExcept<
  UniversalReceiverEvent,
  'address' | 'from' | 'typeId'
>;
