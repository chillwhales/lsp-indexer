/**
 * Type definitions for the data-keys package.
 *
 * @module
 */

import type { DATA_KEY_NAMES } from './constants';

// ---------------------------------------------------------------------------
// DataKeyName — union of built-in names + extensible string
// ---------------------------------------------------------------------------

/**
 * Union type of all built-in LUKSO LSP data key names.
 *
 * Provides autocomplete in TypeScript for filter fields while still
 * accepting arbitrary strings via `(string & {})` widening.
 *
 * @example
 * ```ts
 * const name: DataKeyName = 'LSP3Profile'; // autocomplete works
 * const custom: DataKeyName = 'SomeOtherKey'; // also valid (string & {})
 * ```
 */
export type DataKeyName = (typeof DATA_KEY_NAMES)[number] | (string & {});
