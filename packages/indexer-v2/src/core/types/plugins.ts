import { Store } from '@subsquid/typeorm-store';
import { IBatchContext } from './batchContext';
import { EntityHandler } from './handler';
import { Block, Log } from './subsquid';
import { EntityCategory } from './verification';

/**
 * Plugin system types.
 *
 * Defines the EventPlugin interface (event-specific logic) and the
 * IPluginRegistry interface (plugin discovery and routing).
 */

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
   *
   * @deprecated Will be removed in #102. The new pipeline does not call
   * populate() — FK resolution is handled by the enrichment queue (Step 6).
   */
  populate(ctx: IBatchContext): void;

  /**
   * Phase 4: Persist entities to the database.
   * Called once per batch after population.
   *
   * @deprecated Will be removed in #102. The new pipeline handles all
   * persistence in Steps 2/4 — plugins no longer persist their own entities.
   */
  persist(store: Store, ctx: IBatchContext): Promise<void>;
}

/**
 * Log subscription configuration for EvmBatchProcessor.
 *
 * Aggregated from all event plugins for processor setup.
 */
export interface LogSubscription {
  topic0: string[];
  address?: string[];
  range?: { from: number };
}

/**
 * Plugin registry interface for discovering and routing plugins and handlers.
 *
 * The registry auto-discovers plugins and handlers from directories by file
 * naming convention (*.plugin.js, *.handler.js), validates them against their
 * interfaces, and provides O(1) routing for the pipeline.
 */
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
