import { z } from 'zod';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/**
 * Schema for an LSP29 Encrypted Asset Feed Entry.
 *
 * Represents a single entry in the encrypted asset feed table
 * (`lsp29_encrypted_asset_entry`). Each entry tracks an encrypted asset
 * at a specific address with a content identifier hash and timestamp.
 */
export const EncryptedFeedEntrySchema = z.object({
  /** Unique entry identifier (primary key) */
  id: z.string(),
  /** The contract address of the encrypted asset */
  address: z.string(),
  /** Content identifier hash for the encrypted data */
  contentIdHash: z.string(),
  /** Array index position within the feed, or `null` if not set */
  arrayIndex: z.number().nullable(),
  /** ISO timestamp of when the entry was created */
  timestamp: z.string(),
  /** Associated Universal Profile ID, or `null` if not linked */
  universalProfileId: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const EncryptedFeedFilterSchema = z.object({
  /** Filter entries by encrypted asset contract address (case-insensitive) */
  address: z.string().optional(),
  /** Filter entries by associated Universal Profile address (case-insensitive) */
  universalProfileId: z.string().optional(),
});

/** Fields available for sorting encrypted feed entry lists */
export const EncryptedFeedSortFieldSchema = z.enum(['timestamp', 'arrayIndex', 'address']);

/** Sort direction (re-exported from profiles for consistency) */
export const EncryptedFeedSortDirectionSchema = z.enum(['asc', 'desc']);

export const EncryptedFeedSortSchema = z.object({
  /** Which field to sort by */
  field: EncryptedFeedSortFieldSchema,
  /** Sort direction */
  direction: EncryptedFeedSortDirectionSchema,
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseEncryptedAssetFeedParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: EncryptedFeedFilterSchema.optional(),
  /** Sort order for results */
  sort: EncryptedFeedSortSchema.optional(),
  /** Maximum number of entries to return */
  limit: z.number().optional(),
  /** Number of entries to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteEncryptedAssetFeedParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: EncryptedFeedFilterSchema.optional(),
  /** Sort order for results */
  sort: EncryptedFeedSortSchema.optional(),
  /** Number of entries per page (default: 20) */
  pageSize: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type EncryptedFeedEntry = z.infer<typeof EncryptedFeedEntrySchema>;
export type EncryptedFeedFilter = z.infer<typeof EncryptedFeedFilterSchema>;
export type EncryptedFeedSort = z.infer<typeof EncryptedFeedSortSchema>;
export type EncryptedFeedSortField = z.infer<typeof EncryptedFeedSortFieldSchema>;
export type EncryptedFeedSortDirection = z.infer<typeof EncryptedFeedSortDirectionSchema>;
export type UseEncryptedAssetFeedParams = z.infer<typeof UseEncryptedAssetFeedParamsSchema>;
export type UseInfiniteEncryptedAssetFeedParams = z.infer<
  typeof UseInfiniteEncryptedAssetFeedParamsSchema
>;
