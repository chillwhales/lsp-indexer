import { EvmBatchProcessor } from '@subsquid/evm-processor';

/**
 * Subsquid processor for V2 indexer.
 *
 * Configured with LUKSO mainnet RPC and archive endpoints.
 * Log subscriptions will be added by registry wiring in next plan.
 */

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://rpc.lukso.network';
const ARCHIVE_URL =
  process.env.ARCHIVE_URL || 'https://v2.archive.subsquid.io/network/lukso-mainnet';

export const processor = new EvmBatchProcessor()
  .setGateway(ARCHIVE_URL)
  .setRpcEndpoint(RPC_ENDPOINT)
  .setFinalityConfirmation(75)
  .setBlockRange({ from: 0 })
  .setFields({
    log: {
      topics: true,
      data: true,
    },
  });
