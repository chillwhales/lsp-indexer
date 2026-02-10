/**
 * Pipeline orchestrator for the V2 indexer.
 *
 * Processes a single batch of blocks through the 6-step enrichment queue pipeline:
 *   1. EXTRACT         — EventPlugins decode events → BatchContext + enrichment queue
 *   2. PERSIST RAW     — Pipeline batch-persists raw event entities (null FKs)
 *   3. HANDLE          — EntityHandlers create derived entities → BatchContext + enrichment queue
 *   4. PERSIST DERIVED — Pipeline batch-persists handler entities (null FKs)
 *   5. VERIFY          — Batch supportsInterface() → create core entities for valid addresses
 *   6. ENRICH          — Batch UPDATE FK references on already-persisted entities
 *
 * All logging uses structured attributes via createStepLogger from the logger module.
 * No JSON.stringify calls — attributes are passed as native objects for jq filtering.
 */

import { generateTokenId } from '@/utils';
import { DigitalAsset, NFT, UniversalProfile } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';

import { BatchContext } from './batchContext';
import { createStepLogger } from './logger';
import { PluginRegistry } from './registry';
import {
  Context,
  Entity,
  EntityCategory,
  IMetadataWorkerPool,
  StoredClearRequest,
  StoredEnrichmentRequest,
  StoredPersistHint,
  VerificationResult,
} from './types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Function signature for address verification.
 * Injected into the pipeline so it stays decoupled from the verification implementation.
 */
export type VerifyFn = (
  category: EntityCategory,
  addresses: Set<string>,
  store: Store,
  context: Context,
) => Promise<VerificationResult>;

/**
 * Configuration for the pipeline.
 */
export interface PipelineConfig {
  registry: PluginRegistry;
  verifyAddresses: VerifyFn;
  workerPool: IMetadataWorkerPool;
}

// ---------------------------------------------------------------------------
// Type-safe helper functions for pipeline operations
// ---------------------------------------------------------------------------

/**
 * Type-safe clear operation for sub-entity deletion (Step 3.5).
 *
 * Uses TypeORM's find() to query sub-entities by FK field and parent IDs,
 * then removes all matches. Type safety for fkField is enforced at the
 * handler call site where queueClear<T>() validates field names at compile time.
 *
 * @param store - TypeORM store for database operations
 * @param request - Clear request with entity class, FK field, and parent IDs
 * @returns Number of entities removed
 */
async function clearSubEntities(store: Store, request: StoredClearRequest): Promise<number> {
  const existing = await store.find(request.subEntityClass, {
    where: {
      [request.fkField]: In(request.parentIds),
    },
  });

  if (existing.length > 0) {
    await store.remove(existing);
  }

  return existing.length;
}

/**
 * Type-safe merge-upsert operation for derived entities (Step 4).
 *
 * Reads existing database records for the entity IDs in the batch, then
 * preserves existing non-null values in the specified mergeFields before
 * upserting. This prevents data loss when different data key events populate
 * different fields of the same entity across batches.
 *
 * Type safety for mergeFields is enforced at the handler call site where
 * setPersistHint<T>() validates field names at compile time.
 *
 * @param store - TypeORM store for database operations
 * @param entities - Map of entities to upsert (from BatchContext)
 * @param persistHint - Hint with entity class and merge field names
 */
async function mergeUpsertEntities(
  store: Store,
  entities: Map<string, unknown>,
  persistHint: StoredPersistHint,
): Promise<void> {
  const ids = [...entities.keys()];

  // Read existing records from DB
  const existing = await store.findBy(persistHint.entityClass, {
    id: In(ids),
  });
  const existingMap = new Map(existing.map((e) => [e.id, e]));

  // Merge: preserve existing non-null values when the new entity has null.
  // This prevents data loss when different data key events populate different
  // fields of the same entity across batches (e.g., LSP5ReceivedAssets Index
  // event provides arrayIndex, Map event provides interfaceId).
  //
  // IMPORTANT: Once a merge field is set to a non-null value, it cannot be
  // cleared back to null through subsequent updates. This is intentional to
  // maintain data stability across batch boundaries.
  for (const [id, entity] of entities) {
    const prev = existingMap.get(id);
    if (prev) {
      const typedEntity = entity as Record<string, unknown>;
      const typedPrev = prev as unknown as Record<string, unknown>;
      for (const field of persistHint.mergeFields) {
        if (typedEntity[field] == null && typedPrev[field] != null) {
          // Field names are validated at the handler call site via setPersistHint<T>()
          typedEntity[field] = typedPrev[field];
        }
      }
    }
  }

  await store.upsert([...entities.values()] as Entity[]);
}

