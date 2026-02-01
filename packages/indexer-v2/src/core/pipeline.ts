import { generateTokenId } from '@/utils';
import { DigitalAsset, NFT, UniversalProfile } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { BatchContext } from './batchContext';
import { PluginRegistry } from './registry';
import {
  Context,
  EnrichmentRequest,
  EntityCategory,
  HandlerContext,
  IBatchContext,
  IMetadataWorkerPool,
  VerificationResult,
} from './types';

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
  const batchCtx: IBatchContext = new BatchContext();

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
  const rawEntityTypes = new Set(batchCtx.getEntityTypeKeys());

  for (const type of rawEntityTypes) {
    const entities = batchCtx.getEntities(type);
    if (entities.size > 0) {
      await context.store.insert([...entities.values()] as { id: string }[]);
      context.log.info(
        JSON.stringify({
          message: 'Persisted raw event entities',
          entityType: type,
          count: entities.size,
        }),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: HANDLE
  // EntityHandlers run once per subscribed entity bag key that has entities.
  // Handlers read entities from BatchContext, create derived entities, add
  // them back to BatchContext, and queue enrichment requests. The pipeline
  // handles persistence.
  //
  // IMPORTANT: Handlers MUST NOT add entities to entity type keys that were
  // already used in Step 1 (rawEntityTypes). Those types are persisted via
  // insert() in Step 2 and skipped in Step 4. Entities added to raw type
  // keys by handlers would be silently lost.
  // ---------------------------------------------------------------------------
  const handlerCtx: HandlerContext = {
    store: context.store,
    context,
    isHead: context.isHead,
    batchCtx,
    workerPool,
  };

  for (const handler of registry.getAllEntityHandlers()) {
    for (const bagKey of handler.listensToBag) {
      if (batchCtx.hasEntities(bagKey)) {
        await handler.handle(handlerCtx, bagKey);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 4: PERSIST DERIVED
  // Batch-persist all handler-derived entities from step 3. These may have
  // deterministic IDs (e.g., TotalSupply, NFT), so we use upsert. Skip entity
  // types already persisted in step 2.
  // ---------------------------------------------------------------------------
  const allEntityTypes = batchCtx.getEntityTypeKeys();
  const derivedTypes = allEntityTypes.filter((type) => !rawEntityTypes.has(type));

  for (const type of derivedTypes) {
    const entities = batchCtx.getEntities(type);
    if (entities.size > 0) {
      await context.store.upsert([...entities.values()] as { id: string }[]);
      context.log.info(
        JSON.stringify({
          message: 'Persisted derived entities',
          entityType: type,
          count: entities.size,
        }),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Step 5: VERIFY
  // Collect unique addresses from the enrichment queue and batch-verify them
  // via supportsInterface(). Create core entities (UP, DA) for valid addresses
  // and persist them.
  // ---------------------------------------------------------------------------
  const enrichmentQueue = batchCtx.getEnrichmentQueue();

  // Collect unique addresses per category from enrichment requests
  const addressesByCategory = new Map<EntityCategory, Set<string>>();
  for (const request of enrichmentQueue) {
    // NFTs are validated separately (parent DA must be valid + NFT entity exists)
    if (request.category === EntityCategory.NFT) continue;

    if (!addressesByCategory.has(request.category)) {
      addressesByCategory.set(request.category, new Set());
    }
    addressesByCategory.get(request.category)!.add(request.address);
  }

  // Batch-verify UP and DA addresses in parallel
  const categories = [...addressesByCategory.keys()];
  await Promise.all(
    categories.map(async (category) => {
      const addresses = addressesByCategory.get(category)!;
      if (addresses.size === 0) return;

      const result = await verifyAddresses(category, addresses, context.store, context);
      batchCtx.setVerified(category, result);

      context.log.info(
        JSON.stringify({
          message: `Verified '${category}' entities`,
          newCount: result.new.size,
          validCount: result.valid.size,
          invalidCount: result.invalid.size,
        }),
      );
    }),
  );

  // Persist core entities (UP, DA) for newly verified addresses
  const allNewEntities: { id: string }[] = [];
  for (const category of categories) {
    const result = batchCtx.getVerified(category);
    if (result.newEntities.size > 0) {
      context.log.info(
        JSON.stringify({
          message: `Saving '${category}' entities`,
          count: result.newEntities.size,
        }),
      );
      allNewEntities.push(...result.newEntities.values());
    }
  }

  if (allNewEntities.length > 0) {
    await context.store.upsert(allNewEntities);
  }

  // ---------------------------------------------------------------------------
  // Step 6: ENRICH
  // Group enrichment requests by (entityType, entityId) and batch-update FK
  // references on already-persisted entities. Only set FKs for valid addresses.
  // ---------------------------------------------------------------------------
  const grouped = new Map<string, Map<string, EnrichmentRequest[]>>();

  for (const request of enrichmentQueue) {
    // Check validity
    let valid = false;
    if (request.category === EntityCategory.NFT) {
      // NFT enrichment is always valid. NFT entities are created by the NFT
      // EntityHandler (issue #104) or exist from prior batches. The nft FK
      // reference uses a deterministic ID (address + tokenId) that always
      // resolves to the NFT entity row. The NFT entity's own digitalAsset FK
      // is handled separately via EntityCategory.DigitalAsset enrichment
      // (subject to DA verification).
      valid = true;
    } else {
      valid = batchCtx.isValid(request.category, request.address);
    }

    if (!valid) continue; // FK stays null

    // Group by entityType → entityId
    if (!grouped.has(request.entityType)) {
      grouped.set(request.entityType, new Map());
    }
    const entityMap = grouped.get(request.entityType)!;
    if (!entityMap.has(request.entityId)) {
      entityMap.set(request.entityId, []);
    }
    entityMap.get(request.entityId)!.push(request);
  }

  // Batch update FK fields per entity type
  for (const [entityType, entityMap] of grouped) {
    const entities = batchCtx.getEntities(entityType);
    const entitiesToUpdate: unknown[] = [];

    for (const [entityId, requests] of entityMap) {
      const entity = entities.get(entityId);
      if (!entity) continue;

      // Set all FK fields for this entity
      for (const request of requests) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entity as any)[request.fkField] = createFkStub(request);
      }

      entitiesToUpdate.push(entity);
    }

    if (entitiesToUpdate.length > 0) {
      await context.store.upsert(entitiesToUpdate as { id: string }[]);
      context.log.info(
        JSON.stringify({
          message: 'Enriched entities with FK references',
          entityType,
          count: entitiesToUpdate.length,
        }),
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
function createFkStub(request: EnrichmentRequest): { id: string } {
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
      throw new Error(`Unknown entity category: ${_exhaustive}`);
    }
  }
}
