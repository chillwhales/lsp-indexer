import type { UniversalReceiverEvent } from '@lsp-indexer/types';
import type { GetUniversalReceiverEventsQuery } from '../graphql/graphql';

/**
 * Raw Hasura universal_receiver type from the codegen-generated query result.
 *
 * This is the shape of a single `universal_receiver` element returned by
 * `GetUniversalReceiverEventsQuery`. We extract it from the codegen type
 * to keep the parser type-safe against schema changes.
 */
type RawUniversalReceiverEvent = GetUniversalReceiverEventsQuery['universal_receiver'][number];

/**
 * Transform a raw Hasura Universal Receiver event into a clean `UniversalReceiverEvent` type.
 *
 * Handles all edge cases:
 * - `timestamp` may be `null` (not yet indexed)
 * - `value` is numeric in Hasura — converted to string for large-number safety
 *
 * @param raw - A single universal_receiver from the Hasura GraphQL response
 * @returns A clean, camelCase `UniversalReceiverEvent` with safe defaults
 */
export function parseUniversalReceiverEvent(
  raw: RawUniversalReceiverEvent,
): UniversalReceiverEvent {
  return {
    id: raw.id,
    address: raw.address,
    from: raw.from,
    typeId: raw.type_id,
    receivedData: raw.received_data,
    returnedValue: raw.returned_value,
    blockNumber: raw.block_number,
    transactionIndex: raw.transaction_index,
    logIndex: raw.log_index,
    value: String(raw.value),
    timestamp: raw.timestamp ?? null,
  };
}

/**
 * Transform an array of raw Hasura Universal Receiver events into clean `UniversalReceiverEvent[]`.
 *
 * Convenience wrapper around `parseUniversalReceiverEvent` for batch results.
 *
 * @param raw - Array of universal_receiver from the Hasura GraphQL response
 * @returns Array of clean, camelCase `UniversalReceiverEvent` objects
 */
export function parseUniversalReceiverEvents(
  raw: RawUniversalReceiverEvent[],
): UniversalReceiverEvent[] {
  return raw.map(parseUniversalReceiverEvent);
}
