/**
 * Zod schemas for ERC725Y data key validation.
 *
 * Provides schemas for validating data key names, hex values, and
 * registration entries. Used by `@lsp-indexer/types` for filter schemas.
 *
 * @module
 */

import { z } from 'zod';

import { DATA_KEY_NAMES } from './constants';
import { isKnownDataKeyHex, isKnownDataKeyName } from './registry';

// ---------------------------------------------------------------------------
// Name / hex validation schemas
// ---------------------------------------------------------------------------

/**
 * Zod enum schema for built-in LUKSO LSP data key names.
 *
 * Provides TypeScript autocomplete for the 32 built-in names. Use this
 * in filter schemas where `dataKeyName` should only accept known names.
 *
 * For runtime validation that also accepts custom-registered keys, use
 * {@link KnownDataKeyNameSchema} instead.
 */
export const DataKeyNameSchema = z.enum(DATA_KEY_NAMES);

/**
 * Schema that validates a string is a known data key name (built-in OR custom-registered).
 *
 * Uses `z.string().refine()` to check against the live registry at parse time.
 * Any keys registered via {@link registerDataKey} before parsing will be accepted.
 */
export const KnownDataKeyNameSchema = z.string().refine((val) => isKnownDataKeyName(val), {
  message: 'Unknown data key name — must be a registered ERC725Y key name',
});

/**
 * Schema that validates a string is a known hex data key.
 */
export const KnownDataKeyHexSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, 'Must be a valid hex string starting with 0x')
  .refine((val) => isKnownDataKeyHex(val), {
    message: 'Unknown data key hex — must be a registered ERC725Y data key',
  });

// ---------------------------------------------------------------------------
// Entry schemas — for registration validation
// ---------------------------------------------------------------------------

/**
 * Schema for a single data key entry — the name↔hex pair.
 */
export const DataKeyEntrySchema = z.object({
  /** Human-readable data key name */
  name: z.string().min(1),
  /** Raw hex data key (must start with 0x) */
  hex: z.string().regex(/^0x[0-9a-fA-F]+$/, 'Must be a valid hex string starting with 0x'),
});

/**
 * Schema for bulk data key registration input.
 */
export const DataKeyEntriesSchema = z.array(DataKeyEntrySchema);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** A single data key entry (name↔hex pair) */
export type DataKeyEntry = z.infer<typeof DataKeyEntrySchema>;

/** Array of data key entries for bulk registration */
export type DataKeyEntries = z.infer<typeof DataKeyEntriesSchema>;
