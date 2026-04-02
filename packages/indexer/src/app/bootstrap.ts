/**
 * Bootstrap module for the indexer application.
 *
 * Handles registry creation, plugin/handler discovery, and registration.
 * All EventPlugins and EntityHandlers are auto-discovered from filesystem
 * and registered at startup. Invalid modules are skipped with warnings.
 *
 * Chain-aware: filters plugins/handlers by supportedChains after discovery.
 */

import { ChainConfig } from '@/config/chainConfig';
import { PluginRegistry } from '@/core/registry';
import type { Logger } from '@subsquid/logger';
import * as path from 'path';

/**
 * Creates and initializes the plugin registry by discovering all EventPlugins
 * and EntityHandlers from the filesystem, then filtering by chain support.
 *
 * Discovery sequence:
 * 1. Scan plugins/events/ for *.plugin.js files
 * 2. Scan handlers/ for *.handler.js files
 * 3. Validate dependencies and ordering (topological sort)
 * 4. Filter out plugins/handlers that don't support the target chain
 * 5. Log structured boot summary with counts and dependency order
 *
 * @param logger      - Subsquid Logger instance for structured logging
 * @param chainConfig - Chain configuration used to filter by supportedChains
 * @returns Fully initialized PluginRegistry with chain-compatible plugins and handlers registered
 * @throws Error if duplicates or circular dependencies detected (fail-fast validation)
 */
export function createRegistry(logger: Logger, chainConfig: ChainConfig): PluginRegistry {
  const bootLogger = logger.child({ step: 'BOOTSTRAP' });

  // Instantiate registry with structured logger and chain filter
  const registry = new PluginRegistry(bootLogger, chainConfig.id);

  // Discover EventPlugins from plugins/events/ directory
  const pluginDir = path.resolve(__dirname, '../plugins/events');
  registry.discover([pluginDir]);

  // Discover EntityHandlers from handlers/ directory
  const handlerDir = path.resolve(__dirname, '../handlers');
  registry.discoverHandlers([handlerDir]);

  // Generate log subscriptions summary
  const subscriptions = registry.getLogSubscriptions();
  bootLogger.info({ subscriptionCount: subscriptions.length }, 'Generated log subscriptions');

  return registry;
}
