/**
 * Bootstrap module for V2 indexer application.
 *
 * Handles registry creation, plugin/handler discovery, and validation.
 * All EventPlugins and EntityHandlers are auto-discovered from filesystem,
 * validated for contract compliance, and registered at startup.
 */

import { createStepLogger } from '@/core/logger';
import { PluginRegistry } from '@/core/registry';
import type { Logger } from '@subsquid/logger';
import * as path from 'path';

/**
 * Creates and initializes the plugin registry by discovering all EventPlugins
 * and EntityHandlers from the filesystem.
 *
 * Discovery sequence:
 * 1. Scan plugins/events/ for *.plugin.js files → validate EventPlugin interface
 * 2. Scan handlers/ for *.handler.js files → validate EntityHandler interface
 * 3. Validate dependencies and ordering (topological sort)
 * 4. Log structured boot summary with counts and dependency order
 *
 * @param logger - Subsquid Logger instance for structured logging
 * @returns Fully initialized PluginRegistry with all plugins and handlers registered
 * @throws Error if duplicates or circular dependencies detected (fail-fast validation)
 */
export function createRegistry(logger: Logger): PluginRegistry {
  const bootLogger = createStepLogger(logger, 'BOOTSTRAP');

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
