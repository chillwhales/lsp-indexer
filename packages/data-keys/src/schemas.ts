/**
 * Zod schemas for ERC725Y data key validation.
 *
 * Provides the {@link DataKeyNameSchema} enum schema used by
 * `@lsp-indexer/types` for filter schemas.
 *
 * @module
 */

import { z } from 'zod';

import { DATA_KEY_NAMES } from './constants';

// ---------------------------------------------------------------------------
// Name validation schema
// ---------------------------------------------------------------------------

/**
 * Zod enum schema for built-in LUKSO LSP data key names.
 *
 * Provides TypeScript autocomplete for the 32 built-in names. Used in
 * filter schemas where `dataKeyName` should only accept known names.
 */
export const DataKeyNameSchema = z.enum(DATA_KEY_NAMES);
