import { BlockData, DataHandlerContext, EvmBatchProcessor, Log } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

// ---------------------------------------------------------------------------
// Subsquid re-exports (same as v1 types/index.ts)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FieldSelection {}

export type Processor = EvmBatchProcessor<FieldSelection>;

export type Block = BlockData<FieldSelection>;

export type Context = DataHandlerContext<Store, FieldSelection>;

export type { Log };

// ---------------------------------------------------------------------------
// Entity categories for address verification
// ---------------------------------------------------------------------------

export enum EntityCategory {
  UniversalProfile = 'UniversalProfile',
  DigitalAsset = 'DigitalAsset',
  NFT = 'NFT',
}

// ---------------------------------------------------------------------------
// Verification result returned per EntityCategory
// ---------------------------------------------------------------------------

/**
 * Result of verifying a set of addresses for a given EntityCategory.
 *
 * The `new` set and `newEntities` map always have the same keys — both
 * represent the addresses that were verified for the first time in this batch.
 * `new` provides fast Set-based lookups; `newEntities` provides the actual
 * entity instances to persist and reference in Phase 5 handlers.
 */
export interface VerificationResult {
  /** Addresses that are new (first seen this batch) and valid */
  new: Set<string>;
  /** All valid addresses (existing + new) */
  valid: Set<string>;
  /** Addresses that failed interface checks */
  invalid: Set<string>;
  /** Newly created entity instances to persist, keyed by address */
  newEntities: Map<string, { id: string }>;
}

// ---------------------------------------------------------------------------
// Enrichment queue types (for deferred FK resolution)
// ---------------------------------------------------------------------------

/**
 * Request to enrich an entity with FK references after verification.
 *
 * Entities are persisted with null FK references during the persist phase.
 * The enrichment queue tracks which entities need FK fields populated once
 * verification completes and core entities (UP, DA, NFT) are created.
 */
export interface EnrichmentRequest {
  /** Category to verify (UniversalProfile, DigitalAsset, NFT) */
  category: EntityCategory;

  /** Address to verify */
  address: string;

  /** For NFT category only: the tokenId */
  tokenId?: string;

  /** Which entity type to enrich (e.g. 'Transfer', 'LSP4TokenName') */
  entityType: string;

  /** Which entity id to enrich */
  entityId: string;

  /** Which field on the entity to set the FK reference (e.g. 'digitalAsset', 'nft') */
  fkField: string;
}

// ---------------------------------------------------------------------------
// BatchContext interface (implemented in batchContext.ts, issue #14)
// ---------------------------------------------------------------------------

export interface IBatchContext {
  // Entity storage
  addEntity(type: string, id: string, entity: unknown): void;
  getEntities<T>(type: string): Map<string, T>;
  removeEntity(type: string, id: string): void;
  hasEntities(type: string): boolean;

  // Address tracking for verification
  trackAddress(category: EntityCategory, address: string): void;
  getAddresses(category: EntityCategory): Set<string>;
  getTrackedCategories(): EntityCategory[];

  // Verification results (set by pipeline after verify phase)
  setVerified(category: EntityCategory, result: VerificationResult): void;
  getVerified(category: EntityCategory): VerificationResult;
  isValid(category: EntityCategory, address: string): boolean;

  // Metadata fetch queue (consumed by worker pool)
  queueFetch(request: FetchRequest): void;
  getFetchQueue(): ReadonlyArray<FetchRequest>;

  // Enrichment queue (for deferred FK resolution)
  queueEnrichment(request: EnrichmentRequest): void;
  getEnrichmentQueue(): ReadonlyArray<EnrichmentRequest>;
}

// ---------------------------------------------------------------------------
// Metadata fetching types (for worker pool, issue #18)
// ---------------------------------------------------------------------------

export interface FetchRequest {
  /** Unique identifier for this fetch (entity id) */
  id: string;
  /** URL to fetch (IPFS gateway URL, HTTP URL, or data: URL) */
  url: string;
  /** Entity type this fetch belongs to (e.g. 'LSP3Profile', 'LSP4Metadata') */
  entityType: string;
  /** Number of retries remaining */
  retries: number;
}

