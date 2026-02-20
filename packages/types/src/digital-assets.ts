import { z } from 'zod';

import {
  Lsp4AttributeSchema,
  Lsp4ImageSchema,
  Lsp4LinkSchema,
  SortDirectionSchema,
  SortNullsSchema,
} from './common';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/** LSP7 or LSP8 standard — derived by parser from presence of `decimals` field */
export const StandardSchema = z.enum(['LSP7', 'LSP8']);

/**
 * Token type for a digital asset.
 * The indexer stores these as decoded strings directly.
 * - TOKEN: Fungible token (LSP4 tokenType 0)
 * - NFT: Non-fungible token (LSP4 tokenType 1)
 * - COLLECTION: Collection of NFTs (LSP4 tokenType 2)
 */
export const TokenTypeSchema = z.enum(['TOKEN', 'NFT', 'COLLECTION']);

/** Image associated with a digital asset (icon or background image) — alias for shared Lsp4ImageSchema */
export const DigitalAssetImageSchema = Lsp4ImageSchema;

/** External link associated with a digital asset (social media, website, etc.) — alias for shared Lsp4LinkSchema */
export const DigitalAssetLinkSchema = Lsp4LinkSchema;

/** NFT metadata attribute (trait/property) — alias for shared Lsp4AttributeSchema */
export const DigitalAssetAttributeSchema = Lsp4AttributeSchema;

/** Contract owner (controller) of the digital asset */
export const DigitalAssetOwnerSchema = z.object({
  /** Owner contract address */
  address: z.string(),
  /** Timestamp when ownership was last set */
  timestamp: z.string(),
});

