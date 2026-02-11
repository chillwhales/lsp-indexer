/**
 * Shared metadata fetch utility for LSP3, LSP4, and LSP29 fetch handlers.
 *
 * Encapsulates the common flow: empty value clearing, head-only DB backlog
 * drain, worker pool fetch, sub-entity parsing, error tracking, and
 * sub-entity clearing via queueClear().
 *
 * Each fetch handler configures this utility with its specific entity class,
 * parsing function, and sub-entity types.
 */
import { FETCH_BATCH_SIZE, FETCH_LIMIT, FETCH_RETRY_COUNT } from '@/constants';
import { Entity, EntityConstructor, FetchRequest, FetchResult, HandlerContext } from '@/core/types';
import { Store } from '@subsquid/typeorm-store';
import { FindOptionsWhere, In, IsNull, LessThan, Not } from 'typeorm';

// ---------------------------------------------------------------------------
// Configuration types
// ---------------------------------------------------------------------------

/**
 * Common fields shared by all metadata entities (LSP3Profile, LSP4Metadata, LSP29EncryptedAsset).
 *
 * Used as a type constraint so `queryUnfetchedEntities` and `handleMetadataFetch`
 * can access fetch-tracking fields without `any` casts.
 */
export interface MetadataEntity extends Entity {
  url: string | null;
  isDataFetched: boolean;
  fetchErrorCode: string | null;
  fetchErrorMessage: string | null;
  fetchErrorStatus: number | null;
  retryCount: number | null;
}

/**
 * Sub-entity type descriptor for queueClear operations.
 */
export interface SubEntityDescriptor {
  /** Sub-entity class constructor for TypeORM findBy/remove operations */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subEntityClass: EntityConstructor<any>;
  /** FK field name on sub-entity that references the parent */
  fkField: string;
}

/**
 * Configuration for handleMetadataFetch, provided by each handler.
 *
 * @template TEntity The main metadata entity type (e.g., LSP3Profile)
 */
export interface MetadataFetchConfig<TEntity extends MetadataEntity> {
  /** Entity class constructor for DB queries and entity construction */
  entityClass: EntityConstructor<TEntity>;
  /** Entity type key in BatchContext */
  entityType: string;
  /** Sub-entity types to clear on success or empty value */
  subEntityDescriptors: SubEntityDescriptor[];
  /**
   * Parse fetched JSON data into sub-entities.
   *
   * The callback is responsible for:
   * - Validating the JSON shape (e.g., `data.LSP3Profile` exists)
   * - Creating sub-entity instances with `new SubEntity({...})`
   * - Adding them to `hctx.batchCtx.addEntity()`
   * - Returning `{ success: true }` or `{ success: false, fetchErrorMessage: '...' }`
   *
   * @param entity - The main metadata entity being fetched
   * @param data - The fetched JSON data from worker pool
   * @param hctx - Handler context for addEntity calls
   * @returns Parse result with optional entity-level field updates on success
   */
  parseAndAddSubEntities: (
    entity: TEntity,
    data: unknown,
    hctx: HandlerContext,
  ) =>
    | { success: true; entityUpdates?: Record<string, unknown> }
    | { success: false; fetchErrorMessage: string };
  /** Extract URL from entity. Returns null if entity has no URL (empty value). */
  getUrl: (entity: TEntity) => string | null;
  /** Get entity ID */
  getId: (entity: TEntity) => string;
}

// ---------------------------------------------------------------------------
// 3-tier DB backlog query
// ---------------------------------------------------------------------------

/**
 * Query unfetched entities from the DB with 3-tier priority.
 *
 * Port from V1's lsp3ProfileHandler/lsp4MetadataHandler/lsp29EncryptedAssetHandler.
 * All three V1 handlers use identical priority logic.
 *
 * Priority 1: Never fetched, no errors (fresh entities)
 * Priority 2: Retryable HTTP status codes (408, 429, 5xx)
 * Priority 3: Retryable network error codes (ETIMEDOUT, EPROTO)
 *
 * @param store - Subsquid store for DB operations
 * @param entityClass - Entity class constructor for DB queries
 * @param limit - Maximum number of entities to return
 * @returns Array of unfetched entities ordered by priority
 */
