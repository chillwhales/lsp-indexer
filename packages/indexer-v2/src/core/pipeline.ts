import { Store } from '@subsquid/typeorm-store';

import { BatchContext } from './batchContext';
import { PluginRegistry } from './registry';
import {
  Context,
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
 * Process a single batch of blocks through the 5-phase plugin pipeline.
 *
 * This replaces v1's 543-line app/index.ts with a generic orchestrator
 * that knows nothing about specific events or data keys.
 *
 * Phases:
 *   1. EXTRACT  — Route logs to plugins, extract entities into BatchContext
 *   2. VERIFY   — Batch-verify tracked addresses via supportsInterface()
 *   3. POPULATE — Link entities to verified parents, filter invalid
 *   4. PERSIST  — Write entities to database (core entities first, then plugins)
 *   5. HANDLE   — Run post-processing handlers (metadata fetch, counts, etc.)
 */
export async function processBatch(context: Context, config: PipelineConfig): Promise<void> {
  const { registry, verifyAddresses, workerPool } = config;
  const batchCtx: IBatchContext = new BatchContext();

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // Route each log to its plugin, which extracts entities into the BatchContext.
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
  // Phase 2: VERIFY
  // For each EntityCategory with tracked addresses, run batch verification.
  // Results are stored in the BatchContext for plugins to query in Phase 3.
  // ---------------------------------------------------------------------------
  const categories = batchCtx.getTrackedCategories();

  await Promise.all(
    categories.map(async (category) => {
      const addresses = batchCtx.getAddresses(category);
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

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // Each plugin links its entities to verified parents and filters out
  // entities belonging to invalid/unverified addresses.
  // ---------------------------------------------------------------------------
  for (const plugin of registry.getActivePlugins(batchCtx)) {
    plugin.populate(batchCtx);
  }

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // 4a. Persist core entities (UPs, DAs, NFTs) first — other entities
  //     have foreign key references to these.
  // 4b. Clear sub-entities for plugins that use the delete-then-reinsert pattern.
  // 4c. Each plugin persists its own entities.
  // ---------------------------------------------------------------------------
  await persistCoreEntities(context.store, batchCtx, context);

  for (const plugin of registry.getActivePlugins(batchCtx)) {
    if ('clearSubEntities' in plugin && typeof plugin.clearSubEntities === 'function') {
      await plugin.clearSubEntities(context.store, batchCtx);
    }
    await plugin.persist(context.store, batchCtx);
  }

  // ---------------------------------------------------------------------------
  // Phase 5: HANDLE
  // Run post-processing handlers sequentially. Order can matter
  // (e.g., permissions must be updated before dependent handlers run).
  // ---------------------------------------------------------------------------
  const handlerCtx: HandlerContext = {
    store: context.store,
    context,
    isHead: context.isHead,
    batchCtx,
    workerPool,
  };

  for (const handler of registry.getAllHandlers()) {
    await handler.handle!(handlerCtx);
  }
}

// ---------------------------------------------------------------------------
// Core entity persistence
// ---------------------------------------------------------------------------

/**
 * Persist core entities (UniversalProfiles, DigitalAssets, NFTs) that were
 * newly discovered in this batch. These must be persisted before plugin
 * entities because plugins create entities with foreign key references
 * to UPs and DAs.
 */
async function persistCoreEntities(
  store: Store,
  batchCtx: IBatchContext,
  context: Context,
): Promise<void> {
  const upResult = batchCtx.getVerified(EntityCategory.UniversalProfile);
  const daResult = batchCtx.getVerified(EntityCategory.DigitalAsset);
  const nftResult = batchCtx.getVerified(EntityCategory.NFT);

  const newUPs = upResult.new.size;
  const newDAs = daResult.new.size;
  const newNFTs = nftResult.new.size;

  if (newUPs) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'UniversalProfile' entities.",
        count: newUPs,
      }),
    );
  }
  if (newDAs) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'DigitalAsset' entities.",
        count: newDAs,
      }),
    );
  }
  if (newNFTs) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'NFT' entities.",
        count: newNFTs,
      }),
    );
  }

  // Core entities are stored in the BatchContext by the verification system.
  // The verifyAddresses function is responsible for creating the actual
  // entity instances (UniversalProfile, DigitalAsset, NFT) and storing them
  // in the BatchContext under well-known type keys.
  const coreUPs = batchCtx.getEntities<{ id: string }>('CoreUniversalProfile');
  const coreDAs = batchCtx.getEntities<{ id: string }>('CoreDigitalAsset');
  const coreNFTs = batchCtx.getEntities<{ id: string }>('CoreNFT');

  await Promise.all([
    coreUPs.size > 0 ? store.upsert([...coreUPs.values()]) : Promise.resolve(),
    coreDAs.size > 0 ? store.upsert([...coreDAs.values()]) : Promise.resolve(),
    coreNFTs.size > 0 ? store.upsert([...coreNFTs.values()]) : Promise.resolve(),
  ]);
}
