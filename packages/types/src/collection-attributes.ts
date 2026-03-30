import { z } from 'zod';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/** A single distinct attribute key/value pair from a collection's NFT metadata. */
export const CollectionAttributeSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.string().nullable(),
});

/** Result containing distinct attributes and total NFT count for a collection. */
export const CollectionAttributesResultSchema = z.object({
  attributes: z.array(CollectionAttributeSchema),
  totalCount: z.number(),
});

// ---------------------------------------------------------------------------
// Hook parameter schema
// ---------------------------------------------------------------------------

/** Params for useCollectionAttributes — distinct attributes for a collection address. */
export const UseCollectionAttributesParamsSchema = z.object({
  collectionAddress: z.string(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CollectionAttribute = z.infer<typeof CollectionAttributeSchema>;
export type CollectionAttributesResult = z.infer<typeof CollectionAttributesResultSchema>;
export type UseCollectionAttributesParams = z.infer<typeof UseCollectionAttributesParamsSchema>;