export interface FetchResult {
  /** Matches FetchRequest.id */
  id: string;
  /** The entity type from the request */
  entityType: string;
  /** Whether the fetch succeeded */
  success: boolean;
  /** Parsed JSON data (if success) */
  data?: unknown;
  /** Error message (if failure) */
  error?: string;
}

// ---------------------------------------------------------------------------
// Metadata worker pool interface (implemented in issue #18)
// ---------------------------------------------------------------------------

export interface IMetadataWorkerPool {
  fetchBatch(requests: FetchRequest[]): Promise<FetchResult[]>;
  shutdown(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Handler context — passed to EntityHandler handle() methods
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Log subscription config (aggregated from plugins for processor setup)
// ---------------------------------------------------------------------------

export interface LogSubscription {
  topic0: string[];
  address?: string[];
  range?: { from: number };
}

// ---------------------------------------------------------------------------
// Plugin interfaces
// ---------------------------------------------------------------------------

/**
 * EventPlugin — handles a specific blockchain event (by topic0).
 *
 * Each event type (Executed, Transfer, Follow, etc.) implements this interface
 * in a self-contained plugin file. The pipeline discovers and routes to plugins
 * via the PluginRegistry.
 *
 * Adding a new event = creating 1 new file implementing this interface.
 */
export interface EventPlugin {
  /** Unique plugin name (e.g. 'executed', 'lsp7Transfer') */
  readonly name: string;

  /** Event signature topic0 hash used for routing */
  readonly topic0: string;

  /**
   * Optional contract scope. If set, only logs from this address
   * (starting at fromBlock) are routed to this plugin.
   */
  readonly contractFilter?: {
    address: string;
    fromBlock: number;
  };

  /** Which address categories this plugin needs verified */
  readonly requiresVerification: EntityCategory[];

  /**
   * Phase 1: Extract entities from a raw log into the BatchContext.
   * Called once per matching log in the batch.
   */
  extract(log: Log, block: Block, ctx: IBatchContext): void;

  /**
   * Phase 3: Link entities to verified parents, filter out invalid.
   * Called once per batch after verification completes.
   */
  populate(ctx: IBatchContext): void;

  /**
   * Phase 4: Persist entities to the database.
   * Called once per batch after population.
   */
  persist(store: Store, ctx: IBatchContext): Promise<void>;
}

// ---------------------------------------------------------------------------
// Entity lifecycle events
// ---------------------------------------------------------------------------

/**
 * Lifecycle events emitted for core entities (UP, DA, NFT).
 *
 * These events are used by the pipeline to trigger post-verification processing.
 * Currently only `Create` is emitted (in pipeline.ts Phase 5b). `Update` and `Delete`
 * are defined for future extension when the persist layer is enhanced to
 * track modifications and removals.
 *
 * TODO(#101): Remove when pipeline is rewritten to bag-based handlers.
 * The new pipeline (EXTRACT → PERSIST → HANDLE → VERIFY → ENRICH) uses
 * EntityHandler.listensToBag instead of entity lifecycle events.
 */
export enum EntityEvent {
  /** Entity verified and persisted for the first time */
  Create = 'create',
  /** Existing entity data modified (not yet emitted — future extension) */
  Update = 'update',
  /** Entity removed (not yet emitted — future extension) */
  Delete = 'delete',
}

// ---------------------------------------------------------------------------
// Entity handler interface (unified handler for derived entities)
// ---------------------------------------------------------------------------

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
  handle(hctx: HandlerContext, triggeredBy: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Plugin registry interface (implemented in registry.ts, issue #15)
// ---------------------------------------------------------------------------

export interface IPluginRegistry {
  /** Discover and register all event plugins from directories */
  discover(pluginDirs: string[]): void;

  /** Discover and register all entity handlers from directories */
  discoverHandlers(handlerDirs: string[]): void;

  /** Get event plugin by topic0 */
  getEventPlugin(topic0: string): EventPlugin | undefined;

  /** Get all registered event plugins */
  getAllEventPlugins(): EventPlugin[];

  /** Get all registered entity handlers */
  getAllEntityHandlers(): EntityHandler[];

  /** Get aggregated log subscriptions for processor config */
  getLogSubscriptions(): LogSubscription[];
}
