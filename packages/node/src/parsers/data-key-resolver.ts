/**
 * ERC725Y data key name resolver.
 *
 * Builds bidirectional maps between hex data keys and human-readable names
 * using official LUKSO contract packages. Both maps are built once at
 * module load time.
 *
 * @example
 * resolveDataKeyName('0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5')
 * // → 'LSP3Profile'
 *
 * resolveDataKeyHex('LSP3Profile')
 * // → '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
 *
 * @module
 */

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

/**
 * All LUKSO LSP data key sources grouped by standard.
 *
 * Each value is a Record<string, string | { length: string; index: string }>
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

// Build reverse map: lowercase hex → human-readable name
const DATA_KEY_MAP = new Map<string, string>();

for (const [_prefix, keys] of Object.entries(ALL_DATA_KEY_SOURCES)) {
  for (const [name, value] of Object.entries(keys)) {
    if (typeof value === 'string' && value.startsWith('0x')) {
      // Simple hex key (e.g., LSP3Profile → '0x5ef8...')
      DATA_KEY_MAP.set(value.toLowerCase(), name);
    } else if (
      typeof value === 'object' &&
      value != null &&
      'length' in value &&
      'index' in value
    ) {
      // Array key with { length, index } sub-keys (e.g., LSP4Creators[])
      if (typeof value.length === 'string' && value.length.startsWith('0x')) {
        DATA_KEY_MAP.set(value.length.toLowerCase(), `${name}.length`);
      }
      if (typeof value.index === 'string' && value.index.startsWith('0x')) {
        DATA_KEY_MAP.set(value.index.toLowerCase(), `${name}.index`);
      }
    }
  }
}

// Build forward map: lowercase name → hex data key
const NAME_TO_HEX_MAP = new Map<string, string>();

for (const [_prefix, keys] of Object.entries(ALL_DATA_KEY_SOURCES)) {
  for (const [name, value] of Object.entries(keys)) {
    if (typeof value === 'string' && value.startsWith('0x')) {
      NAME_TO_HEX_MAP.set(name.toLowerCase(), value.toLowerCase());
    } else if (
      typeof value === 'object' &&
      value != null &&
      'length' in value &&
      'index' in value
    ) {
      if (typeof value.length === 'string' && value.length.startsWith('0x')) {
        NAME_TO_HEX_MAP.set(`${name}.length`.toLowerCase(), value.length.toLowerCase());
      }
      if (typeof value.index === 'string' && value.index.startsWith('0x')) {
        NAME_TO_HEX_MAP.set(`${name}.index`.toLowerCase(), value.index.toLowerCase());
      }
    }
  }
}

/**
 * Resolve a raw hex ERC725Y data key to its human-readable name.
 *
 * Uses a pre-built reverse map from all known LUKSO LSP data keys.
 * Returns null for unknown keys.
 *
 * @param hexKey - Raw hex data key (e.g., '0x5ef83ad9...')
 * @returns Human-readable name (e.g., 'LSP3Profile') or null
 */
export function resolveDataKeyName(hexKey: string): string | null {
  return DATA_KEY_MAP.get(hexKey.toLowerCase()) ?? null;
}

/**
 * Resolve a human-readable ERC725Y data key name to its raw hex value.
 *
 * Uses a pre-built forward map from all known LUKSO LSP data keys.
 * Case-insensitive lookup. Returns null for unknown names.
 *
 * @param name - Human-readable data key name (e.g., 'LSP3Profile')
 * @returns Hex data key (e.g., '0x5ef83ad9...') or null
 *
 * @example
 * resolveDataKeyHex('LSP3Profile')
 * // → '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
 *
 * resolveDataKeyHex('UnknownKey')
 * // → null
 */
export function resolveDataKeyHex(name: string): string | null {
  return NAME_TO_HEX_MAP.get(name.toLowerCase()) ?? null;
}
