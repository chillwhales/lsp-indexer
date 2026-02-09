/**
 * Pipeline configuration module for V2 indexer.
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
  // Read worker pool size from environment variable (default: 4)
  const poolSize = parseInt(process.env.METADATA_WORKER_POOL_SIZE || '4', 10);
  const workerPool = new MetadataWorkerPool({ poolSize });

  // Create verification function with LRU cache
  const verifyAddresses = createVerifyFn();

  return {
    registry,
    verifyAddresses,
    workerPool,
  };
}
