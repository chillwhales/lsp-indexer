import { Store } from '@subsquid/typeorm-store';
import type { EntityRegistry } from '../entityRegistry';
import { IBatchContext } from './batchContext';
import { IMetadataWorkerPool } from './metadata';
import { Context } from './subsquid';

/**
 * Entity handler types.
 *
 * EntityHandlers are the unified interface for all derived entity creation
 * (data keys, tallies, NFTs, metadata). They subscribe to BatchContext entity
 * bag keys and are triggered when those entity types exist in the batch.
 */

/**
 * Handler context — passed to EntityHandler handle() methods.
 *
 * Provides access to the database store, chain RPC context, batch entity
 * context, and metadata worker pool for async fetching.
 */
export interface HandlerContext {
  /** Subsquid store for DB operations */
  store: Store;
  /** Subsquid batch context (for chain RPC access) */
  context: Context;
  /** Whether we are processing the chain head (live) */
  isHead: boolean;
  /** Batch entity context */
  batchCtx: IBatchContext;
  /** Metadata worker pool for async fetching */
  workerPool: IMetadataWorkerPool;
}

/**
 * EntityHandler — unified interface for all derived entity creation.
 *
 * Handlers subscribe to BatchContext entity bag keys (e.g. 'DataChanged',
 * 'LSP8Transfer') and are triggered when those entity types exist in the batch.
 * They read entities from the BatchContext, create derived entities, add them
 * back to the BatchContext, and queue enrichment requests for FK resolution.
 *
 * The pipeline handles all persistence — handlers only populate the BatchContext.
 *
 * This replaces the dual DataKeyPlugin + EntityHandler pattern with a single
 * unified interface. All derived entity creation (data keys, tallies, NFTs,
 * metadata) flows through this interface.
 *
 * Adding a new handler = creating 1 new file implementing this interface.
 */
export interface EntityHandler {
  /** Unique handler name (e.g. 'lsp4TokenName', 'totalSupply', 'nft') */
  readonly name: string;

  /** Subscribe to BatchContext entity bag keys (e.g. ['DataChanged', 'LSP8Transfer']) */
  readonly listensToBag: (keyof EntityRegistry)[];

  /**
   * If true, this handler runs after verification (Step 5.5) instead of
   * during Step 3. Used by handlers that need verified entity data
   * (e.g., decimals needs newly verified Digital Assets).
   */
  readonly postVerification?: boolean;

  /**
   * If true, this handler is invoked at chain head even when its entity bag
   * is empty. Used by metadata fetch handlers that need to drain a DB backlog
   * of unfetched entities regardless of whether new entities appeared in the
   * current batch.
   *
   * Without this flag, rarely-updated entity types (e.g., LSP29EncryptedAsset
   * with only 11 entities on-chain) would never have their metadata fetched
   * because no new entities trigger the handler at head.
   */
  readonly drainAtHead?: boolean;

  /**
   * Handler names this handler must execute after. The registry
   * topologically sorts handlers to honor these dependencies.
   * Only applies within the same step (Step 3 or Step 5.5).
   */
  readonly dependsOn?: string[];

  /**
   * Called once per subscribed trigger that has entities in the batch.
   * Handlers read entities from BatchContext, create derived entities,
   * add them back to BatchContext, and queue enrichment requests.
   * The pipeline handles persistence.
   *
   * May be synchronous or asynchronous. The pipeline awaits the return
   * value, so async handlers (e.g., those making RPC calls or DB lookups)
   * complete before the pipeline proceeds to the next step.
   *
   * @param hctx        - Handler context (store, batch context, worker pool)
   * @param triggeredBy - The entity bag key that triggered this invocation
   */
  handle(hctx: HandlerContext, triggeredBy: keyof EntityRegistry): void | Promise<void>;
}
