/**
 * @lsp-indexer/data-keys — ERC725Y data key registry.
 *
 * Provides a bidirectional registry between hex ERC725Y data keys and
 * human-readable names. Pre-loaded with all known LUKSO LSP data keys
 * (LSP1–LSP12, LSP17) from official `@lukso/lsp*-contracts` packages.
 *
 * Consumers can register custom data keys via `registerDataKey`:
 *
 * ```ts
 * import { registerDataKey, resolveDataKeyName } from '@lsp-indexer/data-keys';
 *
 * registerDataKey('MyCustomKey', '0xabcd...');
 * resolveDataKeyName('0xabcd...'); // → 'MyCustomKey'
 * ```
 *
 * @module
 */

import { z } from 'zod';

import { LSP1DataKeys } from '@lukso/lsp1-contracts';
import { LSP10DataKeys } from '@lukso/lsp10-contracts';
import { LSP12DataKeys } from '@lukso/lsp12-contracts';
import { LSP17DataKeys } from '@lukso/lsp17contractextension-contracts';
import { LSP3DataKeys } from '@lukso/lsp3-contracts';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { LSP5DataKeys } from '@lukso/lsp5-contracts';
import { LSP6DataKeys } from '@lukso/lsp6-contracts';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { LSP9DataKeys } from '@lukso/lsp9-contracts';

// ---------------------------------------------------------------------------
// Internal registry — bidirectional maps
// ---------------------------------------------------------------------------

/** Reverse map: lowercase hex → human-readable name */
const HEX_TO_NAME = new Map<string, string>();

/** Forward map: lowercase name → lowercase hex data key */
const NAME_TO_HEX = new Map<string, string>();

/**
 * All LUKSO LSP data key sources grouped by standard.
 *
 * Each value is a `Record<string, string | { length: string; index: string }>`
 * mapping human-readable names to hex data key values. Array keys have
 * nested `{ length, index }` objects — we extract both sub-keys.
 */
const ALL_DATA_KEY_SOURCES: Record<string, Record<string, unknown>> = {
  LSP1: LSP1DataKeys,
  LSP3: LSP3DataKeys,
  LSP4: LSP4DataKeys,
  LSP5: LSP5DataKeys,
  LSP6: LSP6DataKeys,
  LSP8: LSP8DataKeys,
  LSP9: LSP9DataKeys,
  LSP10: LSP10DataKeys,
  LSP12: LSP12DataKeys,
  LSP17: LSP17DataKeys,
};

