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
  getFetchQueue(): FetchRequest[];
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
// Handler context — passed to plugin handle() methods
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

  /**
   * Phase 5: Optional post-processing (e.g. update counts, fetch metadata).
   * Only called for plugins that define it.
   */
  handle?(hctx: HandlerContext): Promise<void>;
}

/**
 * DataKeyPlugin — handles a specific ERC725Y data key (or prefix).
 *
 * Dispatched by the DataChanged meta-plugin when a DataChanged event's
 * dataKey matches this plugin. The `matches()` method supports both
 * exact key matching and prefix matching.
 *
 * Adding a new data key = creating 1 new file implementing this interface.
 */
export interface DataKeyPlugin {
  /** Unique plugin name (e.g. 'lsp3Profile', 'lsp4Creators') */
  readonly name: string;

  /** Which address categories this plugin needs verified */
  readonly requiresVerification: EntityCategory[];

  /**
   * Return true if this plugin handles the given dataKey.
   * Can match by exact key or by key prefix.
   */
  matches(dataKey: string): boolean;

  /**
   * Phase 1: Extract entities from a DataChanged log into the BatchContext.
   * Called when matches() returns true.
   */
  extract(log: Log, dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void;

  /**
   * Phase 3: Link entities to verified parents, filter out invalid.
   */
  populate(ctx: IBatchContext): void;

  /**
   * Phase 4: Clear existing sub-entities before re-inserting.
   * Used by plugins with sub-entity patterns (LSP3, LSP4, LSP29).
   */
  clearSubEntities?(store: Store, ctx: IBatchContext): Promise<void>;

  /**
   * Phase 4: Persist entities to the database.
   */
  persist(store: Store, ctx: IBatchContext): Promise<void>;

  /**
   * Phase 5: Optional post-processing.
   */
  handle?(hctx: HandlerContext): Promise<void>;
}

/**
 * Union type for any plugin (event or data key).
 */
export type Plugin = EventPlugin | DataKeyPlugin;

// ---------------------------------------------------------------------------
// Entity lifecycle events
// ---------------------------------------------------------------------------

/**
 * Lifecycle events emitted for core entities (UP, DA, NFT).
 *
 * EntityHandlers subscribe to specific events to react to entity changes.
 * Currently only `Create` is emitted by the pipeline. `Update` and `Delete`
 * are defined for future extension when the persist layer is enhanced to
 * track modifications and removals.
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
// Entity handler interface (Phase 5b handlers triggered by entity lifecycle)
// ---------------------------------------------------------------------------

/**
 * EntityHandler — reacts to entity lifecycle events (create, update, delete).
 *
 * Unlike EventPlugin/DataKeyPlugin which process blockchain events,
 * EntityHandlers run in Phase 5b after entities are verified and persisted.
 * They subscribe to combinations of EntityCategory × EntityEvent and are
 * invoked by the pipeline when matching events occur.
 *
 * The `listensTo` × `events` fields form a Cartesian product of subscriptions.
 * For example, `listensTo: [DA, UP]` + `events: [Create]` means the handler
 * is called twice per batch: once when new DAs are created, and once when
 * new UPs are created. Each invocation receives the specific category via
 * the `triggeredBy` parameter.
 *
 * Adding a new handler = creating 1 new file implementing this interface.
 */
export interface EntityHandler {
  /** Unique handler name (e.g. 'decimals', 'totalSupply') */
  readonly name: string;

  /** Which entity categories this handler listens to */
  readonly listensTo: EntityCategory[];

  /** Which lifecycle events this handler reacts to */
  readonly events: EntityEvent[];

  /**
   * Phase 5b: Called when a subscribed lifecycle event fires.
   *
   * @param hctx        - Handler context (store, batch context, etc.)
   * @param triggeredBy - The EntityCategory that fired the event
   * @param event       - The lifecycle event type (Create, Update, Delete)
   */
  handle(hctx: HandlerContext, triggeredBy: EntityCategory, event: EntityEvent): Promise<void>;
}

// ---------------------------------------------------------------------------
// Plugin registry interface (implemented in registry.ts, issue #15)
// ---------------------------------------------------------------------------

export interface IPluginRegistry {
  /** Discover and register all plugins from directories */
  discover(pluginDirs: string[]): void;

  /** Discover and register all entity handlers from directories */
  discoverHandlers(handlerDirs: string[]): void;

  /** Get event plugin by topic0 */
  getEventPlugin(topic0: string): EventPlugin | undefined;

  /** Get data key plugin matching a specific data key */
  getDataKeyPlugin(dataKey: string): DataKeyPlugin | undefined;

  /** Get all registered event plugins */
  getAllEventPlugins(): EventPlugin[];

  /** Get all registered data key plugins */
  getAllDataKeyPlugins(): DataKeyPlugin[];

  /** Get all plugins that have entities in the current batch */
  getActivePlugins(ctx: IBatchContext): Plugin[];

  /** Get all plugins with a handle() method */
  getAllHandlers(): Plugin[];

  /** Get all registered entity handlers */
  getAllEntityHandlers(): EntityHandler[];

  /** Get entity handlers that listen to a specific category and event */
  getEntityHandlers(category: EntityCategory, event: EntityEvent): EntityHandler[];

  /** Get aggregated log subscriptions for processor config */
  getLogSubscriptions(): LogSubscription[];
}
