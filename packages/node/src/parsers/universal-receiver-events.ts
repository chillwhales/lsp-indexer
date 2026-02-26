import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
} from '@lsp-indexer/types';
import type { GetUniversalReceiverEventsQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';
import { numericToString } from './utils';

/**
 * Raw Hasura universal_receiver type from the codegen-generated query result.
 *
 * Uses the array element type from `GetUniversalReceiverEventsQuery['universal_receiver']`.
 */
type RawUniversalReceiverEvent = GetUniversalReceiverEventsQuery['universal_receiver'][number];

/**
 * Transform a raw Hasura universal_receiver response into a clean `UniversalReceiverEvent` type.
 *
 * Handles all field mappings:
 * - `type_id` → `typeId`
 * - `value` (numeric) → `value` (includable — bigint via numericToString + BigInt for uint256 precision)
 * - `received_data` → `receivedData` (includable — potentially large hex)
 * - `returned_value` → `returnedValue` (includable — potentially large hex)
 * - `block_number` → `blockNumber`
 * - `log_index` → `logIndex`
 * - `transaction_index` → `transactionIndex`
 * - `universalProfile` → parsed via `parseProfile` (receiving UP)
 * - `fromProfile` → parsed via `parseProfile` (sender UP)
 * - `fromAsset` → parsed via `parseDigitalAsset` (sender DA)
 *
 * **Conditional include narrowing:**
 * When `include` is provided, `stripExcluded` removes fields not in the include map.
 * Profile and digital asset sub-includes are passed through to their respective
 * parsers for recursive nested stripping.
 *
 * Uses function overloads for type-safe return types (DX-05):
 * - No `include` → returns full `UniversalReceiverEvent` (all fields guaranteed)
 * - With `<const I>` → returns `UniversalReceiverEventResult<I>` (narrowed by include)
 * - With optional `include` → returns `PartialUniversalReceiverEvent`
 *
 * @param raw - A single universal_receiver from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `UniversalReceiverEvent` (full or partial depending on include)
 */
export function parseUniversalReceiverEvent(raw: RawUniversalReceiverEvent): UniversalReceiverEvent;
export function parseUniversalReceiverEvent<const I extends UniversalReceiverEventInclude>(
  raw: RawUniversalReceiverEvent,
  include: I,
): UniversalReceiverEventResult<I>;
export function parseUniversalReceiverEvent(
  raw: RawUniversalReceiverEvent,
  include?: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent;
export function parseUniversalReceiverEvent(
  raw: RawUniversalReceiverEvent,
  include?: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent {
  const result: UniversalReceiverEvent = {
    // Base fields (always present)
    address: raw.address,
    from: raw.from,
    typeId: raw.type_id,

    // Includable scalars
    value: raw.value != null ? BigInt(numericToString(raw.value)) : null,
    receivedData: raw.received_data ?? null,
    returnedValue: raw.returned_value ?? null,
    blockNumber: raw.block_number ?? null,
    timestamp: raw.timestamp != null ? String(raw.timestamp) : null,
    logIndex: raw.log_index ?? null,
    transactionIndex: raw.transaction_index ?? null,

    // Relations — 3 nested relations
    // Sub-includes: when `true`, pass no include to sub-parser (= full result).
    // When it's an object, pass it as sub-include for recursive narrowing.
    // When absent/false, the relation won't be in the result (handled by stripExcluded).
    universalProfile: raw.universalProfile ? parseProfile(raw.universalProfile as any) : null,
    fromProfile: raw.fromProfile ? parseProfile(raw.fromProfile as any) : null,
    fromAsset: raw.fromAsset ? parseDigitalAsset(raw.fromAsset as any) : null,
  };

  if (!include) return result;

  return stripExcluded(result, include, ['address', 'from', 'typeId']);
}

/**
 * Transform an array of raw Hasura universal_receiver responses into clean `UniversalReceiverEvent[]`.
 *
 * Convenience wrapper around `parseUniversalReceiverEvent` for batch results.
 *
 * @param raws - Array of universal_receiver from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseUniversalReceiverEvent` call
 * @returns Array of clean, camelCase `UniversalReceiverEvent` objects (full or partial depending on include)
 */
export function parseUniversalReceiverEvents(
  raws: RawUniversalReceiverEvent[],
): UniversalReceiverEvent[];
export function parseUniversalReceiverEvents<const I extends UniversalReceiverEventInclude>(
  raws: RawUniversalReceiverEvent[],
  include: I,
): UniversalReceiverEventResult<I>[];
export function parseUniversalReceiverEvents(
  raws: RawUniversalReceiverEvent[],
  include?: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent[];
export function parseUniversalReceiverEvents(
  raws: RawUniversalReceiverEvent[],
  include?: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent[] {
  return raws.map((raw) => parseUniversalReceiverEvent(raw, include as any));
}
