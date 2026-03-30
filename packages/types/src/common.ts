import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

export const SortDirectionSchema = z.enum(['asc', 'desc']);

export const SortNullsSchema = z.enum(['first', 'last']);

// ---------------------------------------------------------------------------
// Metadata schemas
// ---------------------------------------------------------------------------

export const ImageSchema = z.object({
  url: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  verification: z
    .object({
      method: z.string(),
      data: z.string(),
    })
    .nullable(),
});

export const LinkSchema = z.object({
  title: z.string(),
  url: z.string(),
});

/** Asset file (3D model, media) — has `fileType` but no width/height, unlike images. */
export const AssetSchema = z.object({
  url: z.string(),
  /** MIME type or extension (e.g., "fbx", "model/gltf+json") */
  fileType: z.string(),
  verification: z
    .object({
      method: z.string(),
      data: z.string(),
    })
    .nullable(),
});

export const Lsp4AttributeSchema = z.object({
  key: z.string(),
  value: z.string(),
  /** e.g., "string", "number", "date" */
  type: z.string(),
  /** Numeric score derived from the attribute (chillwhales-specific) */
  score: z.number().nullable(),
  /** Rarity score for this attribute across the collection (chillwhales-specific) */
  rarity: z.number().nullable(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type SortDirection = z.infer<typeof SortDirectionSchema>;
export type SortNulls = z.infer<typeof SortNullsSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type Lsp4Attribute = z.infer<typeof Lsp4AttributeSchema>;
export type Asset = z.infer<typeof AssetSchema>;
