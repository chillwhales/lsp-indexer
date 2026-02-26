/**
 * @lsp-indexer/lsp1 — LSP1 UniversalReceiver type ID registry.
 *
 * A self-contained read-only registry mapping bytes32 LSP1 type ID hashes
 * to human-readable names. Derived from official `@lukso/lsp*-contracts`
 * packages (LSP0, LSP7, LSP8, LSP9, LSP14, LSP26).
 *
 * ```ts
 * import { resolveTypeIdName, resolveTypeIdHex } from '@lsp-indexer/lsp1';
 *
 * resolveTypeIdName('0x429ac7a0...'); // → 'LSP7Tokens_SenderNotification'
 * resolveTypeIdHex('LSP7Tokens_SenderNotification'); // → '0x429ac7a0...'
 * ```
 *
 * @module
 */

export * from './constants';
export * from './registry';
export * from './schemas';
export * from './types';
