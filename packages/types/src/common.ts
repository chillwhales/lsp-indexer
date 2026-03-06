import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared schemas used across multiple domains
// ---------------------------------------------------------------------------

/** Sort direction — shared across all domain sort schemas */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/** Null ordering — controls where null values appear in sort results */
export const SortNullsSchema = z.enum(['first', 'last']);

// ---------------------------------------------------------------------------
// Metadata schemas — shared across domains (profiles, digital-assets, nfts, etc.)
// ---------------------------------------------------------------------------

/** Metadata image (icon, profile image, background, or content image) — shared across domains */
export const ImageSchema = z.object({
  /** Image URL (IPFS gateway URL or HTTP URL) */
  url: z.string(),
  /** Image width in pixels, or `null` if not available */
  width: z.number().nullable(),
  /** Image height in pixels, or `null` if not available */
  height: z.number().nullable(),
  /** On-chain verification data, or `null` if not verified */
  verification: z
    .object({
      /** Verification method (e.g., "keccak256(bytes)") */
      method: z.string(),
      /** Verification data hash (e.g., "0x...") */
      data: z.string(),
    })
    .nullable(),
});

/** Metadata external link — shared across domains */
export const LinkSchema = z.object({
  /** Link display title */
  title: z.string(),
  /** Link URL */
  url: z.string(),
});

/**
 * Asset file (3D model, high-res media, etc.) — shared across LSP3 avatar and LSP4 assets.
 *
 * Unlike images, assets have a `fileType` (MIME type or extension) but no width/height.
 * Used for LSP3 `avatar` (3D avatar files) and LSP4 `assets` (attached media).
 */
export const AssetSchema = z.object({
  /** Asset URL (IPFS gateway URL or HTTP URL) */
  url: z.string(),
  /** File type (MIME type or extension, e.g., "fbx", "model/gltf+json") */
  fileType: z.string(),
  /** On-chain verification data, or `null` if not verified */
  verification: z
    .object({
      /** Verification method (e.g., "keccak256(bytes)") */
      method: z.string(),
      /** Verification data hash (e.g., "0x...") */
      data: z.string(),
    })
    .nullable(),
});

/** LSP4 metadata attribute (trait/property) — shared across domains */
export const Lsp4AttributeSchema = z.object({
  /** Attribute key/trait type */
  key: z.string(),
  /** Attribute value */
  value: z.string(),
  /** Attribute type (e.g., "string", "number", "date") */
  type: z.string(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Sort direction — `'asc'` or `'desc'`. See {@link SortDirectionSchema}. */
export type SortDirection = z.infer<typeof SortDirectionSchema>;
/** Null ordering — `'first'` or `'last'`. See {@link SortNullsSchema}. */
export type SortNulls = z.infer<typeof SortNullsSchema>;
/** Metadata image with optional dimensions and verification. See {@link ImageSchema}. */
export type Image = z.infer<typeof ImageSchema>;
/** External link with title and URL. See {@link LinkSchema}. */
export type Link = z.infer<typeof LinkSchema>;
/** LSP4 metadata attribute (trait/property). See {@link Lsp4AttributeSchema}. */
export type Lsp4Attribute = z.infer<typeof Lsp4AttributeSchema>;
/** Asset file (3D model, media) with URL, file type, and verification. See {@link AssetSchema}. */
export type Asset = z.infer<typeof AssetSchema>;
