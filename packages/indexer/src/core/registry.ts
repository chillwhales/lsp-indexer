import type { Logger } from '@subsquid/logger';
import * as fs from 'fs';
import * as path from 'path';
import { EntityHandler, EventPlugin, IPluginRegistry, LogSubscription } from './types';

/**
 * Type guard: does the object satisfy the EventPlugin interface?
 */
function isEventPlugin(obj: unknown): obj is EventPlugin {
  if (typeof obj !== 'object' || obj === null) return false;
  return (
    'name' in obj &&
    typeof obj.name === 'string' &&
    'topic0' in obj &&
    typeof obj.topic0 === 'string' &&
    'extract' in obj &&
    typeof obj.extract === 'function' &&
    'requiresVerification' in obj &&
    Array.isArray(obj.requiresVerification)
  );
}

/**
 * Type guard: does the object satisfy the EntityHandler interface?
 * Validates that listensToBag is a non-empty array of strings.
 */
function isEntityHandler(obj: unknown): obj is EntityHandler {
  if (typeof obj !== 'object' || obj === null) return false;
  return (
    'name' in obj &&
    typeof obj.name === 'string' &&
    'listensToBag' in obj &&
    Array.isArray(obj.listensToBag) &&
    obj.listensToBag.length > 0 &&
    obj.listensToBag.every((key) => typeof key === 'string') &&
    'handle' in obj &&
    typeof obj.handle === 'function'
  );
}

/**
 * Recursively find all files matching a pattern in a directory.
 */
