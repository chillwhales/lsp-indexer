import * as fs from 'fs';
import * as path from 'path';

import {
  DataKeyPlugin,
  EntityCategory,
  EntityEvent,
  EntityHandler,
  EventPlugin,
  IBatchContext,
  IPluginRegistry,
  LogSubscription,
  Plugin,
} from './types';

/**
 * Type guard: does the object satisfy the EventPlugin interface?
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
 * Type guard: does the object satisfy the DataKeyPlugin interface?
 */
function isDataKeyPlugin(obj: unknown): obj is DataKeyPlugin {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.name === 'string' &&
    typeof p.matches === 'function' &&
    typeof p.extract === 'function' &&
    typeof p.populate === 'function' &&
    typeof p.persist === 'function' &&
    Array.isArray(p.requiresVerification)
  );
}

/**
 * Type guard: does the object satisfy the EntityHandler interface?
 * Validates that listensTo contains only valid EntityCategory values
 * and events contains only valid EntityEvent values.
 */
function isEntityHandler(obj: unknown): obj is EntityHandler {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  const validCategories = Object.values(EntityCategory) as string[];
  const validEvents = Object.values(EntityEvent) as string[];
  return (
    typeof p.name === 'string' &&
    Array.isArray(p.listensTo) &&
    p.listensTo.length > 0 &&
    p.listensTo.every((c: unknown) => typeof c === 'string' && validCategories.includes(c)) &&
    Array.isArray(p.events) &&
    p.events.length > 0 &&
    p.events.every((e: unknown) => typeof e === 'string' && validEvents.includes(e)) &&
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
 * PluginRegistry discovers, validates, and organizes all plugins.
 *
 * - Event plugins are indexed by topic0 for O(1) routing.
 * - Data key plugins are stored in an ordered list; matches() is called
 *   sequentially until one claims the key.
 * - Entity handlers are stored in a list and filtered by EntityCategory × EntityEvent.
 * - Plugins are auto-discovered from directories by file naming convention
 *   (*.plugin.ts in source, *.plugin.js when compiled).
 * - Handlers are auto-discovered from directories by file naming convention
 *   (*.handler.ts in source, *.handler.js when compiled).
 */
export class PluginRegistry implements IPluginRegistry {
  private readonly eventPlugins = new Map<string, EventPlugin>();
  private readonly dataKeyPlugins: DataKeyPlugin[] = [];
  private readonly allPlugins: Plugin[] = [];
  private readonly entityHandlers: EntityHandler[] = [];

  /**
   * Discover and register all plugins from the given directories.
   *
   * Scans for *.plugin.js files (compiled from *.plugin.ts), imports them,
   * validates they implement the correct interface, and registers them.
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
          this.allPlugins.push(plugin);
        } else if (isDataKeyPlugin(plugin)) {
          this.dataKeyPlugins.push(plugin);
          this.allPlugins.push(plugin);
        } else {
          console.warn(
            `[Registry] Export in ${file} does not implement EventPlugin or DataKeyPlugin, skipping`,
          );
        }
      }
    }

    console.info(
      `[Registry] Discovered ${this.eventPlugins.size} event plugins, ${this.dataKeyPlugins.length} data key plugins`,
    );
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
   * Register a plugin directly (useful for testing or manual wiring).
   */
  registerEventPlugin(plugin: EventPlugin): void {
    if (this.eventPlugins.has(plugin.topic0)) {
      const existing = this.eventPlugins.get(plugin.topic0);
      throw new Error(
        `[Registry] Duplicate topic0: '${plugin.name}' conflicts with '${existing.name}'`,
      );
    }
    this.eventPlugins.set(plugin.topic0, plugin);
    this.allPlugins.push(plugin);
  }

  /**
   * Register a data key plugin directly.
   */
  registerDataKeyPlugin(plugin: DataKeyPlugin): void {
    this.dataKeyPlugins.push(plugin);
    this.allPlugins.push(plugin);
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

  getDataKeyPlugin(dataKey: string): DataKeyPlugin | undefined {
    for (const plugin of this.dataKeyPlugins) {
      if (plugin.matches(dataKey)) return plugin;
    }
    return undefined;
  }

  // -------------------------------------------------------------------------
  // Collection accessors
  // -------------------------------------------------------------------------

  getAllEventPlugins(): EventPlugin[] {
    return [...this.eventPlugins.values()];
  }

  getAllDataKeyPlugins(): DataKeyPlugin[] {
    return [...this.dataKeyPlugins];
  }

  /**
   * Get plugins that have entities in the current batch.
   * Used to skip populate/persist for plugins with no work to do.
   */
  getActivePlugins(_ctx: IBatchContext): Plugin[] {
    // An event plugin is "active" if any entity type it could have written exists.
    // Since we can't know the type strings upfront, we return all plugins
    // and let each plugin's populate/persist check internally.
    // This is still far cheaper than v1's approach of threading everything.
    return this.allPlugins;
  }

  /**
   * Get all plugins that define a handle() method.
   */
  getAllHandlers(): Plugin[] {
    return this.allPlugins.filter((p) => typeof p.handle === 'function');
  }

  /**
   * Get all registered entity handlers.
   */
  getAllEntityHandlers(): EntityHandler[] {
    return [...this.entityHandlers];
  }

  /**
   * Get entity handlers that listen to a specific category and event.
   */
  getEntityHandlers(category: EntityCategory, event: EntityEvent): EntityHandler[] {
    return this.entityHandlers.filter(
      (h) => h.listensTo.includes(category) && h.events.includes(event),
    );
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
