/**
 * Main entry point for V2 indexer.
 *
 * Bootstraps the application by:
 * 1. Discovering all EventPlugins and EntityHandlers via PluginRegistry
 * 2. Configuring processor with log subscriptions from registry
 * 3. Running processBatch through the 6-step pipeline for each batch
 */

import { createLogger } from '@subsquid/logger';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { createRegistry } from './bootstrap';
import { processor } from './processor';

// Initialize root logger
const logger = createLogger();

// Bootstrap: discover and register all plugins and handlers
const registry = createRegistry(logger);

// Configure processor with log subscriptions from registry
const subscriptions = registry.getLogSubscriptions();
for (const sub of subscriptions) {
  processor.addLog(sub);
}

logger.info('Processor configured with log subscriptions from registry');

// TODO (Plan 03): Add pipeline integration with processBatch
processor.run(new TypeormDatabase(), async (ctx) => {
  // TODO: Wire processBatch call here in Plan 03
  console.log(
    `Processing blocks ${ctx.blocks[0]?.header.height} to ${ctx.blocks[ctx.blocks.length - 1]?.header.height}`,
  );
});
