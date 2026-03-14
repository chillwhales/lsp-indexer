/**
 * Shared metadata fetch utility for LSP3, LSP4, and LSP29 fetch handlers.
 *
 * Encapsulates the common flow: empty value clearing, head-only DB backlog
 * drain, worker pool fetch, sub-entity parsing, error tracking, and
 * sub-entity clearing via queueClear().
 *
 * Each fetch handler configures this utility with its specific bag key
 * and parsing function. All functions operate on the concrete
 * `MetadataEntityKey` union (`'LSP3Profile' | 'LSP4Metadata' | 'LSP29EncryptedAsset'`)
 * rather than a deferred generic `K extends MetadataEntityKey`. This lets
 * TypeScript resolve `EntityRegistry[MetadataEntityKey]` to the concrete
 * 3-member union, which in turn makes `FindOptionsWhere`, `createEntity`,
 * and `addEntity` all evaluate without type casts.
 */
import {
  FETCH_BATCH_SIZE,
  FETCH_BATCH_TIMEOUT_MS,
  FETCH_LIMIT,
  FETCH_RETRY_COUNT,
} from '@/constants';
import { createEntity, EntityRegistry, storeFind } from '@/core/entityRegistry';
import { Entity, EntityConstructor, FetchRequest, FetchResult, HandlerContext } from '@/core/types';
import { Store } from '@subsquid/typeorm-store';
import { In, IsNull, LessThan, Not } from 'typeorm';

// ---------------------------------------------------------------------------
// Key types
// ---------------------------------------------------------------------------

/**
 * The 3 bag keys whose entities support metadata fetching.
 *
 * Using the concrete union (not a deferred generic `K extends MetadataEntityKey`)
 * lets TypeScript resolve `EntityRegistry[MetadataEntityKey]` to
 * `LSP3Profile | LSP4Metadata | LSP29EncryptedAsset` — a concrete union that
 * `FindOptionsWhere`, `createEntity`, and `addEntity` can all evaluate directly.
 */
export type MetadataEntityKey = 'LSP3Profile' | 'LSP4Metadata' | 'LSP29EncryptedAsset';

/**
 * Concrete union of the 3 metadata entity types.
 *
 * `EntityRegistry[MetadataEntityKey]` resolves to
 * `LSP3Profile | LSP4Metadata | LSP29EncryptedAsset`. Used for `storeFind()`
 * where clauses, `createEntity()` spreads, and callback parameters — all
 * without type casts.
 */
export type MetadataEntity = EntityRegistry[MetadataEntityKey];

// ---------------------------------------------------------------------------
// Configuration types
// ---------------------------------------------------------------------------

/**
 * Sub-entity type descriptor for queueClear operations.
 *
 * The descriptor array is heterogeneous — each handler holds descriptors for
 * 7-10 different sub-entity classes. Compile-time FK field validation happens
 * at each handler call site (where concrete types like `LSP3ProfileName` are
 * used with literal `fkField` strings); here we only need the constructor for
 * `store.find()` lookups and the field name as a plain string for the dynamic
 * where clause.
 */
export interface SubEntityDescriptor {
  /** Sub-entity class constructor for TypeORM findBy/remove operations */
  subEntityClass: EntityConstructor<Entity>;
  /** FK field name on sub-entity that references the parent */
  fkField: string;
}

/**
 * Configuration for handleMetadataFetch, provided by each handler.
 *
 * Non-generic — all callbacks receive `MetadataEntity` (the concrete union)
 * rather than `EntityRegistry[K]` (a deferred generic). This is safe because
 * the 3 metadata entities share all fields accessed by the fetch utility
 * (`id`, `url`, `blockNumber`, `transactionIndex`, `logIndex`, `retryCount`,
 * `isDataFetched`, `fetchError*`), and each handler's `parseAndAddSubEntities`
 * callback only accesses these shared fields on the entity parameter.
 */