export async function queryUnfetchedEntities<TEntity extends MetadataEntity>(
  store: Store,
  entityClass: EntityConstructor<TEntity>,
  limit: number,
): Promise<TEntity[]> {
  const results: TEntity[] = [];

  // Priority 1: Never fetched, no errors
  const p1 = await store.find(entityClass, {
    take: limit,
    where: {
      url: Not(IsNull()),
      isDataFetched: false,
      fetchErrorCode: IsNull(),
      fetchErrorMessage: IsNull(),
      fetchErrorStatus: IsNull(),
    } as FindOptionsWhere<TEntity>,
  });
  results.push(...p1);

  // Priority 2: Retryable HTTP status codes
  if (results.length < limit) {
    const p2 = await store.find(entityClass, {
      take: limit - results.length,
      where: {
        url: Not(IsNull()),
        isDataFetched: false,
        fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
        retryCount: LessThan(FETCH_RETRY_COUNT),
      } as FindOptionsWhere<TEntity>,
    });
    results.push(...p2);
  }

  // Priority 3: Retryable network error codes
  if (results.length < limit) {
    const p3 = await store.find(entityClass, {
      take: limit - results.length,
      where: {
        url: Not(IsNull()),
        isDataFetched: false,
        fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']),
        retryCount: LessThan(FETCH_RETRY_COUNT),
      } as FindOptionsWhere<TEntity>,
    });
    results.push(...p3);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main utility
// ---------------------------------------------------------------------------

/**
 * Main metadata fetch utility. Call from each fetch handler's handle() method.
 *
 * Handles two paths:
 * 1. Empty value path (every batch): entities with url === null → queueClear sub-entities
 * 2. Head-only fetch path: query DB backlog → worker pool fetch → parse → add sub-entities
 *
 * @param hctx - Handler context (store, batch context, worker pool)
 * @param config - Handler-specific configuration
 * @param triggeredBy - The entity bag key that triggered this invocation
 */
export async function handleMetadataFetch<TEntity extends MetadataEntity>(
  hctx: HandlerContext,
  config: MetadataFetchConfig<TEntity>,
  triggeredBy: string,
): Promise<void> {
  const entities = hctx.batchCtx.getEntities<TEntity>(triggeredBy);

  // ----- Path 1: Empty value (runs every batch, not just head) -----
  for (const entity of entities.values()) {
    if (config.getUrl(entity) === null) {
      // Queue clear for all sub-entity types
      for (const desc of config.subEntityDescriptors) {
        hctx.batchCtx.queueClear({
          subEntityClass: desc.subEntityClass,
          fkField: desc.fkField,
          parentIds: [config.getId(entity)],
        });
      }
    }
  }

  // ----- Path 2: Head-only fetch (DB backlog drain) -----
  hctx.context.log.debug(
    `[${config.entityType}] isHead=${hctx.isHead}, entities in batch=${entities.size}`,
  );

  if (!hctx.isHead) {
    hctx.context.log.debug(`[${config.entityType}] Skipping metadata fetch - not at head`);
    return;
  }

  hctx.context.log.info(`[${config.entityType}] At chain head - checking for metadata backlog`);

  // Collect current-batch IDs so we can exclude them from the DB backlog.
  // Entities in the current batch may have updated url/fields that the DB
  // snapshot doesn't reflect yet (Step 3 handlers run before Step 4 persist).
  const batchIds = new Set<string>();
  for (const entity of entities.values()) {
    batchIds.add(config.getId(entity));
  }

  hctx.context.log.debug(
    `[${config.entityType}] Querying DB for unfetched entities (limit=${FETCH_LIMIT})`,
  );

  const unfetched = await queryUnfetchedEntities<TEntity>(
    hctx.store,
    config.entityClass,
    FETCH_LIMIT,
  );

  hctx.context.log.info(
    `[${config.entityType}] Found ${unfetched.length} unfetched entities in DB`,
  );

  if (unfetched.length === 0) return;

  // Filter out entities that exist in the current batch — their in-batch
  // state (url, error fields, etc.) may differ from the stale DB snapshot.
  const backlog = unfetched.filter((entity) => !batchIds.has(config.getId(entity)));

  hctx.context.log.info(
    `[${config.entityType}] After filtering batch IDs: ${backlog.length} entities in backlog`,
  );

  if (backlog.length === 0) return;

  // Build fetch requests (only backlog entities that have a URL)
  const requests: FetchRequest[] = backlog.reduce<FetchRequest[]>((acc, entity) => {
    const url = config.getUrl(entity);
    if (url !== null) {
      acc.push({ id: config.getId(entity), url, entityType: config.entityType, retries: 0 });
    }
    return acc;
  }, []);

  hctx.context.log.info(
    `[${config.entityType}] Built ${requests.length} fetch requests (${backlog.length - requests.length} had null URLs)`,
  );

  if (requests.length === 0) return;

  // Build lookup for backlog entities by ID (used for all batches)
  const entityById = new Map<string, TEntity>();
  for (const entity of backlog) {
    entityById.set(config.getId(entity), entity);
  }

  // Split requests into batches to prevent memory pressure (same pattern as v1)
  const batchCount = Math.ceil(requests.length / FETCH_BATCH_SIZE);
  let totalProcessed = 0;
  let totalFailed = 0;

  hctx.context.log.info(
    `[${config.entityType}] Starting metadata fetch: ${requests.length} requests split into ${batchCount} batches of ${FETCH_BATCH_SIZE}`,
  );

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchStart = batchIndex * FETCH_BATCH_SIZE;
    const batchEnd = Math.min(batchStart + FETCH_BATCH_SIZE, requests.length);
    const batchRequests = requests.slice(batchStart, batchEnd);

    hctx.context.log.info(
      `[${config.entityType}] Batch ${batchIndex + 1}/${batchCount}: Calling worker pool with ${batchRequests.length} URLs`,
    );

    // Set up timeout warning (but don't cancel the operation)
    const fetchStartTime = Date.now();
    const timeoutWarning = setTimeout(() => {
      const elapsed = Date.now() - fetchStartTime;
      hctx.context.log.warn(
        `[${config.entityType}] Batch ${batchIndex + 1}/${batchCount} is taking longer than ${FETCH_BATCH_TIMEOUT_MS}ms (${elapsed}ms elapsed) - still waiting for worker pool...`,
      );
    }, FETCH_BATCH_TIMEOUT_MS);

    // Fetch via worker pool with error handling
    let results: FetchResult[];
    try {
      results = await hctx.workerPool.fetchBatch(batchRequests);
      clearTimeout(timeoutWarning);
      const fetchDuration = Date.now() - fetchStartTime;
      hctx.context.log.info(
        `[${config.entityType}] Batch ${batchIndex + 1}/${batchCount}: Worker pool returned ${results.length} results in ${fetchDuration}ms`,
      );
    } catch (err) {
      clearTimeout(timeoutWarning);
      // Log error but don't crash the processor — metadata fetching is best-effort
      // Pass full error object to capture stack traces for debugging worker crashes
      const fetchDuration = Date.now() - fetchStartTime;
      const message = `Metadata fetch batch ${batchIndex + 1}/${batchCount} failed for ${config.entityType} (${batchRequests.length} requests, ${fetchDuration}ms elapsed)`;
      if (typeof err === 'object' && err !== null) {
        hctx.context.log.warn(err, message);
      } else {
        hctx.context.log.warn(message);
      }
      totalFailed += batchRequests.length;
      continue; // Skip this batch but process remaining batches
    }

    // Process results for this batch
    for (const result of results) {
      const entity = entityById.get(result.id);
      if (!entity) continue;

      if (result.success && result.data !== undefined) {
        // Parse JSON into sub-entities
        const parseResult = config.parseAndAddSubEntities(entity, result.data, hctx);

        if (parseResult.success === false) {
          // Parse error — update entity with error, increment retry
          const updated = new config.entityClass({
            ...entity,
            fetchErrorMessage: parseResult.fetchErrorMessage,
            fetchErrorCode: null,
            fetchErrorStatus: null,
            retryCount: (entity.retryCount ?? 0) + 1,
          });
          hctx.batchCtx.addEntity(config.entityType, config.getId(entity), updated);
        } else {
          // Queue clear old sub-entities before new ones are persisted
          for (const desc of config.subEntityDescriptors) {
            hctx.batchCtx.queueClear({
              subEntityClass: desc.subEntityClass,
              fkField: desc.fkField,
              parentIds: [config.getId(entity)],
            });
          }

          // Update main entity: isDataFetched = true, clear error fields
          const updated = new config.entityClass({
            ...entity,
            isDataFetched: true,
            fetchErrorMessage: null,
            fetchErrorCode: null,
            fetchErrorStatus: null,
            retryCount: null,
            ...(parseResult.entityUpdates ?? {}),
          });
          hctx.batchCtx.addEntity(config.entityType, config.getId(entity), updated);
          totalProcessed++;
        }
      } else {
        // Fetch error — update entity with error fields from worker
        const updated = new config.entityClass({
          ...entity,
          fetchErrorMessage: result.error ?? 'Unknown fetch error',
          fetchErrorCode: result.errorCode ?? null,
          fetchErrorStatus: result.errorStatus ?? null,
          retryCount: (entity.retryCount ?? 0) + 1,
        });
        hctx.batchCtx.addEntity(config.entityType, config.getId(entity), updated);
        totalFailed++;
      }
    }
  }

  // Log summary after all batches complete
  hctx.context.log.info(
    `[${config.entityType}] Metadata backlog drain complete: ${totalProcessed} processed, ${totalFailed} failed (${batchCount} batches)`,
  );
}
