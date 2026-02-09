import { FINALITY_CONFIRMATION, RPC_URL, SQD_GATEWAY } from '@/constants';
import { EvmBatchProcessor } from '@subsquid/evm-processor';

/**
 * Subsquid processor for V2 indexer.
 *
 * Configured with LUKSO mainnet RPC and archive endpoints.
 * Log subscriptions will be added by registry wiring in next plan.
 */

export const processor = new EvmBatchProcessor()
  .setGateway(SQD_GATEWAY)
  .setRpcEndpoint(RPC_URL)
  .setFinalityConfirmation(FINALITY_CONFIRMATION)
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