export interface MetadataFetchConfig<K extends MetadataEntityKey = MetadataEntityKey> {
  /** Bag key in the EntityRegistry — used for getEntities/addEntity/createEntity */
  entityKey: K;
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
   * Receives `MetadataEntity` (the concrete union) rather than a specific entity
   * type. Each handler's parse function only accesses shared fields (`id`,
   * `blockNumber`, `transactionIndex`, `logIndex`) on the entity parameter,
   * so the union type is safe.
   *
   * @param entity - The main metadata entity being fetched
   * @param data - The fetched JSON data from worker pool
   * @param hctx - Handler context for addEntity calls
   * @returns Parse result with optional entity-level field updates on success
   */
  parseAndAddSubEntities: (
    entity: EntityRegistry[K],
    data: unknown,
    hctx: HandlerContext,
  ) =>
    | { success: true; entityUpdates?: Record<string, unknown> }
    | { success: false; fetchErrorMessage: string };
  /** Extract URL from entity. Returns null if entity has no URL (empty value). */
  getUrl: (entity: EntityRegistry[K]) => string | null;
  /** Get entity ID */
  getId: (entity: EntityRegistry[K]) => string;
}

// ---------------------------------------------------------------------------
// 3-tier DB backlog query
// ---------------------------------------------------------------------------

/**
 * Query unfetched entities from the DB with 3-tier priority.
 *
 * Priority 1: Never fetched, no errors (fresh entities)
 * Priority 2: Retryable HTTP status codes (408, 429, 5xx)
 * Priority 3: Retryable network error codes (ETIMEDOUT, EPROTO)
 *
 * Uses `storeFind(store, entityKey, options)` which binds `K = MetadataEntityKey`,
 * resolving `FindManyOptions<EntityRegistry[MetadataEntityKey]>` to
 * `FindManyOptions<MetadataEntity>` — the concrete union. TypeScript can
 * evaluate `FindOptionsWhere<MetadataEntity>` against the shared fields
 * (`url`, `isDataFetched`, `fetchError*`, `retryCount`) without casts.
 *
 * @param store - Subsquid store for DB operations
 * @param entityKey - Bag key identifying the metadata entity type
 * @param limit - Maximum number of entities to return
 * @returns Array of unfetched entities ordered by priority
 */
