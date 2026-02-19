import { z } from 'zod';

import { SortDirectionSchema } from './profiles';

// ---------------------------------------------------------------------------
// Core domain schema
// ---------------------------------------------------------------------------

/**
 * An ERC725 data change event — emitted when a key-value pair is set on an
 * ERC725Y contract (Universal Profile, Digital Asset, etc.).
 */
export const DataChangedEventSchema = z.object({
  /** Unique event identifier */
  id: z.string(),
  /** ERC725 contract address where the data change occurred */
  address: z.string(),
  /** ERC725Y data key (hex) that was set */
  dataKey: z.string(),
  /** New value (hex) that was written, may be empty */
  dataValue: z.string(),
  /** Block number where the event was emitted */
  blockNumber: z.number(),
  /** Log index within the transaction */
  logIndex: z.number(),
  /** Transaction index within the block */
  transactionIndex: z.number(),
  /** ISO timestamp of the block */
  timestamp: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const DataChangedFilterSchema = z.object({
  /** Case-insensitive match on ERC725 contract address */
  contractAddress: z.string().optional(),
  /** Case-insensitive match on ERC725 data key */
  dataKey: z.string().optional(),
  /** Minimum block number (inclusive) */
  blockNumberMin: z.number().optional(),
  /** Maximum block number (inclusive) */
  blockNumberMax: z.number().optional(),
});

/** Fields available for sorting data changed event lists */
export const DataChangedSortFieldSchema = z.enum(['blockNumber', 'contractAddress', 'dataKey']);

export const DataChangedSortSchema = z.object({
  /** Which field to sort by */
  field: DataChangedSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseDataChangedEventsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: DataChangedFilterSchema.optional(),
  /** Sort order for results */
  sort: DataChangedSortSchema.optional(),
  /** Maximum number of events to return */
  limit: z.number().optional(),
  /** Number of events to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteDataChangedEventsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: DataChangedFilterSchema.optional(),
  /** Sort order for results */
  sort: DataChangedSortSchema.optional(),
  /** Number of events per page (default: 20) */
  pageSize: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type DataChangedEvent = z.infer<typeof DataChangedEventSchema>;
export type DataChangedFilter = z.infer<typeof DataChangedFilterSchema>;
export type DataChangedSort = z.infer<typeof DataChangedSortSchema>;
export type DataChangedSortField = z.infer<typeof DataChangedSortFieldSchema>;
export type UseDataChangedEventsParams = z.infer<typeof UseDataChangedEventsParamsSchema>;
export type UseInfiniteDataChangedEventsParams = z.infer<
  typeof UseInfiniteDataChangedEventsParamsSchema
>;
