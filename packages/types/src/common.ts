import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared schemas used across multiple domains
// ---------------------------------------------------------------------------

/** Sort direction — shared across all domain sort schemas */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/** Null ordering — controls where null values appear in sort results */
export const SortNullsSchema = z.enum(['first', 'last']);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type SortDirection = z.infer<typeof SortDirectionSchema>;
export type SortNulls = z.infer<typeof SortNullsSchema>;