/**
 * Type-safe FK enrichment operation for a single entity (Step 6).
 *
 * Sets the FK field on the entity to point to the newly created core entity
 * (UniversalProfile, DigitalAsset, or NFT). Type safety for fkField is enforced
 * at the handler call site where queueEnrichment<T>() validates field names
 * at compile time.
 *
 * @param entity - The entity instance to enrich
 * @param request - Enrichment request with FK field name
 * @param fkStub - Core entity stub (just { id: string })
 */
function enrichEntity(entity: unknown, request: StoredEnrichmentRequest, fkStub: Entity): void {
  const typedEntity = entity as Record<string, unknown>;
  // Field name is validated at the handler call site via queueEnrichment<T>()
  // The field existence is checked by the caller with the `in` operator
  typedEntity[request.fkField] = fkStub;
}

/**
 * Process a single batch of blocks through the 6-step enrichment queue pipeline.
 *
 * This replaces the previous 5-phase pipeline (EXTRACT → VERIFY → POPULATE → PERSIST → HANDLE)
 * with a cleaner flow that separates raw data persistence from FK enrichment.
 *
 * Steps:
 *   1. EXTRACT         — EventPlugins decode events → BatchContext + enrichment queue
 *   2. PERSIST RAW     — Pipeline batch-persists raw event entities (null FKs)
 *   3. HANDLE          — EntityHandlers create derived entities → BatchContext + enrichment queue
 *   4. PERSIST DERIVED — Pipeline batch-persists handler entities (null FKs)
 *   5. VERIFY          — Batch supportsInterface() → create core entities for valid addresses
 *   6. ENRICH          — Batch UPDATE FK references on already-persisted entities
 *
 * Error handling: No try/catch — errors propagate to the Subsquid framework.
 * A failed store operation in any step halts the pipeline for the batch.
 */
