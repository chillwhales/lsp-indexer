import { z } from 'zod';

import { SortDirectionSchema, SortNullsSchema } from './common';
import {
  DigitalAssetIncludeSchema,
  DigitalAssetSchema,
  type DigitalAssetInclude,
  type DigitalAssetResult,
} from './digital-assets';
import type { IncludeResult } from './include-types';
import { NftIncludeSchema, NftSchema, type Nft } from './nfts';
import { OwnedAssetSchema, type OwnedAsset } from './owned-assets';
import {
  ProfileIncludeSchema,
  ProfileSchema,
  type ProfileInclude,
  type ProfileResult,
} from './profiles';

/**
 * NFT sub-include schema for the owned-token context.
 *
 * Omits `collection` and `holder` because those are sibling relations on
 * owned_token itself (digitalAsset / universalProfile), not nested within
 * the NFT block. The 8 remaining fields control which NFT metadata to fetch.
 */
export const OwnedTokenNftIncludeSchema = NftIncludeSchema.omit({
  collection: true,
  holder: true,
});

/**
 * Owned Asset sub-include schema for the owned-token context.
 *
 * Controls which fields of the parent owned_asset record to fetch.
 * Only includes the direct scalar fields — nested relations (digitalAsset,
 * holder, tokenIdCount) are not available in this sub-selection context
 * because they are sibling relations on the owned_token itself.
 */