/** Full digital asset domain type with all includable fields */
export const DigitalAssetSchema = z.object({
  /** The digital asset contract address (checksummed or lowercase hex) — always present */
  address: z.string(),
  /**
   * Derived standard — LSP7 (fungible) or LSP8 (non-fungible).
   * Parser derives this from presence of the `decimals` field (LSP7 only).
   */
  standard: StandardSchema.nullable(),
  /** Token name from LSP4 metadata, or `null` if not set or not included */
  name: z.string().nullable(),
  /** Token symbol from LSP4 metadata (e.g., "CHILL"), or `null` if not set or not included */
  symbol: z.string().nullable(),
  /**
   * Token type — decoded string stored directly by the indexer.
   * - TOKEN: Fungible token
   * - NFT: Non-fungible token
   * - COLLECTION: Collection of NFTs
   */
  tokenType: TokenTypeSchema.nullable(),
  /** Number of decimal places (LSP7 only), or `null` for LSP8 or if not included */
  decimals: z.number().nullable(),
  /** Total supply of tokens (as string to handle large numbers), or `null` if not included */
  totalSupply: z.string().nullable(),
  /** Description from LSP4 metadata, or `null` if not set or not included */
  description: z.string().nullable(),
  /** Category from LSP4 metadata (free-text), or `null` if not set or not included */
  category: z.string().nullable(),
  /** Icon images from LSP4 metadata, or `null` if not included in query */
  icons: z.array(DigitalAssetImageSchema).nullable(),
  /** Gallery/cover images from LSP4 metadata, or `null` if not included in query */
  images: z.array(DigitalAssetImageSchema).nullable(),
  /** External links from LSP4 metadata, or `null` if not included in query */
  links: z.array(DigitalAssetLinkSchema).nullable(),
  /** NFT metadata attributes/traits, or `null` if not included in query */
  attributes: z.array(DigitalAssetAttributeSchema).nullable(),
  /** Contract owner (controller), or `null` if not included or not set */
  owner: DigitalAssetOwnerSchema.nullable(),
  /** Number of unique token holders, or `null` if not included */
  holderCount: z.number().nullable(),
  /** Number of creators registered on the asset, or `null` if not included */
  creatorCount: z.number().nullable(),
  /** LSP8-only: Reference contract address, or `null` for LSP7 or if not included */
  referenceContract: z.string().nullable(),
  /** LSP8-only: Token ID format identifier, or `null` for LSP7 or if not included */
  tokenIdFormat: z.string().nullable(),
  /** LSP8-only: Base URI for token metadata, or `null` for LSP7 or if not included */
  baseUri: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

/** Filter criteria for digital asset queries */
export const DigitalAssetFilterSchema = z.object({
  /** Case-insensitive partial match on token name */
  name: z.string().optional(),
  /** Case-insensitive partial match on token symbol */
  symbol: z.string().optional(),
  /** Filter by token type */
  tokenType: TokenTypeSchema.optional(),
  /** Case-insensitive partial match on LSP4 metadata category */
  category: z.string().optional(),
  /** Return assets held by the given address (token holder) */
  holderAddress: z.string().optional(),
  /** Return assets owned (controlled) by the given address */
  ownerAddress: z.string().optional(),
});

/** Fields available for sorting digital asset lists */
export const DigitalAssetSortFieldSchema = z.enum([
  'name',
  'symbol',
  'holderCount',
  'creatorCount',
  'totalSupply',
  'createdAt',
]);

export const DigitalAssetSortSchema = z.object({
  /** Which field to sort by */
  field: DigitalAssetSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default (nulls last for asc, nulls first for desc) */
  nulls: SortNullsSchema.optional(),
});

/**
 * Control which nested fields to include in a digital asset query.
 *
 * **Behavior (inverted default):**
 * - When `include` is **omitted** entirely → all fields are fetched (opt-out model).
 *   GraphQL variables default to `true`, so all `@include(if:)` directives pass.
 * - When `include` is **provided** → only fields explicitly set to `true` are included;
 *   unspecified fields default to `false` (opt-in when provided).
 *
 * This is the opposite of the profile include pattern — digital assets default to
 * fetch-everything for a richer out-of-the-box experience.
 *
 * @example
 * ```ts
 * // Fetch everything (default)
 * useDigitalAsset({ address: '0x...' });
 *
 * // Fetch only name, symbol, and token type
 * useDigitalAsset({ address: '0x...', include: { name: true, symbol: true, tokenType: true } });
 * ```
 */
export const DigitalAssetIncludeSchema = z.object({
  /** Include token name */
  name: z.boolean().optional(),
  /** Include token symbol */
  symbol: z.boolean().optional(),
  /** Include token type (TOKEN/NFT/COLLECTION) */
  tokenType: z.boolean().optional(),
  /** Include decimal places (LSP7 only) */
  decimals: z.boolean().optional(),
  /** Include total supply */
  totalSupply: z.boolean().optional(),
  /** Include description from LSP4 metadata */
  description: z.boolean().optional(),
  /** Include category from LSP4 metadata */
  category: z.boolean().optional(),
  /** Include icon images from LSP4 metadata */
  icons: z.boolean().optional(),
  /** Include gallery images from LSP4 metadata */
  images: z.boolean().optional(),
  /** Include external links from LSP4 metadata */
  links: z.boolean().optional(),
  /** Include NFT metadata attributes */
  attributes: z.boolean().optional(),
  /** Include contract owner (controller) */
  owner: z.boolean().optional(),
  /** Include unique holder count aggregate */
  holderCount: z.boolean().optional(),
  /** Include creator count */
  creatorCount: z.boolean().optional(),
  /** Include LSP8 reference contract address */
  referenceContract: z.boolean().optional(),
  /** Include LSP8 token ID format */
  tokenIdFormat: z.boolean().optional(),
  /** Include LSP8 token metadata base URI */
  baseUri: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseDigitalAssetParamsSchema = z.object({
  /** The digital asset contract address to fetch */
  address: z.string(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: DigitalAssetIncludeSchema.optional(),
});

export const UseDigitalAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: DigitalAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: DigitalAssetSortSchema.optional(),
  /** Maximum number of assets to return */
  limit: z.number().optional(),
  /** Number of assets to skip (for offset-based pagination) */
  offset: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: DigitalAssetIncludeSchema.optional(),
});

export const UseInfiniteDigitalAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: DigitalAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: DigitalAssetSortSchema.optional(),
  /** Number of assets per page (default: 20) */
  pageSize: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: DigitalAssetIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type Standard = z.infer<typeof StandardSchema>;
export type TokenType = z.infer<typeof TokenTypeSchema>;
export type DigitalAssetImage = z.infer<typeof DigitalAssetImageSchema>;
export type DigitalAssetLink = z.infer<typeof DigitalAssetLinkSchema>;
export type DigitalAssetAttribute = z.infer<typeof DigitalAssetAttributeSchema>;
export type DigitalAssetOwner = z.infer<typeof DigitalAssetOwnerSchema>;
export type DigitalAsset = z.infer<typeof DigitalAssetSchema>;
export type DigitalAssetFilter = z.infer<typeof DigitalAssetFilterSchema>;
export type DigitalAssetSortField = z.infer<typeof DigitalAssetSortFieldSchema>;
export type DigitalAssetSort = z.infer<typeof DigitalAssetSortSchema>;
export type DigitalAssetInclude = z.infer<typeof DigitalAssetIncludeSchema>;
export type UseDigitalAssetParams = z.infer<typeof UseDigitalAssetParamsSchema>;
export type UseDigitalAssetsParams = z.infer<typeof UseDigitalAssetsParamsSchema>;
export type UseInfiniteDigitalAssetsParams = z.infer<typeof UseInfiniteDigitalAssetsParamsSchema>;
