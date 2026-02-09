/**
 * Main entry point for V2 indexer.
 *
 * Bootstraps the application by:
 * 1. Discovering all EventPlugins and EntityHandlers via PluginRegistry
 * 2. Configuring processor with log subscriptions from registry
 * 3. Running processBatch through the 6-step pipeline for each batch
 */

import { processBatch } from '@/core/pipeline';
import { createLogger } from '@subsquid/logger';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { createRegistry } from './bootstrap';
import { createPipelineConfig } from './config';
import { processor } from './processor';

// Initialize root logger
const logger = createLogger('sqd:processor');

// Bootstrap: discover and register all plugins and handlers
const registry = createRegistry(logger);

// Configure processor with log subscriptions from registry
const subscriptions = registry.getLogSubscriptions();
for (const sub of subscriptions) {
  processor.addLog(sub);
}

logger.info('Processor configured with log subscriptions from registry');

// Create pipeline configuration
const pipelineConfig = createPipelineConfig(registry);
logger.info('Pipeline configuration created');

// Start processor — V2 indexer ready
logger.info('Starting processor — V2 indexer ready');

// eslint-disable-next-line @typescript-eslint/require-await -- Async handler for processBatch
processor.run(new TypeormDatabase(), async (ctx) => {
  await processBatch(ctx, pipelineConfig);
});
