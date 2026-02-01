import * as fs from 'fs';
import * as path from 'path';
import { EntityHandler, EventPlugin, IPluginRegistry, LogSubscription } from './types';

/**
 * Type guard: does the object satisfy the EventPlugin interface?
 *
 * TODO(#102): When populate() and persist() are removed from EventPlugin,
 * update this guard to stop checking for those methods.
 */
function isEventPlugin(obj: unknown): obj is EventPlugin {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.name === 'string' &&
    typeof p.topic0 === 'string' &&
    typeof p.extract === 'function' &&
    typeof p.populate === 'function' &&
    typeof p.persist === 'function' &&
    Array.isArray(p.requiresVerification)
  );
}

/**
 * Type guard: does the object satisfy the EntityHandler interface?
 * Validates that listensToBag is a non-empty array of strings.
 */
function isEntityHandler(obj: unknown): obj is EntityHandler {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.name === 'string' &&
    Array.isArray(p.listensToBag) &&
    p.listensToBag.length > 0 &&
    p.listensToBag.every((key: unknown) => typeof key === 'string') &&
    typeof p.handle === 'function'
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
        const loaded: unknown = require(file);
        const moduleObj = loaded as Record<string, unknown> | null;
        const plugin: unknown = moduleObj?.default ?? moduleObj?.plugin;

        if (!plugin) {
          console.warn(`[Registry] No default/plugin export in ${file}, skipping`);
          continue;
        }

        if (isEventPlugin(plugin)) {
          if (this.eventPlugins.has(plugin.topic0)) {
            const existing = this.eventPlugins.get(plugin.topic0);
            throw new Error(
              `[Registry] Duplicate topic0: '${plugin.name}' conflicts with '${existing.name}'`,
            );
          }
          this.eventPlugins.set(plugin.topic0, plugin);
        } else {
          console.warn(`[Registry] Export in ${file} does not implement EventPlugin, skipping`);
        }
      }
    }

    console.info(`[Registry] Discovered ${this.eventPlugins.size} event plugins`);
  }

  /**
   * Discover and register all entity handlers from the given directories.
   *
   * Scans for *.handler.js files (compiled from *.handler.ts), imports them,
   * validates they implement the EntityHandler interface, and registers them.
   *
   * TODO: Wire this into bootstrap in Phase 6 (issue #58: Entry point & startup wiring)
   *
   * @throws Error if duplicate handler names are found.
   */
  discoverHandlers(handlerDirs: string[]): void {
    for (const dir of handlerDirs) {
      const files = findFiles(dir, '.handler.js');

      for (const file of files) {
        // Dynamic handler loading from compiled JS files at runtime
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const loaded: unknown = require(file);
        const moduleObj = loaded as Record<string, unknown> | null;
        const handler: unknown = moduleObj?.default ?? moduleObj?.handler;

        if (!handler) {
          console.warn(`[Registry] No default/handler export in ${file}, skipping`);
          continue;
        }

        if (isEntityHandler(handler)) {
          const existing = this.entityHandlers.find((h) => h.name === handler.name);
          if (existing) {
            throw new Error(
              `[Registry] Duplicate handler name: '${handler.name}' conflicts with existing handler`,
            );
          }
          this.entityHandlers.push(handler);
        } else {
          console.warn(`[Registry] Export in ${file} does not implement EntityHandler, skipping`);
        }
      }
    }

    console.info(`[Registry] Discovered ${this.entityHandlers.length} entity handlers`);
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
