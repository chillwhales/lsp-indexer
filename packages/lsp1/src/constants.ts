/**
 * Built-in LUKSO LSP1 UniversalReceiver type ID constants.
 *
 * Derived from official `@lukso/lsp*-contracts` packages — no hardcoded
 * hex values. The merged {@link ALL_TYPE_IDS} record is the single source
 * of truth; {@link TYPE_ID_NAMES} and {@link BUILT_IN_TYPE_IDS} are
 * computed from it.
 *
 * @see https://docs.lukso.tech/standards/event-reference#common-typeids-for-universalreceiver
 * @module
 */

import { LSP0_TYPE_IDS } from '@lukso/lsp0-contracts';
import { LSP14_TYPE_IDS } from '@lukso/lsp14-contracts';
import { LSP26_TYPE_IDS } from '@lukso/lsp26-contracts';
import { LSP7_TYPE_IDS } from '@lukso/lsp7-contracts';
import { LSP8_TYPE_IDS } from '@lukso/lsp8-contracts';
import { LSP9_TYPE_IDS } from '@lukso/lsp9-contracts';

// ---------------------------------------------------------------------------
// Merged record — single source of truth
// ---------------------------------------------------------------------------

/**
 * All known LUKSO LSP1 type IDs merged into a single `{ name: hex }` record.
 *
 * Sourced from `@lukso/lsp{0,7,8,9,14,26}-contracts`.
 */
export const ALL_TYPE_IDS = {
  ...LSP0_TYPE_IDS,
  ...LSP7_TYPE_IDS,
  ...LSP8_TYPE_IDS,
  ...LSP9_TYPE_IDS,
  ...LSP14_TYPE_IDS,
  ...LSP26_TYPE_IDS,
} as const;

// ---------------------------------------------------------------------------
// Derived — name tuple (for z.enum + TypeIdName union)
// ---------------------------------------------------------------------------

/**
 * All built-in LUKSO LSP1 type ID names as a non-empty tuple.
 *
 * Derived from {@link ALL_TYPE_IDS} keys. Used by `z.enum()` (requires
 * `[string, ...string[]]`) and the {@link TypeIdName} union type.
 */
export const TYPE_ID_NAMES = Object.keys(ALL_TYPE_IDS) as [
  keyof typeof ALL_TYPE_IDS,
  ...(keyof typeof ALL_TYPE_IDS)[],
];

// ---------------------------------------------------------------------------
// Derived — name→hex pairs (for registry population)
// ---------------------------------------------------------------------------

/**
 * Built-in `[name, hex]` pairs derived from {@link ALL_TYPE_IDS}.
 *
 * Used by the registry module to populate bidirectional lookup maps.
 */
export const BUILT_IN_TYPE_IDS: ReadonlyArray<readonly [name: string, hex: string]> =
  Object.entries(ALL_TYPE_IDS);

// ---------------------------------------------------------------------------
// Re-exports — per-LSP access
// ---------------------------------------------------------------------------

export {
  LSP0_TYPE_IDS,
  LSP14_TYPE_IDS,
  LSP26_TYPE_IDS,
  LSP7_TYPE_IDS,
  LSP8_TYPE_IDS,
  LSP9_TYPE_IDS,
};