export async function processBatch(context: Context, config: PipelineConfig): Promise<void> {
  const { registry, verifyAddresses, workerPool } = config;
  const batchCtx = new BatchContext();

  // Compute block range for structured log context
  const blockRange =
    context.blocks.length > 0
      ? {
          from: context.blocks[0].header.height,
          to: context.blocks[context.blocks.length - 1].header.height,
        }
      : undefined;

  // ---------------------------------------------------------------------------
  // Step 1: EXTRACT
  // Route each log to its EventPlugin by topic0. Plugins decode events and
  // store base entities in BatchContext with null FK references, then queue
  // enrichment requests for FK resolution.
  // ---------------------------------------------------------------------------
  for (const block of context.blocks) {
    for (const log of block.logs) {
      const topic0 = log.topics[0];
      if (!topic0) continue;

      const plugin = registry.getEventPlugin(topic0);
      if (!plugin) continue;

      // If plugin is contract-scoped, verify the log address matches
      if (plugin.contractFilter && log.address !== plugin.contractFilter.address) {
        continue;
      }

      plugin.extract(log, block, batchCtx);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 2: PERSIST RAW
  // Batch-persist all raw event entities from step 1. These are inserted with
  // null FK references. FK resolution happens in step 6 after verification.
  // ---------------------------------------------------------------------------
  const persistRawLog = createStepLogger(context.log, 'PERSIST_RAW', blockRange);
  const rawEntityTypes = new Set(batchCtx.getEntityTypeKeys());
  for (const type of rawEntityTypes) {
    const entities = batchCtx.getEntities(type);
    if (entities.size > 0) {
      await context.store.insert([...entities.values()] as Entity[]);
      persistRawLog.info(
        { entityType: type, count: entities.size },
        'Persisted raw event entities',
      );
    }
  }

  // Seal raw entity types to prevent handlers from adding to them
  batchCtx.sealRawEntityTypes();

  // ---------------------------------------------------------------------------
  // Step 3: HANDLE
  // EntityHandlers run once per subscribed entity bag key that has entities.
  // Handlers read entities from BatchContext, create derived entities, add
  // them back to BatchContext, and queue enrichment requests. The pipeline
  // handles persistence.
  //
  // IMPORTANT: Handlers cannot add entities to entity type keys that were
  // already used in Step 1 (rawEntityTypes). Those types are sealed after
  // Step 2 persistence. Attempting to add to a sealed type throws an error
  // to prevent silent data loss (Step 4 skips raw types).
  // ---------------------------------------------------------------------------
  const handlerCtx = {
    store: context.store,
    context,
    isHead: context.isHead,
    batchCtx,
    workerPool,
  };

  const step3Handlers = registry.getAllEntityHandlers().filter((h) => !h.postVerification);
  for (const handler of step3Handlers) {
    for (const bagKey of handler.listensToBag) {
      if (batchCtx.hasEntities(bagKey)) {
        await handler.handle(handlerCtx, bagKey);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3.5: CLEAR SUB-ENTITIES
  // Process the clear queue before persisting derived entities. Handlers
  // queue clear requests for sub-entities that need delete-then-reinsert
  // behavior (e.g., LSP6 permissions, allowed calls).
  // ---------------------------------------------------------------------------
  const clearLog = createStepLogger(context.log, 'CLEAR_SUB_ENTITIES', blockRange);
  const clearQueue = batchCtx.getClearQueue();
  if (clearQueue.length > 0) {
    for (const request of clearQueue) {
      const removedCount = await clearSubEntities(context.store, request);
      if (removedCount > 0) {
        clearLog.info(
          {
            subEntityClass: request.subEntityClass.name,
            parentCount: request.parentIds.length,
            removedCount,
          },
          'Cleared sub-entities',
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 4a: DELETE ENTITIES
  // Process the delete queue. Handlers queue entity deletions for DB-level
  // removal (e.g., OwnedToken/OwnedAsset with zero balance). Deletions run
  // BEFORE upserts to handle FK ordering (delete children before parents).
  // ---------------------------------------------------------------------------
  const deleteLog = createStepLogger(context.log, 'DELETE_ENTITIES', blockRange);
  const deleteQueue = batchCtx.getDeleteQueue();
  if (deleteQueue.length > 0) {
    for (const request of deleteQueue) {
      if (request.entities.length > 0) {
        await context.store.remove(request.entities);
        deleteLog.info(
          { entityClass: request.entityClass.name, count: request.entities.length },
          'Deleted entities',
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 4b: PERSIST DERIVED
  // Batch-persist all handler-derived entities from step 3. These may have
  // deterministic IDs (e.g., TotalSupply, NFT), so we use upsert. If a persist
  // hint is set for an entity type, use merge-upsert behavior to preserve
  // non-null values in the specified mergeFields. Skip entity types already
  // persisted in step 2.
  // ---------------------------------------------------------------------------
  const persistDerivedLog = createStepLogger(context.log, 'PERSIST_DERIVED', blockRange);
  const allEntityTypes = batchCtx.getEntityTypeKeys();
  const derivedTypes = allEntityTypes.filter((type) => !rawEntityTypes.has(type));

  for (const type of derivedTypes) {
    const entities = batchCtx.getEntities(type);
    if (entities.size === 0) continue;

    const persistHint = batchCtx.getPersistHint(type);
    if (persistHint) {
      // Merge-upsert: use type-safe helper to preserve non-null merge fields
      await mergeUpsertEntities(context.store, entities, persistHint);
      persistDerivedLog.info(
        { entityType: type, count: entities.size, strategy: 'merge-upsert' },
        'Persisted derived entities',
      );
    } else {
      // Simple upsert (default)
      await context.store.upsert([...entities.values()] as Entity[]);
      persistDerivedLog.info(
        { entityType: type, count: entities.size },
        'Persisted derived entities',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Step 5 & 6: VERIFY + ENRICH (single-pass optimization)
  // In one pass over the enrichment queue:
  //   - Collect addresses per category for verification
  //   - Build the grouped enrichment map for FK assignment
  // Then verify addresses, persist core entities, and assign FKs.
  // ---------------------------------------------------------------------------
  const enrichmentQueue = batchCtx.getEnrichmentQueue();

  // Single pass: collect addresses for verification AND group for enrichment
  const addressesByCategory = new Map<EntityCategory, Set<string>>();
  const grouped = new Map<string, Map<string, StoredEnrichmentRequest[]>>();

  for (const request of enrichmentQueue) {
    // Collect addresses for non-NFT categories (NFTs always valid)
    if (request.category !== EntityCategory.NFT) {
      let addressSet = addressesByCategory.get(request.category);
      if (!addressSet) {
        addressSet = new Set<string>();
        addressesByCategory.set(request.category, addressSet);
      }
      addressSet.add(request.address);
    }

    // Group all requests by (entityType, entityId) for FK assignment
    let entityMap = grouped.get(request.entityType);
    if (!entityMap) {
      entityMap = new Map<string, StoredEnrichmentRequest[]>();
      grouped.set(request.entityType, entityMap);
    }
    let requestList = entityMap.get(request.entityId);
    if (!requestList) {
      requestList = [];
      entityMap.set(request.entityId, requestList);
    }
    requestList.push(request);
  }

  // Step 5: VERIFY — Batch-verify UP and DA addresses in parallel
  const verifyLog = createStepLogger(context.log, 'VERIFY', blockRange);
  const categories = [...addressesByCategory.keys()];

  await Promise.all(
    categories.map(async (category) => {
      const addresses = addressesByCategory.get(category);
      if (!addresses || addresses.size === 0) return;

      const result = await verifyAddresses(category, addresses, context.store, context);
      batchCtx.setVerified(category, result);

      verifyLog.info(
        {
          category: `${category}`,
          newCount: result.new.size,
          validCount: result.valid.size,
          invalidCount: result.invalid.size,
        },
        `Verified '${category}' entities`,
      );
    }),
  );

  // Persist core entities (UP, DA) for newly verified addresses
  // Group by category to avoid mixing entity classes in single upsert
  for (const category of categories) {
    const result = batchCtx.getVerified(category);
    if (result.newEntities.size > 0) {
      const entities = [...result.newEntities.values()];
      verifyLog.info(
        { category: `${category}`, count: entities.length },
        `Saving '${category}' entities`,
      );
      await context.store.upsert(entities);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 5.5: POST-VERIFICATION HANDLERS
  // Handlers with postVerification=true run here, after core entities (UP, DA)
  // are persisted. This allows handlers like decimals to read newly verified
  // Digital Assets and make RPC calls against verified contracts.
  // ---------------------------------------------------------------------------
  const postVerifyHandlers = registry.getAllEntityHandlers().filter((h) => h.postVerification);
  for (const handler of postVerifyHandlers) {
    for (const bagKey of handler.listensToBag) {
      if (batchCtx.hasEntities(bagKey)) {
        await handler.handle(handlerCtx, bagKey);
      }
    }
  }

  // Persist any entities created by post-verification handlers
  const postVerifyLog = createStepLogger(context.log, 'PERSIST_DERIVED', blockRange);
  const postVerifyTypes = batchCtx
    .getEntityTypeKeys()
    .filter((type) => !rawEntityTypes.has(type) && !derivedTypes.includes(type));

  for (const type of postVerifyTypes) {
    const entities = batchCtx.getEntities(type);
    if (entities.size === 0) continue;

    await context.store.upsert([...entities.values()] as Entity[]);
    postVerifyLog.info(
      { entityType: type, count: entities.size, phase: 'post-verification' },
      'Persisted post-verification entities',
    );
  }

  // Step 6: ENRICH — Batch update FK fields per entity type
  const enrichLog = createStepLogger(context.log, 'ENRICH', blockRange);
  for (const [entityType, entityMap] of grouped) {
    const entities = batchCtx.getEntities(entityType);
    const entitiesToUpdate: unknown[] = [];

    for (const [entityId, requests] of entityMap) {
      const entity = entities.get(entityId);
      if (!entity) continue;

      // Set all FK fields for this entity
      let hasValidFk = false;
      for (const request of requests) {
        // Check validity: NFT is always valid, others depend on verification
        const valid =
          request.category === EntityCategory.NFT
            ? true
            : batchCtx.isValid(request.category, request.address);
        if (!valid) continue; // FK stays null for invalid addresses

        // Validate that the FK field exists on the entity before assignment.
        // TypeORM entities use Object.assign(this, props) in the constructor,
        // so FK fields only exist on the instance if explicitly passed (even as null).
        if (!(request.fkField in (entity as object))) {
          enrichLog.warn(
            { entityType, entityId, fkField: request.fkField },
            'Skipping enrichment: FK field not found on entity',
          );
          continue;
        }

        // Type-safe FK assignment using helper
        enrichEntity(entity, request, createFkStub(request));
        hasValidFk = true;
      }

      // Only upsert entities that had at least one valid FK enrichment
      if (hasValidFk) {
        entitiesToUpdate.push(entity);
      }
    }

    if (entitiesToUpdate.length > 0) {
      await context.store.upsert(entitiesToUpdate as Entity[]);
      enrichLog.info(
        { entityType, count: entitiesToUpdate.length },
        'Enriched entities with FK references',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// FK stub creation helper
// ---------------------------------------------------------------------------

/**
 * Create an FK stub reference for an enrichment request.
 * These are TypeORM entity instances with only the `id` field set,
 * used as foreign key references.
 */
function createFkStub(request: StoredEnrichmentRequest): Entity {
  switch (request.category) {
    case EntityCategory.UniversalProfile:
      return new UniversalProfile({ id: request.address });
    case EntityCategory.DigitalAsset:
      return new DigitalAsset({ id: request.address });
    case EntityCategory.NFT:
      if (!request.tokenId) {
        throw new Error(`NFT enrichment request missing tokenId for address ${request.address}`);
      }
      return new NFT({
        id: generateTokenId({ address: request.address, tokenId: request.tokenId }),
      });
    default: {
      const _exhaustive: never = request.category;
      throw new Error(`Unknown entity category: ${String(_exhaustive)}`);
    }
  }
}
