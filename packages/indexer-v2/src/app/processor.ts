import { FINALITY_CONFIRMATION, RPC_RATE_LIMIT, RPC_URL, SQD_GATEWAY } from '@/constants';
import { EvmBatchProcessor } from '@subsquid/evm-processor';

/**
 * Subsquid processor for V2 indexer.
 *
 * Configured with LUKSO mainnet RPC and archive endpoints.
 * Log subscriptions will be added by registry wiring in next plan.
 */

export const processor = new EvmBatchProcessor()
  .setGateway(SQD_GATEWAY)
  .setRpcEndpoint({
    url: RPC_URL,
    rateLimit: RPC_RATE_LIMIT,
  })
  .setFinalityConfirmation(FINALITY_CONFIRMATION)
  .setBlockRange({ from: 0 })
  .setMaxBatchSize(10000) // Limit batch size to prevent OOM during large syncs
  .setFields({
    log: {
      address: true,
      topics: true,
      data: true,
      logIndex: true,
      transactionIndex: true,
    },
  });
