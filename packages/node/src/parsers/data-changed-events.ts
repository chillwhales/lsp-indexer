import { resolveDataKeyName } from '@lsp-indexer/data-keys';
import type {
  DataChangedEvent,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
} from '@lsp-indexer/types';
import type { GetDataChangedEventsQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/**
 * Raw Hasura data_changed type from the codegen-generated query result.
 *
 * Uses the array element type from `GetDataChangedEventsQuery['data_changed']`.
 */
type RawDataChangedEvent = GetDataChangedEventsQuery['data_changed'][number];

/**
 * Transform a raw Hasura data_changed response into a clean `DataChangedEvent` type.
 *
 * Handles all field mappings:
 * - `data_key` → `dataKey`
 * - `data_value` → `dataValue`
 * - `block_number` → `blockNumber`
 * - `log_index` → `logIndex`
 * - `transaction_index` → `transactionIndex`
 * - `universalProfile` → parsed via `parseProfile`
 * - `digitalAsset` → parsed via `parseDigitalAsset`
 * - `dataKeyName` is derived via `resolveDataKeyName` (NOT from Hasura) — conditionally
 *   included based on `include.dataKeyName` (not a base field)
 *
 * **Conditional include narrowing:**
 * When `include` is provided, `stripExcluded` removes fields not in the include map.
 * Profile and digital asset sub-includes are recursively stripped via nestedConfig.
 *
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `DataChangedEvent` (all fields guaranteed)
 * - With `<const I>` → returns `DataChangedEventResult<I>` (narrowed by include)
 * - With optional `include` → returns `PartialDataChangedEvent`
 *
 * @param raw - A single data_changed from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `DataChangedEvent` (full or partial depending on include)
 */
export function parseDataChangedEvent(raw: RawDataChangedEvent): DataChangedEvent;
export function parseDataChangedEvent<const I extends DataChangedEventInclude>(
  raw: RawDataChangedEvent,
  include: I,
): DataChangedEventResult<I>;
export function parseDataChangedEvent(
  raw: RawDataChangedEvent,
  include?: DataChangedEventInclude,
): DataChangedEvent | PartialDataChangedEvent;
export function parseDataChangedEvent(
  raw: RawDataChangedEvent,
  include?: DataChangedEventInclude,
): DataChangedEvent | PartialDataChangedEvent {
  const result: DataChangedEvent = {
    // Base fields (always present)
    address: raw.address,
    dataKey: raw.data_key,
    dataValue: raw.data_value,
    dataKeyName: resolveDataKeyName(raw.data_key),

    // Includable scalars
    blockNumber: raw.block_number ?? null,
    timestamp: raw.timestamp ?? null,
    logIndex: raw.log_index ?? null,
    transactionIndex: raw.transaction_index ?? null,

    // Relations — delegate to existing parsers
    universalProfile: raw.universalProfile ? parseProfile(raw.universalProfile) : null,
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['address', 'dataKey', 'dataValue'], undefined, {
    universalProfile: { baseFields: ['address'] },
    digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
  });
}

/**
 * Transform an array of raw Hasura data_changed responses into clean `DataChangedEvent[]`.
 *
 * Convenience wrapper around `parseDataChangedEvent` for batch results.
 *
 * @param raw - Array of data_changed from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseDataChangedEvent` call
 * @returns Array of clean, camelCase `DataChangedEvent` objects (full or partial depending on include)
 */
export function parseDataChangedEvents(raw: RawDataChangedEvent[]): DataChangedEvent[];
export function parseDataChangedEvents<const I extends DataChangedEventInclude>(
  raw: RawDataChangedEvent[],
  include: I,
): DataChangedEventResult<I>[];
export function parseDataChangedEvents(
  raw: RawDataChangedEvent[],
  include?: DataChangedEventInclude,
): (DataChangedEvent | PartialDataChangedEvent)[] {
  if (include) return raw.map((r) => parseDataChangedEvent(r, include));
  return raw.map((r) => parseDataChangedEvent(r));
}