function findFiles(dir: string, suffix: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, suffix));
    } else if (entry.name.endsWith(suffix)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * PluginRegistry discovers, validates, and organizes all plugins and handlers.
 *
 * - Event plugins are indexed by topic0 for O(1) routing.
 * - Entity handlers are stored in a list; discovery validates the listensToBag contract.
 * - Plugins are auto-discovered from directories by file naming convention
 *   (*.plugin.ts in source, *.plugin.js when compiled).
 * - Handlers are auto-discovered from directories by file naming convention
 *   (*.handler.ts in source, *.handler.js when compiled).
 */
export class PluginRegistry implements IPluginRegistry {
  private readonly eventPlugins = new Map<string, EventPlugin>();
  private readonly entityHandlers: EntityHandler[] = [];
  private readonly logger: Logger | null;
  /** Chain ID used to filter plugins/handlers by supportedChains. If null, all are accepted. */
  private readonly chainId: string | null;

  constructor(logger?: Logger, chainId?: string) {
    this.logger = logger?.child({ step: 'BOOTSTRAP', component: 'registry' }) ?? null;
    this.chainId = chainId ?? null;
  }

  /**
   * Discover and register all event plugins from the given directories.
   *
   * Scans for *.plugin.js files (compiled from *.plugin.ts), imports them,
   * validates they implement the EventPlugin interface, and registers them.
   *
   * @throws Error if duplicate topic0 is found across event plugins.
   */
  discover(pluginDirs: string[]): void {
    for (const dir of pluginDirs) {
      const files = findFiles(dir, '.plugin.js');

      for (const file of files) {
        // Dynamic plugin loading from compiled JS files at runtime
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const loaded = require(file);
        if (typeof loaded !== 'object' || loaded === null) {
          this.logger?.warn({ file }, 'Invalid module export, skipping');
          continue;
        }
        const plugin =
          'default' in loaded ? loaded.default : 'plugin' in loaded ? loaded.plugin : undefined;

        if (!plugin) {
          this.logger?.warn({ file }, 'No default/plugin export, skipping');
          continue;
        }

        if (isEventPlugin(plugin)) {
          // Filter by supportedChains if a chain ID is set
          if (this.chainId && !plugin.supportedChains.includes(this.chainId)) {
            this.logger?.info(
              { file, pluginName: plugin.name, chainId: this.chainId },
              'Skipping plugin — chain not in supportedChains',
            );
            continue;
          }
          if (this.eventPlugins.has(plugin.topic0)) {
            const existing = this.eventPlugins.get(plugin.topic0);
            throw new Error(
              `[Registry] Duplicate topic0: '${plugin.name}' conflicts with '${existing.name}'`,
            );
          }
          this.eventPlugins.set(plugin.topic0, plugin);
        } else {
          this.logger?.warn({ file }, 'Export does not implement EventPlugin, skipping');
        }
      }
    }

    this.logger?.info({ pluginCount: this.eventPlugins.size }, 'Discovered event plugins');
  }

  /**
   * Discover and register all entity handlers from the given directories.
   *
   * Scans for *.handler.js files (compiled from *.handler.ts), imports them,
   * validates they implement the EntityHandler interface, and registers them.
   *
   * @throws Error if duplicate handler names are found.
   */
  discoverHandlers(handlerDirs: string[]): void {
    for (const dir of handlerDirs) {
      const files = findFiles(dir, '.handler.js');

      for (const file of files) {
        // Dynamic handler loading from compiled JS files at runtime
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const loaded = require(file);
        if (typeof loaded !== 'object' || loaded === null) {
          this.logger?.warn({ file }, 'Invalid module export, skipping');
          continue;
        }
        const handler =
          'default' in loaded ? loaded.default : 'handler' in loaded ? loaded.handler : undefined;

        if (!handler) {
          this.logger?.warn({ file }, 'No default/handler export, skipping');
          continue;
        }

        if (isEntityHandler(handler)) {
          // Filter by supportedChains if a chain ID is set
          if (this.chainId && !handler.supportedChains.includes(this.chainId)) {
            this.logger?.info(
              { file, handlerName: handler.name, chainId: this.chainId },
              'Skipping handler — chain not in supportedChains',
            );
            continue;
          }
          const existing = this.entityHandlers.find((h) => h.name === handler.name);
          if (existing) {
            throw new Error(
              `[Registry] Duplicate handler name: '${handler.name}' conflicts with existing handler`,
            );
          }
          this.entityHandlers.push(handler);
        } else {
          this.logger?.warn({ file }, 'Export does not implement EntityHandler, skipping');
        }
      }
    }

    this.logger?.info({ handlerCount: this.entityHandlers.length }, 'Discovered entity handlers');
    this.topologicalSort();
  }

  /**
   * Register an event plugin directly (useful for testing or manual wiring).
   */
  registerEventPlugin(plugin: EventPlugin): void {
    if (this.eventPlugins.has(plugin.topic0)) {
      const existing = this.eventPlugins.get(plugin.topic0);
      throw new Error(
        `[Registry] Duplicate topic0: '${plugin.name}' conflicts with '${existing.name}'`,
      );
    }
    this.eventPlugins.set(plugin.topic0, plugin);
  }

  /**
   * Register an entity handler directly (useful for testing or manual wiring).
   *
   * @throws Error if a handler with the same name already exists.
   */
  registerEntityHandler(handler: EntityHandler): void {
    const existing = this.entityHandlers.find((h) => h.name === handler.name);
    if (existing) {
      throw new Error(
        `[Registry] Duplicate handler name: '${handler.name}' conflicts with existing handler`,
      );
    }
    this.entityHandlers.push(handler);
    this.topologicalSort();
  }

  // -------------------------------------------------------------------------
  // Topological sort
  // -------------------------------------------------------------------------

  /**
   * Sort entityHandlers in-place by `dependsOn` declarations using Kahn's algorithm.
   *
   * Handlers without `dependsOn` maintain their relative insertion order (stable sort).
   * Handlers with dependencies are placed after all their dependencies.
   *
   * @throws Error if a handler references an unknown dependency name
   * @throws Error if a circular dependency is detected
   */
  private topologicalSort(): void {
    const handlers = this.entityHandlers;
    if (handlers.length <= 1) return;

    // Build name → index map
    const nameToIndex = new Map<string, number>();
    for (let i = 0; i < handlers.length; i++) {
      nameToIndex.set(handlers[i].name, i);
    }

    // Validate all dependsOn references exist
    for (const handler of handlers) {
      if (!handler.dependsOn) continue;
      for (const dep of handler.dependsOn) {
        if (!nameToIndex.has(dep)) {
          throw new Error(
            `[Registry] Handler '${handler.name}' depends on unknown handler '${dep}'`,
          );
        }
      }
    }

    // Compute in-degree and adjacency list
    const inDegree = new Array<number>(handlers.length).fill(0);
    const adjacency = new Map<number, number[]>(); // dependency index → dependent indices

    for (let i = 0; i < handlers.length; i++) {
      const deps = handlers[i].dependsOn;
      if (!deps) continue;
      for (const dep of deps) {
        const depIndex = nameToIndex.get(dep);
        if (depIndex === undefined) continue; // validated above, defensive guard
        let dependents = adjacency.get(depIndex);
        if (!dependents) {
          dependents = [];
          adjacency.set(depIndex, dependents);
        }
        dependents.push(i);
        inDegree[i]++;
      }
    }

    // Kahn's algorithm: start with handlers that have 0 in-degree
    const queue: number[] = [];
    for (let i = 0; i < handlers.length; i++) {
      if (inDegree[i] === 0) {
        queue.push(i);
      }
    }

    const sorted: EntityHandler[] = [];
    let queuePos = 0;

    while (queuePos < queue.length) {
      const current = queue[queuePos++];
      sorted.push(handlers[current]);

      const dependents = adjacency.get(current);
      if (dependents) {
        for (const depIdx of dependents) {
          inDegree[depIdx]--;
          if (inDegree[depIdx] === 0) {
            queue.push(depIdx);
          }
        }
      }
    }

    // Cycle detection: if not all handlers were processed, there's a cycle
    if (sorted.length !== handlers.length) {
      const remaining = handlers.filter((_, i) => inDegree[i] > 0).map((h) => h.name);
      throw new Error(
        `[Registry] Circular handler dependency detected among: ${remaining.join(', ')}`,
      );
    }

    // Replace in-place
    this.entityHandlers.length = 0;
    this.entityHandlers.push(...sorted);
  }

  // -------------------------------------------------------------------------
  // Routing
  // -------------------------------------------------------------------------

  getEventPlugin(topic0: string): EventPlugin | undefined {
    return this.eventPlugins.get(topic0);
  }

  // -------------------------------------------------------------------------
  // Collection accessors
  // -------------------------------------------------------------------------

  getAllEventPlugins(): EventPlugin[] {
    return [...this.eventPlugins.values()];
  }

  /**
   * Returns all entity handlers in dependency order.
   *
   * Handlers are topologically sorted by their `dependsOn` declarations,
   * so dependents always appear after their dependencies. Handlers without
   * `dependsOn` maintain their relative insertion order (stable sort).
   */
  getAllEntityHandlers(): EntityHandler[] {
    return [...this.entityHandlers];
  }

  // -------------------------------------------------------------------------
  // Processor subscription aggregation
  // -------------------------------------------------------------------------

  /**
   * Aggregate all topic0s and contract filters into LogSubscription groups
   * for the EvmBatchProcessor configuration.
   *
   * Groups plugins by their contractFilter:
   * - Plugins without contractFilter → grouped into one global subscription
   * - Plugins with the same contractFilter → grouped together
   */
  getLogSubscriptions(): LogSubscription[] {
    const globalTopics: string[] = [];
    const scoped = new Map<string, { address: string; fromBlock: number; topics: string[] }>();

    for (const plugin of this.eventPlugins.values()) {
      if (!plugin.contractFilter) {
        globalTopics.push(plugin.topic0);
      } else {
        const key = `${plugin.contractFilter.address}:${plugin.contractFilter.fromBlock}`;
        let group = scoped.get(key);
        if (!group) {
          group = {
            address: plugin.contractFilter.address,
            fromBlock: plugin.contractFilter.fromBlock,
            topics: [],
          };
          scoped.set(key, group);
        }
        group.topics.push(plugin.topic0);
      }
    }

    const subscriptions: LogSubscription[] = [];

    if (globalTopics.length > 0) {
      subscriptions.push({ topic0: globalTopics });
    }

    for (const group of scoped.values()) {
      subscriptions.push({
        topic0: group.topics,
        address: [group.address],
        range: { from: group.fromBlock },
      });
    }

    return subscriptions;
  }
}
