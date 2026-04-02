/**
 * Main entry point for the indexer.
 *
 * Bootstraps the application by:
 * 1. Reading CHAIN_ID from env (default: 'lukso')
 * 2. Loading ChainConfig from the registry
 * 3. Creating an EvmBatchProcessor from the config (factory pattern)
 * 4. Discovering all EventPlugins and EntityHandlers via PluginRegistry
 * 5. Configuring processor with log subscriptions from registry
 * 6. Running processBatch through the 7-step pipeline for each batch
 */

import { getChainConfig } from '@/config/chainConfig';
import { initFileLogger } from '@/core/logger';
import { processBatch } from '@/core/pipeline';
import { createLogger } from '@subsquid/logger';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { createRegistry } from './bootstrap';
import { createPipelineConfig } from './config';
import { createProcessor } from './processorFactory';

// Read CHAIN_ID from env, defaulting to 'lukso'
const chainId = process.env.CHAIN_ID || 'lukso';
const chainConfig = getChainConfig(chainId);

// Initialize file logger if enabled
const shouldInitFileLogger =
  process.env.INDEXER_ENABLE_FILE_LOGGER === undefined ||
  process.env.INDEXER_ENABLE_FILE_LOGGER.toLowerCase() === 'true';

const logDir = process.env.LOG_DIR || './logs';

if (shouldInitFileLogger) {
  initFileLogger(logDir);
}

// Initialize root logger
const logger = createLogger('sqd:processor');

logger.info(
  { step: 'BOOTSTRAP', component: 'startup', chainId: chainConfig.id, network: chainConfig.network },
  `Starting indexer for chain '${chainConfig.id}'`,
);

if (shouldInitFileLogger) {
  logger.info(
    { step: 'BOOTSTRAP', component: 'startup', fileLogging: true, logDir },
    'File logging enabled — writing to JSON logs with daily rotation',
  );
} else {
  logger.info(
    { step: 'BOOTSTRAP', component: 'startup', fileLogging: false },
    'File logging disabled — console output only',
  );
}

// Create processor from chain config (replaces singleton processor.ts)
const processor = createProcessor(chainConfig);

// Bootstrap: discover and register all plugins and handlers (filtered by chain)
const registry = createRegistry(logger, chainConfig);

// Configure processor with log subscriptions from registry
const subscriptions = registry.getLogSubscriptions();
for (const sub of subscriptions) {
  processor.addLog(sub);
}

logger.info(
  { step: 'BOOTSTRAP', component: 'startup', subscriptionCount: subscriptions.length },
  'Processor configured with log subscriptions from registry',
);

// Create pipeline configuration (includes chain config)
const pipelineConfig = createPipelineConfig(registry, logger, chainConfig);
logger.info({ step: 'BOOTSTRAP', component: 'startup' }, 'Pipeline configuration created');

// Start processor with per-chain state schema (D016)
logger.info({ step: 'BOOTSTRAP', component: 'startup' }, 'Starting processor — indexer ready');

processor.run(
  new TypeormDatabase({ stateSchema: `squid_processor_${chainConfig.network}` }),
  async (ctx) => {
    await processBatch(ctx, pipelineConfig);
  },
);
