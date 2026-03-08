/**
 * Main entry point for the indexer.
 *
 * Bootstraps the application by:
 * 1. Discovering all EventPlugins and EntityHandlers via PluginRegistry
 * 2. Configuring processor with log subscriptions from registry
 * 3. Running processBatch through the 6-step pipeline for each batch
 */

import { initFileLogger } from '@/core/logger';
import { processBatch } from '@/core/pipeline';
import { createLogger } from '@subsquid/logger';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { createRegistry } from './bootstrap';
import { createPipelineConfig } from './config';
import { processor } from './processor';

// Initialize file logger if enabled
const shouldInitFileLogger =
  process.env.INDEXER_ENABLE_FILE_LOGGER === undefined ||
  process.env.INDEXER_ENABLE_FILE_LOGGER.toLowerCase() === 'true';

if (shouldInitFileLogger) {
  const logDir = process.env.LOG_DIR || './logs';
  initFileLogger(logDir);
}

// Initialize root logger
const logger = createLogger('sqd:processor');

if (shouldInitFileLogger) {
  logger.info('File logging enabled — writing to JSON logs with daily rotation');
} else {
  logger.info('File logging disabled — console output only');
}

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

// Start processor
logger.info('Starting processor — indexer ready');

processor.run(new TypeormDatabase(), async (ctx) => {
  await processBatch(ctx, pipelineConfig);
});
