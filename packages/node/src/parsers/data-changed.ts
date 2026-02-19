import type { DataChangedEvent } from '@lsp-indexer/types';
import type { GetDataChangedEventsQuery } from '../graphql/graphql';

/**
 * Raw Hasura data_changed type from the codegen-generated query result.
 */
type RawDataChangedEvent = GetDataChangedEventsQuery['data_changed'][number];

/**
 * Transform a raw Hasura data_changed row into a clean `DataChangedEvent` type.
 *
 * Maps snake_case Hasura field names to camelCase, with safe defaults:
 * - `timestamp` may be `null` if the block hasn't been timestamped yet
 *
 * @param raw - A single data_changed from the Hasura GraphQL response
 * @returns A clean, camelCase `DataChangedEvent` with safe defaults
 */
export function parseDataChangedEvent(raw: RawDataChangedEvent): DataChangedEvent {
  return {
    id: raw.id,
    address: raw.address,
    dataKey: raw.data_key,
    dataValue: raw.data_value,
    blockNumber: raw.block_number,
    logIndex: raw.log_index,
    transactionIndex: raw.transaction_index,
    timestamp: raw.timestamp ?? null,
  };
}

/**
 * Transform an array of raw Hasura data_changed rows into clean `DataChangedEvent[]`.
 *
 * Convenience wrapper around `parseDataChangedEvent` for batch results.
 *
 * @param raw - Array of data_changed from the Hasura GraphQL response
 * @returns Array of clean, camelCase `DataChangedEvent` objects
 */
export function parseDataChangedEvents(raw: RawDataChangedEvent[]): DataChangedEvent[] {
  return raw.map(parseDataChangedEvent);
}
