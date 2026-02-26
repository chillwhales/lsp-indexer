/**
 * Type definitions for LSP1 UniversalReceiver type IDs.
 *
 * @module
 */

import type { ALL_TYPE_IDS } from './constants';

// ---------------------------------------------------------------------------
// TypeIdName — union of built-in names + extensible string
// ---------------------------------------------------------------------------

/**
 * Union type of all built-in LUKSO LSP1 type ID names.
 *
 * Derived from the keys of {@link ALL_TYPE_IDS}. Provides autocomplete in
 * TypeScript for filter fields while still accepting arbitrary strings via
 * `(string & {})` widening.
 *
 * @example
 * ```ts
 * const name: TypeIdName = 'LSP7Tokens_SenderNotification'; // autocomplete works
 * const custom: TypeIdName = 'SomeOtherTypeId'; // also valid (string & {})
 * ```
 */
export type TypeIdName = keyof typeof ALL_TYPE_IDS | (string & {});
