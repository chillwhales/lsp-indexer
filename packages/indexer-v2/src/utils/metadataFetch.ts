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
import { FETCH_LIMIT, FETCH_RETRY_COUNT } from '@/constants';
import { EntityConstructor, FetchRequest, FetchResult, HandlerContext } from '@/core/types';
import { Store } from '@subsquid/typeorm-store';
import { In, IsNull, LessThan, Not } from 'typeorm';

// ---------------------------------------------------------------------------
// Configuration types
// ---------------------------------------------------------------------------

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
export interface MetadataFetchConfig<TEntity> {
  /** Entity class constructor for DB queries and entity construction */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entityClass: EntityConstructor<any>;
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
export async function queryUnfetchedEntities<TEntity>(
  store: Store,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entityClass: EntityConstructor<any>,
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
    },
  });
  results.push(...(p1 as TEntity[]));

  // Priority 2: Retryable HTTP status codes
  if (results.length < limit) {
    const p2 = await store.find(entityClass, {
      take: limit - results.length,
      where: {
        url: Not(IsNull()),
        isDataFetched: false,
        fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
        retryCount: LessThan(FETCH_RETRY_COUNT),
      },
    });
    results.push(...(p2 as TEntity[]));
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
      },
    });
    results.push(...(p3 as TEntity[]));
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
export async function handleMetadataFetch<TEntity>(
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
  if (!hctx.isHead) return;

  const unfetched = await queryUnfetchedEntities<TEntity>(
    hctx.store,
    config.entityClass,
    FETCH_LIMIT,
  );
  if (unfetched.length === 0) return;

  // Build fetch requests (only entities with a URL)
  const requests: FetchRequest[] = unfetched
    .filter((entity) => config.getUrl(entity) !== null)
    .map((entity) => ({
      id: config.getId(entity),
      url: config.getUrl(entity)!,
      entityType: config.entityType,
      retries: 0,
    }));

  if (requests.length === 0) return;

  // Fetch via worker pool
  const results: FetchResult[] = await hctx.workerPool.fetchBatch(requests);

  // Build lookup for unfetched entities by ID
  const entityById = new Map<string, TEntity>();
  for (const entity of unfetched) {
    entityById.set(config.getId(entity), entity);
  }

  // Process results
  for (const result of results) {
    const entity = entityById.get(result.id);
    if (!entity) continue;

    if (result.success && result.data !== undefined) {
      // Parse JSON into sub-entities
      const parseResult = config.parseAndAddSubEntities(entity, result.data, hctx);

      if (!parseResult.success) {
        // Parse error — update entity with error, increment retry
        const errorMessage = (parseResult as { success: false; fetchErrorMessage: string })
          .fetchErrorMessage;
        const updated = new config.entityClass({
          ...(entity as Record<string, unknown>),
          fetchErrorMessage: errorMessage,
          fetchErrorCode: null,
          fetchErrorStatus: null,
          retryCount: (((entity as Record<string, unknown>).retryCount as number) ?? 0) + 1,
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
          ...(entity as Record<string, unknown>),
          isDataFetched: true,
          fetchErrorMessage: null,
          fetchErrorCode: null,
          fetchErrorStatus: null,
          retryCount: null,
          ...(parseResult.entityUpdates ?? {}),
        });
        hctx.batchCtx.addEntity(config.entityType, config.getId(entity), updated);
      }
    } else {
      // Fetch error — update entity with error fields from worker
      const updated = new config.entityClass({
        ...(entity as Record<string, unknown>),
        fetchErrorMessage: result.error ?? 'Unknown fetch error',
        fetchErrorCode: result.errorCode ?? null,
        fetchErrorStatus: result.errorStatus ?? null,
        retryCount: (((entity as Record<string, unknown>).retryCount as number) ?? 0) + 1,
      });
      hctx.batchCtx.addEntity(config.entityType, config.getId(entity), updated);
    }
  }
}
