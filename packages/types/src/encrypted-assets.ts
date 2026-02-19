import { z } from 'zod';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/**
 * A single image associated with an LSP29 encrypted asset.
 */
export const EncryptedAssetImageSchema = z.object({
  /** Image URL (IPFS gateway URL or HTTP URL) */
  url: z.string(),
  /** Image width in pixels, or `null` if not available */
  width: z.number().nullable(),
  /** Image height in pixels, or `null` if not available */
  height: z.number().nullable(),
});

/**
 * LSP29 Encrypted Asset container record.
 *
 * Represents an encrypted asset stored on-chain with associated metadata
 * (title, description, file info, encryption details, images).
 */
export const EncryptedAssetSchema = z.object({
  /** Unique identifier for this encrypted asset record */
  id: z.string(),
  /** Contract address associated with this encrypted asset */
  address: z.string(),
  /** Title of the encrypted asset, or `null` if not set */
  title: z.string().nullable(),
  /** Description of the encrypted asset, or `null` if not set */
  description: z.string().nullable(),
  /** URL where the encrypted data is stored, or `null` if not available */
  url: z.string().nullable(),
  /** Content ID for the encrypted asset, or `null` if not set */
  contentId: z.string().nullable(),
  /** Whether the encrypted data has been fetched and decoded */
  isDataFetched: z.boolean(),
  /** Version of the LSP29 standard used, or `null` if not set */
  version: z.string().nullable(),
  /** Encryption method used, or `null` if no encryption info */
  encryptionMethod: z.string().nullable(),
  /** File name, or `null` if not available */
  fileName: z.string().nullable(),
  /** File type (MIME type), or `null` if not available */
  fileType: z.string().nullable(),
  /** File size in bytes, or `null` if not available */
  fileSize: z.number().nullable(),
  /** Number of images associated with this encrypted asset */
  imageCount: z.number(),
  /** Images associated with this encrypted asset */
  images: z.array(EncryptedAssetImageSchema),
  /** Universal Profile address of the owner, or `null` if not linked */
  ownerAddress: z.string().nullable(),
  /** Timestamp when this encrypted asset was created */
  timestamp: z.string(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const EncryptedAssetFilterSchema = z.object({
  /** Filter by title (case-insensitive partial match) */
  title: z.string().optional(),
  /** Filter by owner UP address (case-insensitive exact match) */
  ownerAddress: z.string().optional(),
});

/** Fields available for sorting encrypted asset lists */
export const EncryptedAssetSortFieldSchema = z.enum(['title', 'timestamp']);

export const EncryptedAssetSortSchema = z.object({
  /** Which field to sort by */
  field: EncryptedAssetSortFieldSchema,
  /** Sort direction */
  direction: z.enum(['asc', 'desc']),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseEncryptedAssetParamsSchema = z.object({
  /** The encrypted asset contract address to fetch */
  address: z.string(),
});

export const UseEncryptedAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: EncryptedAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: EncryptedAssetSortSchema.optional(),
  /** Maximum number of encrypted assets to return */
  limit: z.number().optional(),
  /** Number of encrypted assets to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteEncryptedAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: EncryptedAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: EncryptedAssetSortSchema.optional(),
  /** Number of encrypted assets per page (default: 20) */
  pageSize: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type EncryptedAsset = z.infer<typeof EncryptedAssetSchema>;
export type EncryptedAssetImage = z.infer<typeof EncryptedAssetImageSchema>;
export type EncryptedAssetFilter = z.infer<typeof EncryptedAssetFilterSchema>;
export type EncryptedAssetSort = z.infer<typeof EncryptedAssetSortSchema>;
export type EncryptedAssetSortField = z.infer<typeof EncryptedAssetSortFieldSchema>;
export type UseEncryptedAssetParams = z.infer<typeof UseEncryptedAssetParamsSchema>;
export type UseEncryptedAssetsParams = z.infer<typeof UseEncryptedAssetsParamsSchema>;
export type UseInfiniteEncryptedAssetsParams = z.infer<
  typeof UseInfiniteEncryptedAssetsParamsSchema
>;
