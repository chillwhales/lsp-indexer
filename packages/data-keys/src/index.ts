/**
 * @lsp-indexer/data-keys — ERC725Y data key registry.
 *
 * A self-contained read-only registry mapping hex ERC725Y data keys to
 * human-readable names. Pre-loaded with all known LUKSO LSP data keys
 * (LSP1–LSP12, LSP17). Zero external dependencies beyond zod for schemas.
 *
 * ```ts
 * import { resolveDataKeyName, resolveDataKeyHex } from '@lsp-indexer/data-keys';
 *
 * resolveDataKeyName('0x5ef83ad9...'); // → 'LSP3Profile'
 * resolveDataKeyHex('LSP3Profile');    // → '0x5ef83ad9...'
 * ```
 *
 * @module
 */

export * from './constants';
export * from './registry';
export * from './schemas';
export * from './types';
