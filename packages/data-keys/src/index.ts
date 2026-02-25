/**
 * @lsp-indexer/data-keys — ERC725Y data key registry.
 *
 * A self-contained bidirectional registry between hex ERC725Y data keys and
 * human-readable names. Pre-loaded with all known LUKSO LSP data keys
 * (LSP1–LSP12, LSP17). Zero external dependencies beyond zod for schemas.
 *
 * Consumers can register custom data keys via {@link registerDataKey}:
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

export * from './constants';
export * from './registry';
export * from './schemas';
export * from './types';
