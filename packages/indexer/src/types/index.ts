import { BlockData, DataHandlerContext, EvmBatchProcessor, Log } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

export interface FieldSelection {}

export type Processor = EvmBatchProcessor<FieldSelection>;

export type Block = BlockData<FieldSelection>;

export type Context = DataHandlerContext<Store, FieldSelection>;

export interface ExtractParams {
  context: Context;
  block: Block;
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
