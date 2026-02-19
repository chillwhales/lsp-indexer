import { z } from 'zod';

import { SortDirectionSchema } from './profiles';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

export const CreatorSchema = z.object({
  /** Digital asset contract address */
  assetAddress: z.string(),
  /** Universal Profile address of the creator */
  creatorAddress: z.string(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const CreatorFilterSchema = z.object({
  /** Filter by digital asset contract address (case-insensitive) */
  assetAddress: z.string().optional(),
  /** Filter by creator UP address (case-insensitive) */
  creatorAddress: z.string().optional(),
});

/** Fields available for sorting creator lists */
export const CreatorSortFieldSchema = z.enum(['assetAddress', 'creatorAddress']);

export const CreatorSortSchema = z.object({
  /** Which field to sort by */
  field: CreatorSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseCreatorAddressesParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: CreatorFilterSchema.optional(),
  /** Sort order for results */
  sort: CreatorSortSchema.optional(),
  /** Maximum number of creators to return */
  limit: z.number().optional(),
  /** Number of creators to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteCreatorAddressesParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: CreatorFilterSchema.optional(),
  /** Sort order for results */
  sort: CreatorSortSchema.optional(),
  /** Number of creators per page (default: 20) */
  pageSize: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type Creator = z.infer<typeof CreatorSchema>;
export type CreatorFilter = z.infer<typeof CreatorFilterSchema>;
export type CreatorSort = z.infer<typeof CreatorSortSchema>;
export type CreatorSortField = z.infer<typeof CreatorSortFieldSchema>;
export type UseCreatorAddressesParams = z.infer<typeof UseCreatorAddressesParamsSchema>;
export type UseInfiniteCreatorAddressesParams = z.infer<
  typeof UseInfiniteCreatorAddressesParamsSchema
>;
