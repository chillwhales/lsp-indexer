/**
 * Pipeline configuration module for the indexer.
 *
 * Assembles the PipelineConfig object required by processBatch, injecting:
 * - PluginRegistry (passed in from bootstrap)
 * - verifyAddresses function (from verification module, config-aware)
 * - MetadataWorkerPool instance (for IPFS/HTTP fetching)
 * - Network + ChainConfig for multi-chain support
 */

import { ChainConfig } from '@/config/chainConfig';
import { MetadataWorkerPool } from '@/core/metadataWorkerPool';
import { PipelineConfig } from '@/core/pipeline';
import { PluginRegistry } from '@/core/registry';
import { createVerifyFn } from '@/core/verification';
import type { Logger } from '@subsquid/logger';

/**
 * Creates the pipeline configuration object for processBatch.
 *
 * @param registry    - Fully initialized PluginRegistry with all plugins and handlers
 * @param logger      - Subsquid Logger instance for structured logging
 * @param chainConfig - Chain configuration for multi-chain support
 * @returns PipelineConfig with registry, verifyAddresses function, worker pool, and chain info
 */
export function createPipelineConfig(
  registry: PluginRegistry,
  logger: Logger,
  chainConfig: ChainConfig,
): PipelineConfig {
  // Read and validate worker pool size from environment variable
  const defaultPoolSize = 4;
  const poolSizeRaw = process.env.METADATA_WORKER_POOL_SIZE;
  let poolSize = parseInt(poolSizeRaw ?? `${defaultPoolSize}`, 10);

  if (!Number.isInteger(poolSize) || poolSize <= 0) {
    logger.warn(
      { poolSizeRaw, defaultPoolSize, step: 'BOOTSTRAP', component: 'config' },
      'Invalid METADATA_WORKER_POOL_SIZE, using default',
    );
    poolSize = defaultPoolSize;
  }

  logger.info(
    { poolSize, step: 'BOOTSTRAP', component: 'config' },
    'MetadataWorkerPool configured',
  );

  const workerPool = new MetadataWorkerPool({ poolSize, ipfsGateway: chainConfig.ipfsGateway });

  // Create verification function with LRU cache and chain-specific multicall address
  const verifyAddresses = createVerifyFn({
    multicallAddress: chainConfig.multicallAddress,
    network: chainConfig.network,
  });

  return {
    registry,
    verifyAddresses,
    workerPool,
    network: chainConfig.network,
    chainConfig,
  };
}