export async function queryUnfetchedEntities(
  store: Store,
  entityKey: MetadataEntityKey,
  limit: number,
): Promise<MetadataEntity[]> {
  const results: MetadataEntity[] = [];

  // Priority 1: Never fetched, no errors
  const p1 = await storeFind(store, entityKey, {
    take: limit,
    where: {
      url: Not(IsNull()),
      isDataFetched: false,
      fetchErrorCode: IsNull(),
      fetchErrorMessage: IsNull(),
      fetchErrorStatus: IsNull(),
    },
  });
  results.push(...p1);

  // Priority 2: Retryable HTTP status codes
  if (results.length < limit) {
    const p2 = await storeFind(store, entityKey, {
      take: limit - results.length,
      where: {
        url: Not(IsNull()),
        isDataFetched: false,
        fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
        retryCount: LessThan(FETCH_RETRY_COUNT),
      },
    });
    results.push(...p2);
  }

  // Priority 3: Retryable network error codes
  if (results.length < limit) {
    const p3 = await storeFind(store, entityKey, {
      take: limit - results.length,
      where: {
        url: Not(IsNull()),
        isDataFetched: false,
        fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']),
        retryCount: LessThan(FETCH_RETRY_COUNT),
      },
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
 * Non-generic — operates on `MetadataEntityKey` (the concrete union key) so that
 * `getEntities`, `addEntity`, and `createEntity` all resolve against the concrete
 * `MetadataEntity` union type without casts.
 *
 * @param hctx - Handler context (store, batch context, worker pool)
 * @param config - Handler-specific configuration
 * @param triggeredBy - The entity bag key that triggered this invocation
 */
export async function handleMetadataFetch(
  hctx: HandlerContext,
  config: MetadataFetchConfig,
  triggeredBy: MetadataEntityKey,
): Promise<void> {
  const entities = hctx.batchCtx.getEntities(triggeredBy);

  // ----- Path 1: Empty value (runs every batch, not just head) -----
  for (const entity of entities.values()) {
    if (config.getUrl(entity) === null) {
      // Queue clear for all sub-entity types
      for (const desc of config.subEntityDescriptors) {
        hctx.batchCtx.queueClearStored({
          subEntityClass: desc.subEntityClass,
          fkField: desc.fkField,
          parentIds: [config.getId(entity)],
        });
      }
    }
  }

  // ----- Path 2: Head-only fetch (DB backlog drain) -----
  hctx.context.log.debug(
    {
      step: 'HANDLE',
      handler: config.entityKey,
      isHead: hctx.isHead,
      entitiesInBatch: entities.size,
    },
    'Metadata fetch state',
  );

  if (!hctx.isHead) {
    hctx.context.log.debug(
      { step: 'HANDLE', handler: config.entityKey },
      'Skipping metadata fetch - not at head',
    );
    return;
  }

  hctx.context.log.info(
    { step: 'HANDLE', handler: config.entityKey },
    'At chain head - checking for metadata backlog',
  );

  // Collect current-batch IDs so we can exclude them from the DB backlog.
  // Entities in the current batch may have updated url/fields that the DB
  // snapshot doesn't reflect yet (Step 3 handlers run before Step 4 persist).
  const batchIds = new Set<string>();
  for (const entity of entities.values()) {
    batchIds.add(config.getId(entity));
  }

  hctx.context.log.debug(
    { step: 'HANDLE', handler: config.entityKey, limit: FETCH_LIMIT },
    'Querying DB for unfetched entities',
  );

  const unfetched = await queryUnfetchedEntities(hctx.store, config.entityKey, FETCH_LIMIT);

  hctx.context.log.info(
    { step: 'HANDLE', handler: config.entityKey, unfetchedCount: unfetched.length },
    'Found unfetched entities in DB',
  );

  if (unfetched.length === 0) return;

  // Filter out entities that exist in the current batch — their in-batch
  // state (url, error fields, etc.) may differ from the stale DB snapshot.
  const backlog = unfetched.filter((entity) => !batchIds.has(config.getId(entity)));

  hctx.context.log.info(
    { step: 'HANDLE', handler: config.entityKey, backlogCount: backlog.length },
    'Filtered batch IDs from backlog',
  );

  if (backlog.length === 0) return;

  // Build fetch requests (only backlog entities that have a URL)
  const requests: FetchRequest[] = backlog.reduce<FetchRequest[]>((acc, entity) => {
    const url = config.getUrl(entity);
    if (url !== null) {
      acc.push({ id: config.getId(entity), url, entityType: config.entityKey, retries: 0 });
    }
    return acc;
  }, []);

  hctx.context.log.info(
    {
      step: 'HANDLE',
      handler: config.entityKey,
      requestCount: requests.length,
      nullUrlCount: backlog.length - requests.length,
    },
    'Built fetch requests',
  );

  if (requests.length === 0) return;

  // Build lookup for backlog entities by ID (used for all batches)
  const entityById = new Map<string, MetadataEntity>();
  for (const entity of backlog) {
    entityById.set(config.getId(entity), entity);
  }

  // Split requests into batches to prevent memory pressure
  const batchCount = Math.ceil(requests.length / FETCH_BATCH_SIZE);
  let totalProcessed = 0;
  let totalFailed = 0;

  hctx.context.log.info(
    {
      step: 'HANDLE',
      handler: config.entityKey,
      requestCount: requests.length,
      batchCount,
      batchSize: FETCH_BATCH_SIZE,
    },
    'Starting metadata fetch',
  );

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchStart = batchIndex * FETCH_BATCH_SIZE;
    const batchEnd = Math.min(batchStart + FETCH_BATCH_SIZE, requests.length);
    const batchRequests = requests.slice(batchStart, batchEnd);

    hctx.context.log.info(
      {
        step: 'HANDLE',
        handler: config.entityKey,
        batchIndex: batchIndex + 1,
        batchCount,
        urlCount: batchRequests.length,
      },
      'Calling worker pool',
    );

    // Fetch via worker pool with timeout protection
    const fetchStartTime = Date.now();
    let results: FetchResult[];
    try {
      // Race between worker pool fetch and timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Worker pool timeout after ${FETCH_BATCH_TIMEOUT_MS}ms`));
        }, FETCH_BATCH_TIMEOUT_MS);
      });

      results = await Promise.race([hctx.workerPool.fetchBatch(batchRequests), timeoutPromise]);

      const fetchDuration = Date.now() - fetchStartTime;
      hctx.context.log.info(
        {
          step: 'HANDLE',
          handler: config.entityKey,
          batchIndex: batchIndex + 1,
          batchCount,
          resultCount: results.length,
          durationMs: fetchDuration,
        },
        'Worker pool returned results',
      );
    } catch (err) {
      // Log error but don't crash the processor — metadata fetching is best-effort
      const fetchDuration = Date.now() - fetchStartTime;
      const message = `Metadata fetch batch ${batchIndex + 1}/${batchCount} failed for ${config.entityKey} (${batchRequests.length} requests, ${fetchDuration}ms elapsed)`;
      const failureAttrs = {
        step: 'HANDLE' as const,
        handler: config.entityKey,
        batchIndex: batchIndex + 1,
        batchCount,
        requestCount: batchRequests.length,
        durationMs: fetchDuration,
      };
      const errorAttrs =
        err instanceof Error
          ? { error: err.message, ...(err.stack ? { errorStack: err.stack } : {}) }
          : { error: typeof err === 'string' ? err : 'Unknown error' };
      hctx.context.log.warn({ ...failureAttrs, ...errorAttrs }, 'Metadata fetch batch failed');

      // Mark all entities in this batch with error to prevent infinite retries
      // Without this, queryUnfetchedEntities() will keep retrying them on every head batch
      for (const request of batchRequests) {
        const entity = entityById.get(request.id);
        if (!entity) continue;

        const updated = createEntity(config.entityKey, {
          ...entity,
          fetchErrorMessage: message,
          fetchErrorCode: 'WORKER_POOL_ERROR',
          fetchErrorStatus: null,
          retryCount: (entity.retryCount ?? 0) + 1,
        });
        hctx.batchCtx.addEntity(config.entityKey, config.getId(entity), updated);
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
          const updated = createEntity(config.entityKey, {
            ...entity,
            fetchErrorMessage: parseResult.fetchErrorMessage,
            fetchErrorCode: null,
            fetchErrorStatus: null,
            retryCount: (entity.retryCount ?? 0) + 1,
          });
          hctx.batchCtx.addEntity(config.entityKey, config.getId(entity), updated);
        } else {
          // Queue clear old sub-entities before new ones are persisted
          for (const desc of config.subEntityDescriptors) {
            hctx.batchCtx.queueClearStored({
              subEntityClass: desc.subEntityClass,
              fkField: desc.fkField,
              parentIds: [config.getId(entity)],
            });
          }

          // Update main entity: isDataFetched = true, clear error fields
          const updated = createEntity(config.entityKey, {
            ...entity,
            isDataFetched: true,
            fetchErrorMessage: null,
            fetchErrorCode: null,
            fetchErrorStatus: null,
            retryCount: null,
            ...(parseResult.entityUpdates ?? {}),
          });
          hctx.batchCtx.addEntity(config.entityKey, config.getId(entity), updated);
          totalProcessed++;
        }
      } else {
        // Fetch error — update entity with error fields from worker
        const updated = createEntity(config.entityKey, {
          ...entity,
          fetchErrorMessage: result.error ?? 'Unknown fetch error',
          fetchErrorCode: result.errorCode ?? null,
          fetchErrorStatus: result.errorStatus ?? null,
          retryCount: (entity.retryCount ?? 0) + 1,
        });
        hctx.batchCtx.addEntity(config.entityKey, config.getId(entity), updated);
        totalFailed++;
      }
    }
  }

  // Log summary after all batches complete
  hctx.context.log.info(
    {
      step: 'HANDLE',
      handler: config.entityKey,
      processed: totalProcessed,
      failed: totalFailed,
      batchCount,
    },
    'Metadata backlog drain complete',
  );
}
