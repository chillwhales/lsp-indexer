/**
 * Processor factory — creates an EvmBatchProcessor from a ChainConfig.
 *
 * Replaces the singleton `processor.ts` with a parameterized factory
 * so the indexer can be started for any supported chain via CHAIN_ID env var.
 */

import { ChainConfig } from '@/config/chainConfig';
import { EvmBatchProcessor } from '@subsquid/evm-processor';

/**
 * Creates an EvmBatchProcessor configured for the given chain.
 *
 * @param config - Chain configuration (RPC, gateway, finality, etc.)
 * @returns Configured EvmBatchProcessor ready for log subscription wiring
 */
export function createProcessor(config: ChainConfig): EvmBatchProcessor {
  const processor = new EvmBatchProcessor();

  // Gateway is optional — testnet has no Subsquid gateway (D017)
  if (config.gateway) {
    processor.setGateway(config.gateway);
  }

  processor
    .setRpcEndpoint({
      url: config.rpcUrl,
      rateLimit: config.rpcRateLimit,
    })
    .setFinalityConfirmation(config.finalityConfirmation)
    .setBlockRange({ from: 0 })
    .setFields({
      log: {
        address: true,
        topics: true,
        data: true,
        logIndex: true,
        transactionIndex: true,
      },
    });

  return processor;
}
