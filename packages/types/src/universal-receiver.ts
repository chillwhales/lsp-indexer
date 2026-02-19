import { z } from 'zod';

import { SortDirectionSchema } from './profiles';

// ---------------------------------------------------------------------------
// Core domain schema
// ---------------------------------------------------------------------------

/**
 * A Universal Receiver event — emitted when a Universal Profile receives
 * a token transfer, follow notification, or other typed data via the
 * LSP1 UniversalReceiver standard.
 */
export const UniversalReceiverEventSchema = z.object({
  /** Unique event identifier */
  id: z.string(),
  /** UP address that received the notification */
  address: z.string(),
  /** Sender address (who triggered the event) */
  from: z.string(),
  /** LSP1 type identifier hash (what was received) */
  typeId: z.string(),
  /** Encoded received data (hex string) */
  receivedData: z.string(),
  /** Return value from universalReceiver call (hex string) */
  returnedValue: z.string(),
  /** Block number the event was emitted in */
  blockNumber: z.number(),
  /** Transaction index within the block */
  transactionIndex: z.number(),
  /** Log index within the transaction */
  logIndex: z.number(),
  /** Value sent with the transaction (as string for large numbers) */
  value: z.string(),
  /** Block timestamp (ISO 8601), or `null` if not available */
  timestamp: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const UniversalReceiverFilterSchema = z.object({
  /** Case-insensitive match on receiver address */
  receiverAddress: z.string().optional(),
  /** Case-insensitive match on sender address */
  from: z.string().optional(),
  /** Case-insensitive match on LSP1 type ID hash */
  typeId: z.string().optional(),
  /** Minimum block number (inclusive) */
  blockNumberMin: z.number().optional(),
  /** Maximum block number (inclusive) */
  blockNumberMax: z.number().optional(),
});

/** Fields available for sorting universal receiver event lists */
export const UniversalReceiverSortFieldSchema = z.enum([
  'blockNumber',
  'receiverAddress',
  'typeId',
]);

export const UniversalReceiverSortSchema = z.object({
  /** Which field to sort by */
  field: UniversalReceiverSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseUniversalReceiverEventsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: UniversalReceiverFilterSchema.optional(),
  /** Sort order for results */
  sort: UniversalReceiverSortSchema.optional(),
  /** Maximum number of events to return */
  limit: z.number().optional(),
  /** Number of events to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteUniversalReceiverEventsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: UniversalReceiverFilterSchema.optional(),
  /** Sort order for results */
  sort: UniversalReceiverSortSchema.optional(),
  /** Number of events per page (default: 20) */
  pageSize: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type UniversalReceiverEvent = z.infer<typeof UniversalReceiverEventSchema>;
export type UniversalReceiverFilter = z.infer<typeof UniversalReceiverFilterSchema>;
export type UniversalReceiverSort = z.infer<typeof UniversalReceiverSortSchema>;
export type UniversalReceiverSortField = z.infer<typeof UniversalReceiverSortFieldSchema>;
export type UseUniversalReceiverEventsParams = z.infer<
  typeof UseUniversalReceiverEventsParamsSchema
>;
export type UseInfiniteUniversalReceiverEventsParams = z.infer<
  typeof UseInfiniteUniversalReceiverEventsParamsSchema
>;
