import { BlockData, DataHandlerContext, Log } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

export interface ExtractParams {
  context: DataHandlerContext<Store, {}>;
  block: BlockData;
  log: Log;
}

export interface ChillMintTransfer {
  timestamp: number;
  address: string;
  from: string;
  to: string;
  amount: bigint;
  transactionHash?: string;
}