export const OwnedTokenOwnedAssetIncludeSchema = z.object({
  /** Include token balance (bigint) */
  balance: z.boolean().optional(),
  /** Include block number */
  block: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/**
 * Owned Token — represents LSP8 individual NFT ownership.
 *
 * Each record represents which specific token (identified by token_id) an
 * address holds within a particular collection.
 *
 * Fields renamed for developer clarity:
 * - `digitalAssetAddress` (Hasura: `address`) — the asset contract address
 * - `holderAddress` (Hasura: `owner`) — the holder's address
 * - `holder` (Hasura: `universalProfile`) — the holder's profile
 */
export const OwnedTokenSchema = z.object({
  /** Unique identifier */
  id: z.string(),
  /** Asset contract address (Hasura column: address) */
  digitalAssetAddress: z.string(),
  /** Holder address (Hasura column: owner) */
  holderAddress: z.string(),
  /** Specific token ID within the collection */
  tokenId: z.string(),
  /** Block number when this ownership was last updated (null when excluded via include) */
  block: z.number().nullable(),
  /** Timestamp when this ownership was last updated — ISO string (null when excluded via include) */
  timestamp: z.string().nullable(),
  /** Related digital asset (null = not included) */
  digitalAsset: DigitalAssetSchema.nullable(),
  /** Related NFT details (null = not included) */
  nft: NftSchema.nullable(),
  /** Related owned asset (parent fungible ownership record, null = not included) */
  ownedAsset: OwnedAssetSchema.nullable(),
  /** Related holder's universal profile details (null = not included in query) */
  holder: ProfileSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

/**
 * Filter criteria for owned token queries.
 *
 * All string fields use case-insensitive `_ilike` matching at the service layer.
 * Name filters use nested relation filtering through Hasura.
 */
export const OwnedTokenFilterSchema = z.object({
  /** Case-insensitive match on holder address (Hasura column: owner) */
  holderAddress: z.string().optional(),
  /** Case-insensitive match on asset contract address (Hasura column: address) */
  digitalAssetAddress: z.string().optional(),
  /** Case-insensitive match on token ID */
  tokenId: z.string().optional(),
  /** Case-insensitive match on the holder's profile name (via universalProfile.lsp3Profile.name) */
  holderName: z.string().optional(),
  /** Case-insensitive match on the digital asset's token name (via digitalAsset.lsp4TokenName) */
  assetName: z.string().optional(),
  /** Case-insensitive match on the NFT's name (via nft.lsp4Metadata.name or nft.lsp4MetadataBaseUri.name) */
  tokenName: z.string().optional(),
});

/** Fields available for sorting owned token lists */
export const OwnedTokenSortFieldSchema = z.enum([
  'digitalAssetAddress',
  'block',
  'holderAddress',
  'timestamp',
  'tokenId',
]);

export const OwnedTokenSortSchema = z.object({
  /** Which field to sort by */
  field: OwnedTokenSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

/**
 * Control which fields to include in an owned token query.
 *
 * **Behavior (inverted default):**
 * - When `include` is **omitted** entirely → all fields are fetched (opt-out model).
 *   GraphQL variables default to `true`, so all `@include(if:)` directives pass.
 * - When `include` is **provided** → only fields explicitly set/provided are included;
 *   unspecified fields default to `false` (opt-in when provided).
 *
 * The `digitalAsset` field accepts a `DigitalAssetIncludeSchema` for nested 17-field
 * sub-includes — controlling exactly which digital asset attributes to fetch.
 *
 * The `nft` field accepts an `OwnedTokenNftIncludeSchema` (NftInclude minus collection/holder)
 * for nested 8-field sub-includes — controlling exactly which NFT metadata to fetch.
 */
export const OwnedTokenIncludeSchema = z.object({
  /** Include block number */
  block: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include related digital asset details — sub-fields control which DA attributes to fetch */
  digitalAsset: DigitalAssetIncludeSchema.optional(),
  /** Include related NFT details — sub-fields control which NFT metadata to fetch */
  nft: OwnedTokenNftIncludeSchema.optional(),
  /** Include related owned asset — sub-fields control which owned asset attributes to fetch */
  ownedAsset: OwnedTokenOwnedAssetIncludeSchema.optional(),
  /** Include related holder profile details — sub-fields control which profile attributes to fetch */
  holder: ProfileIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

/** Parameters for useOwnedToken — single owned token by unique ID */
export const UseOwnedTokenParamsSchema = z.object({
  /** Owned token unique ID */
  id: z.string(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: OwnedTokenIncludeSchema.optional(),
});

/** Parameters for useOwnedTokens — paginated list with filters and sorting */
export const UseOwnedTokensParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedTokenFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedTokenSortSchema.optional(),
  /** Maximum number of owned tokens to return */
  limit: z.number().optional(),
  /** Number of owned tokens to skip (for offset-based pagination) */
  offset: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: OwnedTokenIncludeSchema.optional(),
});

/** Parameters for useInfiniteOwnedTokens — infinite scroll with filters and sorting */
export const UseInfiniteOwnedTokensParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedTokenFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedTokenSortSchema.optional(),
  /** Number of owned tokens per page (default: 20) */
  pageSize: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: OwnedTokenIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type OwnedToken = z.infer<typeof OwnedTokenSchema>;
export type OwnedTokenFilter = z.infer<typeof OwnedTokenFilterSchema>;
export type OwnedTokenSortField = z.infer<typeof OwnedTokenSortFieldSchema>;
export type OwnedTokenSort = z.infer<typeof OwnedTokenSortSchema>;
export type OwnedTokenInclude = z.infer<typeof OwnedTokenIncludeSchema>;
export type OwnedTokenNftInclude = z.infer<typeof OwnedTokenNftIncludeSchema>;
export type OwnedTokenOwnedAssetInclude = z.infer<typeof OwnedTokenOwnedAssetIncludeSchema>;
export type UseOwnedTokenParams = z.infer<typeof UseOwnedTokenParamsSchema>;
export type UseOwnedTokensParams = z.infer<typeof UseOwnedTokensParamsSchema>;
export type UseInfiniteOwnedTokensParams = z.infer<typeof UseInfiniteOwnedTokensParamsSchema>;

// ---------------------------------------------------------------------------
// Conditional include result type
// ---------------------------------------------------------------------------

/**
 * Scalar include fields (non-relation): include schema key → OwnedToken field name.
 * Relations (digitalAsset, nft, ownedAsset, holder) are handled separately by resolver types.
 */
type OwnedTokenScalarIncludeFieldMap = {
  block: 'block';
  timestamp: 'timestamp';
};

/**
 * Resolve the nested `digitalAsset` relation based on the include parameter.
 *
 * When `include` has `digitalAsset` as a `DigitalAssetInclude` object, the digitalAsset
 * field is present and narrowed by the sub-include. Otherwise, it's absent from the type.
 */
type ResolveOwnedTokenDA<I> = I extends { digitalAsset: infer C }
  ? C extends DigitalAssetInclude
    ? { digitalAsset: DigitalAssetResult<C> | null }
    : {}
  : {};

/**
 * Scalar field map for the NFT sub-include within OwnedToken context.
 *
 * OwnedTokenNftInclude has 8 fields (NftInclude minus collection/holder — those
 * are sibling relations on owned_token, not nested within the NFT block).
 */
type OwnedTokenNftScalarFieldMap = {
  formattedTokenId: 'formattedTokenId';
  name: 'name';
  description: 'description';
  category: 'category';
  icons: 'icons';
  images: 'images';
  links: 'links';
  attributes: 'attributes';
};

/**
 * Resolve the nested `nft` relation based on the include parameter.
 *
 * When `include` has `nft` as an `OwnedTokenNftInclude` object, the nft field is
 * present and narrowed using `IncludeResult` with NFT base fields + the 8 scalar
 * sub-include fields. Otherwise, it's absent from the type.
 */
type ResolveOwnedTokenNft<I> = I extends { nft: infer N }
  ? N extends OwnedTokenNftInclude
    ? {
        nft: IncludeResult<
          Nft,
          'address' | 'tokenId' | 'isBurned' | 'isMinted',
          OwnedTokenNftScalarFieldMap,
          N
        > | null;
      }
    : {}
  : {};

/**
 * Scalar field map for the OwnedAsset sub-include within OwnedToken context.
 *
 * OwnedTokenOwnedAssetInclude has 3 scalar fields only — nested relations
 * (digitalAsset, holder, tokenIdCount) are not available in the owned_token
 * sub-selection context because they are sibling relations on owned_token itself.
 */
type OwnedTokenOwnedAssetFieldMap = {
  balance: 'balance';
  block: 'block';
  timestamp: 'timestamp';
};

/**
 * Resolve the nested `ownedAsset` relation based on the include parameter.
 *
 * When `include` has `ownedAsset` as an `OwnedTokenOwnedAssetInclude` object,
 * the ownedAsset field is present and narrowed using `IncludeResult` with
 * OwnedAsset base fields + the 3 scalar sub-include fields.
 */
type ResolveOwnedTokenOA<I> = I extends { ownedAsset: infer O }
  ? O extends OwnedTokenOwnedAssetInclude
    ? {
        ownedAsset: IncludeResult<
          OwnedAsset,
          'id' | 'digitalAssetAddress' | 'holderAddress',
          OwnedTokenOwnedAssetFieldMap,
          O
        > | null;
      }
    : {}
  : {};

/**
 * Resolve the nested `holder` relation based on the include parameter.
 *
 * When `include` has `holder` as a `ProfileInclude` object, the holder field is
 * present with narrowed profile fields. Otherwise, it's absent from the type.
 *
 * OwnedToken holder is a plain Profile (no timestamp merge like NftHolder).
 */
type ResolveOwnedTokenHolder<I> = I extends { holder: infer H }
  ? H extends ProfileInclude
    ? { holder: ProfileResult<H> | null }
    : {}
  : {};

/**
 * OwnedToken type narrowed by include parameter.
 *
 * The most complex domain type — 4 nested relations each with their own narrowing:
 * - `digitalAsset` → `DigitalAssetResult<C>`
 * - `nft` → `IncludeResult<Nft, base, OwnedTokenNftScalarFieldMap, N>` (8 fields, no collection/holder)
 * - `ownedAsset` → `IncludeResult<OwnedAsset, base, OwnedTokenOwnedAssetFieldMap, O>` (3 scalar fields)
 * - `holder` → `ProfileResult<H>`
 *
 * - `OwnedTokenResult` (no generic) → full `OwnedToken` type (backward compatible)
 * - `OwnedTokenResult<{}>` → `{ id; digitalAssetAddress; holderAddress; tokenId }` (base fields only)
 * - `OwnedTokenResult<{ digitalAsset: { name: true } }>` → base + narrowed digitalAsset
 * - `OwnedTokenResult<{ nft: { name: true } }>` → base + narrowed nft (no collection/holder)
 * - `OwnedTokenResult<{ ownedAsset: { balance: true } }>` → base + narrowed ownedAsset
 * - `OwnedTokenResult<{ holder: { name: true } }>` → base + narrowed holder
 *
 * @example
 * ```ts
 * type Full = OwnedTokenResult;                                             // = OwnedToken (all fields)
 * type Minimal = OwnedTokenResult<{}>;                                      // = { id; digitalAssetAddress; holderAddress; tokenId }
 * type WithDA = OwnedTokenResult<{ digitalAsset: { name: true } }>;         // = base + { digitalAsset: { address; name } | null }
 * type WithNft = OwnedTokenResult<{ nft: { name: true } }>;                 // = base + { nft: { address; tokenId; isBurned; isMinted; name } | null }
 * type WithOA = OwnedTokenResult<{ ownedAsset: { balance: true } }>;        // = base + { ownedAsset: { id; digitalAssetAddress; holderAddress; balance } | null }
 * type WithHolder = OwnedTokenResult<{ holder: { name: true } }>;           // = base + { holder: { address; name } | null }
 * ```
 */
export type OwnedTokenResult<I extends OwnedTokenInclude | undefined = undefined> =
  I extends undefined
    ? OwnedToken
    : IncludeResult<
        OwnedToken,
        'id' | 'digitalAssetAddress' | 'holderAddress' | 'tokenId',
        OwnedTokenScalarIncludeFieldMap,
        I
      > &
        ResolveOwnedTokenDA<NonNullable<I>> &
        ResolveOwnedTokenNft<NonNullable<I>> &
        ResolveOwnedTokenOA<NonNullable<I>> &
        ResolveOwnedTokenHolder<NonNullable<I>>;
