/**
 * Entity type map — single source of truth for bag-key → entity-type mappings.
 *
 * Maps BatchContext entity bag keys (string literals) to their concrete TypeORM
 * entity types. This eliminates scattered `as Map<string, T>` casts throughout
 * handlers by centralizing the one cast into `getTypedEntities()`.
 *
 * When adding a new event plugin or handler that introduces a new bag key,
 * add an entry here to get type-safe access everywhere.
 */
import { IBatchContext } from '@/core/types';
import {
  DataChanged,
  Follow,
  LSP6Controller,
  LSP8TokenIdFormat,
  LSP8TokenMetadataBaseURI,
  NFT,
  OwnershipTransferred,
  TokenIdDataChanged,
  Transfer,
  Unfollow,
} from '@chillwhales/typeorm';

/**
 * Maps BatchContext bag keys to their concrete entity types.
 *
 * This is the schema of the entity bag — it documents which string keys
 * correspond to which TypeORM entities at the type level.
 *
 * Categories:
 * - Event entities: Written by EventPlugins during Step 1 (EXTRACT)
 * - Derived entities: Written by EntityHandlers during Step 3 (HANDLE)
 *
 * Not all bag keys are listed here — only those that handlers read via
 * getTypedEntities(). Write-only keys (e.g., 'LSP3Profile', 'TotalSupply')
 * don't need entries since handlers never read them back from the bag.
 */
export interface EntityTypeMap {
  // Event entities (from plugins)
  DataChanged: DataChanged;
  TokenIdDataChanged: TokenIdDataChanged;
  LSP7Transfer: Transfer;
  LSP8Transfer: Transfer;
  Follow: Follow;
  Unfollow: Unfollow;
  OwnershipTransferred: OwnershipTransferred;

  // Derived entities (from handlers, read back by other handlers)
  NFT: NFT;
  LSP6Controller: LSP6Controller;
  LSP8TokenIdFormat: LSP8TokenIdFormat;
  LSP8TokenMetadataBaseURI: LSP8TokenMetadataBaseURI;
}

/**
 * Type-safe entity bag accessor.
 *
 * Retrieves entities from the BatchContext with the correct concrete type,
 * eliminating the need for `as Map<string, T>` casts at every call site.
 *
 * The single cast lives here — handlers get clean, type-safe access:
 * ```typescript
 * // Before (cast at every call site):
 * const events = hctx.batchCtx.getEntities('DataChanged') as Map<string, DataChanged>;
 *
 * // After (zero casts, fully typed):
 * const events = getTypedEntities(hctx.batchCtx, 'DataChanged');
 * ```
 *
 * @param ctx  - BatchContext (or IBatchContext) to read from
 * @param type - Bag key (must be a key of EntityTypeMap)
 * @returns Map of entity ID → typed entity
 */
export function getTypedEntities<K extends keyof EntityTypeMap>(
  ctx: IBatchContext,
  type: K,
): Map<string, EntityTypeMap[K]> {
  return ctx.getEntities(type) as Map<string, EntityTypeMap[K]>;
}
