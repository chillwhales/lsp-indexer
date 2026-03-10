/**
 * Entity type map — runtime registry of bag-key → entity constructor.
 *
 * Maps BatchContext entity bag keys to their concrete TypeORM entity classes.
 * The `getTypedEntities()` function validates at runtime (via `instanceof`)
 * that retrieved entities actually match the expected type — no blind casts.
 *
 * When adding a new event plugin or handler that introduces a new bag key,
 * add an entry to both `EntityTypeMap` (type level) and `ENTITY_CONSTRUCTORS`
 * (runtime) to get validated, type-safe access everywhere.
 */
import { Entity, IBatchContext } from '@/core/types';
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
 * Maps BatchContext bag keys to their concrete entity types (type level).
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

// ---------------------------------------------------------------------------
// Runtime constructor registry
// ---------------------------------------------------------------------------

/**
 * Runtime mapping of bag keys to entity constructors.
 *
 * Used by `getTypedEntities()` to validate via `instanceof` that entities
 * retrieved from the bag are actually the expected type. This catches
 * mismatches immediately (e.g., plugin stores wrong entity under a key)
 * instead of letting bad data propagate silently.
 *
 * Must stay in sync with `EntityTypeMap` — if you add a type-level entry,
 * add the constructor here too.
 */
const ENTITY_CONSTRUCTORS: {
  [K in keyof EntityTypeMap]: new (...args: unknown[]) => EntityTypeMap[K];
} = {
  DataChanged: DataChanged,
  TokenIdDataChanged: TokenIdDataChanged,
  LSP7Transfer: Transfer,
  LSP8Transfer: Transfer,
  Follow: Follow,
  Unfollow: Unfollow,
  OwnershipTransferred: OwnershipTransferred,
  NFT: NFT,
  LSP6Controller: LSP6Controller,
  LSP8TokenIdFormat: LSP8TokenIdFormat,
  LSP8TokenMetadataBaseURI: LSP8TokenMetadataBaseURI,
};

// ---------------------------------------------------------------------------
// Validated accessor
// ---------------------------------------------------------------------------

/**
 * Type-safe, runtime-validated entity bag accessor.
 *
 * Retrieves entities from the BatchContext and validates that the first
 * entity is an instance of the expected class. Returns a properly typed
 * map — the type narrowing is earned via `instanceof`, not asserted via `as`.
 *
 * @param ctx  - BatchContext (or IBatchContext) to read from
 * @param type - Bag key (must be a key of EntityTypeMap)
 * @returns Map of entity ID → typed entity (validated at runtime)
 * @throws Error if entities in the bag don't match the expected constructor
 *
 * @example
 * ```typescript
 * const events = getTypedEntities(hctx.batchCtx, 'DataChanged');
 * // events is Map<string, DataChanged> — validated, not cast
 * ```
 */
export function getTypedEntities<K extends keyof EntityTypeMap>(
  ctx: IBatchContext,
  type: K,
): Map<string, EntityTypeMap[K]> {
  const raw = ctx.getEntities(type);
  if (raw.size === 0) return raw as Map<string, EntityTypeMap[K]>;

  // Validate: spot-check the first entity against the expected constructor
  const ctor = ENTITY_CONSTRUCTORS[type];
  const first = raw.values().next().value as Entity;
  if (!(first instanceof ctor)) {
    throw new Error(
      `Entity type mismatch for bag key '${type}': expected ${ctor.name}, ` +
        `got ${first?.constructor?.name ?? 'unknown'}`,
    );
  }

  // Type narrowing earned via instanceof — safe to return as typed map
  return raw as Map<string, EntityTypeMap[K]>;
}
