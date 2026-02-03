import { Store } from '@subsquid/typeorm-store';
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
  readonly listensToBag: string[];

  /**
   * Called once per subscribed trigger that has entities in the batch.
   * Handlers read entities from BatchContext, create derived entities,
   * add them back to BatchContext, and queue enrichment requests.
   * The pipeline handles persistence.
   *
   * @param hctx        - Handler context (store, batch context, worker pool)
   * @param triggeredBy - The entity bag key that triggered this invocation
   */
  handle(hctx: HandlerContext, triggeredBy: string): void;
}
