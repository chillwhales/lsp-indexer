import { normalizeBytes32 } from '../db/identity.js';
import type { NetworkRpcClient } from '../rpc/index.js';

export interface ProjectionBlockRef {
  number: number;
  hash: string;
}

async function readRpcBlockHash(
  rpc: Pick<NetworkRpcClient, 'getBlock'>,
  blockNumber: number,
): Promise<string> {
  const block = await rpc.getBlock({ blockNumber: BigInt(blockNumber) });
  if (block.hash == null) {
    throw new Error(`RPC block ${blockNumber} does not have a hash`);
  }
  return normalizeBytes32(block.hash, `RPC block ${blockNumber} hash`);
}

/** Run an RPC read only while the provider agrees with the Portal's exact block identity. */
export async function readAtVerifiedBlock<T>(
  rpc: Pick<NetworkRpcClient, 'getBlock'>,
  block: ProjectionBlockRef,
  read: () => Promise<T>,
): Promise<T> {
  const expectedHash = normalizeBytes32(block.hash, `Portal block ${block.number} hash`);
  const beforeHash = await readRpcBlockHash(rpc, block.number);
  if (beforeHash !== expectedHash) {
    throw new Error(
      `RPC block ${block.number} hash mismatch: expected ${expectedHash}, received ${beforeHash}`,
    );
  }

  const result = await read();
  const afterHash = await readRpcBlockHash(rpc, block.number);
  if (afterHash !== expectedHash) {
    throw new Error(
      `RPC block ${block.number} changed during projection reads: expected ${expectedHash}, received ${afterHash}`,
    );
  }
  return result;
}
