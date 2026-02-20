import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared schemas used across multiple domains
// ---------------------------------------------------------------------------

/** Sort direction — shared across all domain sort schemas */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/** Null ordering — controls where null values appear in sort results */
export const SortNullsSchema = z.enum(['first', 'last']);

// ---------------------------------------------------------------------------
// LSP4 metadata schemas — shared across domains (digital-assets, nfts, etc.)
// ---------------------------------------------------------------------------

/** LSP4 metadata image (icon, background, or content image) — shared across domains */
export const Lsp4ImageSchema = z.object({
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

/** LSP4 metadata external link — shared across domains */
export const Lsp4LinkSchema = z.object({
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

export type SortDirection = z.infer<typeof SortDirectionSchema>;
export type SortNulls = z.infer<typeof SortNullsSchema>;
export type Lsp4Image = z.infer<typeof Lsp4ImageSchema>;
export type Lsp4Link = z.infer<typeof Lsp4LinkSchema>;
export type Lsp4Attribute = z.infer<typeof Lsp4AttributeSchema>;
export type Asset = z.infer<typeof AssetSchema>;
