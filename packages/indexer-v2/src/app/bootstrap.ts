/**
 * Bootstrap module for V2 indexer application.
 *
 * Handles registry creation, plugin/handler discovery, and registration.
 * All EventPlugins and EntityHandlers are auto-discovered from filesystem
 * and registered at startup. Invalid modules are skipped with warnings.
 */

import { PluginRegistry } from '@/core/registry';
import type { Logger } from '@subsquid/logger';
import * as path from 'path';

/**
 * Creates and initializes the plugin registry by discovering all EventPlugins
 * and EntityHandlers from the filesystem.
 *
 * Discovery sequence:
 * 1. Scan plugins/events/ for *.plugin.js files
 * 2. Scan handlers/ for *.handler.js files
 * 3. Validate dependencies and ordering (topological sort)
 * 4. Log structured boot summary with counts and dependency order
 *
 * @param logger - Subsquid Logger instance for structured logging
 * @returns Fully initialized PluginRegistry with all plugins and handlers registered
 * @throws Error if duplicates or circular dependencies detected (fail-fast validation)
 */
export function createRegistry(logger: Logger): PluginRegistry {
  const bootLogger = logger.child({ step: 'BOOTSTRAP' });

  // Instantiate empty registry
  const registry = new PluginRegistry();

  // Discover EventPlugins from plugins/events/ directory
  const pluginDir = path.resolve(__dirname, '../plugins/events');
  registry.discover([pluginDir]);

  const pluginCount = registry.getAllEventPlugins().length;
  bootLogger.info({ pluginCount }, 'Discovered EventPlugins');

  // Discover EntityHandlers from handlers/ directory
  const handlerDir = path.resolve(__dirname, '../handlers');
  registry.discoverHandlers([handlerDir]);

  const handlers = registry.getAllEntityHandlers();
  const handlerCount = handlers.length;
  const handlerOrder = handlers.map((h) => h.name);

  bootLogger.info(
    {
      handlerCount,
      handlerOrder,
    },
    'Discovered EntityHandlers in dependency order',
  );

  // Generate log subscriptions summary
  const subscriptions = registry.getLogSubscriptions();
  bootLogger.info({ subscriptionCount: subscriptions.length }, 'Generated log subscriptions');

  return registry;
}