// Populate maps from LUKSO contract packages at module load time
for (const [_prefix, keys] of Object.entries(ALL_DATA_KEY_SOURCES)) {
  for (const [name, value] of Object.entries(keys)) {
    if (typeof value === 'string' && value.startsWith('0x')) {
      // Simple hex key (e.g., LSP3Profile → '0x5ef8...')
      HEX_TO_NAME.set(value.toLowerCase(), name);
      NAME_TO_HEX.set(name.toLowerCase(), value.toLowerCase());
    } else if (
      typeof value === 'object' &&
      value != null &&
      'length' in value &&
      'index' in value
    ) {
      // Array key with { length, index } sub-keys (e.g., LSP4Creators[])
      if (typeof value.length === 'string' && value.length.startsWith('0x')) {
        HEX_TO_NAME.set(value.length.toLowerCase(), `${name}.length`);
        NAME_TO_HEX.set(`${name}.length`.toLowerCase(), value.length.toLowerCase());
      }
      if (typeof value.index === 'string' && value.index.startsWith('0x')) {
        HEX_TO_NAME.set(value.index.toLowerCase(), `${name}.index`);
        NAME_TO_HEX.set(`${name}.index`.toLowerCase(), value.index.toLowerCase());
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Registration — add custom data keys at runtime
// ---------------------------------------------------------------------------

/**
 * Register a custom ERC725Y data key.
 *
 * Adds a bidirectional mapping between a human-readable name and a hex data key.
 * Both directions (name→hex and hex→name) are registered. Lookups are
 * case-insensitive. If the name or hex already exists, it is overwritten.
 *
 * @param name - Human-readable data key name (e.g., 'MyAppSettings')
 * @param hex - Raw hex data key (e.g., '0xabcd1234...')
 *
 * @example
 * ```ts
 * import { registerDataKey, resolveDataKeyName } from '@lsp-indexer/data-keys';
 *
 * registerDataKey('MyAppSettings', '0xabcd1234...');
 * resolveDataKeyName('0xabcd1234...'); // → 'MyAppSettings'
 * ```
 */
export function registerDataKey(name: string, hex: string): void {
  HEX_TO_NAME.set(hex.toLowerCase(), name);
  NAME_TO_HEX.set(name.toLowerCase(), hex.toLowerCase());
}

/**
 * Register multiple custom ERC725Y data keys at once.
 *
 * Convenience wrapper around `registerDataKey` for bulk registration.
 *
 * @param entries - Array of `[name, hex]` tuples or an object mapping names to hex keys
 *
 * @example
 * ```ts
 * import { registerDataKeys } from '@lsp-indexer/data-keys';
 *
 * // Array form
 * registerDataKeys([
 *   ['MyAppSettings', '0xabcd...'],
 *   ['MyAppPermissions', '0x1234...'],
 * ]);
 *
 * // Object form
 * registerDataKeys({
 *   MyAppSettings: '0xabcd...',
 *   MyAppPermissions: '0x1234...',
 * });
 * ```
 */
export function registerDataKeys(
  entries: [name: string, hex: string][] | Record<string, string>,
): void {
  const pairs = Array.isArray(entries) ? entries : Object.entries(entries);
  for (const [name, hex] of pairs) {
    registerDataKey(name, hex);
  }
}

// ---------------------------------------------------------------------------
// Resolution — lookup data keys by name or hex
// ---------------------------------------------------------------------------

/**
 * Resolve a raw hex ERC725Y data key to its human-readable name.
 *
 * Uses the internal registry (pre-loaded with LUKSO LSP keys + any custom
 * keys added via `registerDataKey`). Case-insensitive.
 *
 * @param hex - Raw hex data key (e.g., '0x5ef83ad9...')
 * @returns Human-readable name (e.g., 'LSP3Profile') or `null` if unknown
 *
 * @example
 * ```ts
 * resolveDataKeyName('0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5');
 * // → 'LSP3Profile'
 *
 * resolveDataKeyName('0x000000000000unknown');
 * // → null
 * ```
 */
export function resolveDataKeyName(hex: string): string | null {
  return HEX_TO_NAME.get(hex.toLowerCase()) ?? null;
}

/**
 * Resolve a human-readable ERC725Y data key name to its raw hex value.
 *
 * Uses the internal registry (pre-loaded with LUKSO LSP keys + any custom
 * keys added via `registerDataKey`). Case-insensitive.
 *
 * @param name - Human-readable data key name (e.g., 'LSP3Profile')
 * @returns Hex data key (e.g., '0x5ef83ad9...') or `null` if unknown
 *
 * @example
 * ```ts
 * resolveDataKeyHex('LSP3Profile');
 * // → '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
 *
 * resolveDataKeyHex('UnknownKey');
 * // → null
 * ```
 */
export function resolveDataKeyHex(name: string): string | null {
  return NAME_TO_HEX.get(name.toLowerCase()) ?? null;
}

// ---------------------------------------------------------------------------
// Existence checks
// ---------------------------------------------------------------------------

/**
 * Check whether a human-readable data key name is registered.
 *
 * @param name - Human-readable data key name
 * @returns `true` if the name is known (LUKSO LSP or custom-registered)
 */
export function isKnownDataKeyName(name: string): boolean {
  return NAME_TO_HEX.has(name.toLowerCase());
}

/**
 * Check whether a hex data key is registered.
 *
 * @param hex - Raw hex data key
 * @returns `true` if the hex key is known (LUKSO LSP or custom-registered)
 */
export function isKnownDataKeyHex(hex: string): boolean {
  return HEX_TO_NAME.has(hex.toLowerCase());
}

// ---------------------------------------------------------------------------
// Enumeration — list all known data keys
// ---------------------------------------------------------------------------

/**
 * Get all registered human-readable data key names.
 *
 * Returns names in their original casing (as registered). Includes both
 * LUKSO LSP built-in names and any custom-registered names.
 *
 * @returns Array of known data key names (e.g., `['LSP3Profile', 'LSP4TokenName', ...]`)
 */
export function getKnownDataKeyNames(): string[] {
  return [...HEX_TO_NAME.values()];
}

/**
 * Get all registered hex data keys.
 *
 * @returns Array of known hex data keys (lowercase)
 */
export function getKnownDataKeyHexes(): string[] {
  return [...HEX_TO_NAME.keys()];
}

/**
 * Get the total number of registered data keys.
 *
 * @returns Count of known data key entries
 */
export function getDataKeyCount(): number {
  return HEX_TO_NAME.size;
}

/**
 * Get all registered data keys as `[hex, name]` pairs.
 *
 * @returns Array of `[hex, name]` tuples
 */
export function getDataKeyEntries(): [hex: string, name: string][] {
  return [...HEX_TO_NAME.entries()];
}

// ---------------------------------------------------------------------------
// Schemas — Zod schemas for validation
// ---------------------------------------------------------------------------

/**
 * Schema for a single data key entry — the name↔hex pair.
 *
 * @example
 * ```ts
 * const entry = DataKeyEntrySchema.parse({
 *   name: 'LSP3Profile',
 *   hex: '0x5ef83ad9...',
 * });
 * ```
 */
export const DataKeyEntrySchema = z.object({
  /** Human-readable data key name */
  name: z.string().min(1),
  /** Raw hex data key (must start with 0x) */
  hex: z.string().regex(/^0x[0-9a-fA-F]+$/, 'Must be a valid hex string starting with 0x'),
});

/**
 * Schema for bulk data key registration input.
 *
 * Accepts an array of `{ name, hex }` entries for validation before
 * passing to `registerDataKey`.
 */
export const DataKeyEntriesSchema = z.array(DataKeyEntrySchema);

/**
 * Schema that validates a string is a known data key name.
 *
 * Uses `z.string().refine()` to check against the live registry.
 * Validation runs against the registry at parse time — any keys
 * registered via `registerDataKey` before parsing will be accepted.
 *
 * @example
 * ```ts
 * import { KnownDataKeyNameSchema } from '@lsp-indexer/data-keys';
 *
 * KnownDataKeyNameSchema.parse('LSP3Profile'); // ✓
 * KnownDataKeyNameSchema.parse('FooBar');       // throws ZodError
 * ```
 */
export const KnownDataKeyNameSchema = z.string().refine((val) => isKnownDataKeyName(val), {
  message: 'Unknown data key name — must be a registered ERC725Y key name',
});

/**
 * Schema that validates a string is a known hex data key.
 *
 * @example
 * ```ts
 * import { KnownDataKeyHexSchema } from '@lsp-indexer/data-keys';
 *
 * KnownDataKeyHexSchema.parse('0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'); // ✓
 * KnownDataKeyHexSchema.parse('0xdeadbeef'); // throws ZodError
 * ```
 */
export const KnownDataKeyHexSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, 'Must be a valid hex string starting with 0x')
  .refine((val) => isKnownDataKeyHex(val), {
    message: 'Unknown data key hex — must be a registered ERC725Y data key',
  });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single data key entry (name↔hex pair) */
export type DataKeyEntry = z.infer<typeof DataKeyEntrySchema>;

/** Array of data key entries for bulk registration */
export type DataKeyEntries = z.infer<typeof DataKeyEntriesSchema>;
