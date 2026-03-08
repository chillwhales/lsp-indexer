/**
 * Pipeline configuration module for the indexer.
 *
 * Assembles the PipelineConfig object required by processBatch, injecting:
 * - PluginRegistry (passed in from bootstrap)
 * - verifyAddresses function (from verification module)
 * - MetadataWorkerPool instance (for IPFS/HTTP fetching)
 */

import { MetadataWorkerPool } from '@/core/metadataWorkerPool';
import { PipelineConfig } from '@/core/pipeline';
import { PluginRegistry } from '@/core/registry';
import { createVerifyFn } from '@/core/verification';

/**
 * Creates the pipeline configuration object for processBatch.
 *
 * @param registry - Fully initialized PluginRegistry with all plugins and handlers
 * @returns PipelineConfig with registry, verifyAddresses function, and worker pool
 */
export function createPipelineConfig(registry: PluginRegistry): PipelineConfig {
  // Read and validate worker pool size from environment variable
  const defaultPoolSize = 4;
  const poolSizeRaw = process.env.METADATA_WORKER_POOL_SIZE;
  let poolSize = parseInt(poolSizeRaw ?? `${defaultPoolSize}`, 10);

  if (!Number.isInteger(poolSize) || poolSize <= 0) {
    console.error(
      `Invalid METADATA_WORKER_POOL_SIZE='${poolSizeRaw}'. ` +
        `Using default value ${defaultPoolSize}.`,
    );
    poolSize = defaultPoolSize;
  }

  const workerPool = new MetadataWorkerPool({ poolSize });

  // Create verification function with LRU cache
  const verifyAddresses = createVerifyFn();

  return {
    registry,
    verifyAddresses,
    workerPool,
  };
}
