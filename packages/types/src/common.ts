import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared schemas used across multiple domains
// ---------------------------------------------------------------------------

/** Sort direction — shared across all domain sort schemas */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type SortDirection = z.infer<typeof SortDirectionSchema>;
