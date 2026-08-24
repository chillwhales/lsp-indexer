import {
  BaseError,
  ContractFunctionRevertedError,
  ExecutionRevertedError,
  getAddress,
  type Hex,
} from 'viem';
import type { NetworkRpcClient } from '../rpc/index.js';

export interface DirectContractCall<T> {
  address: string;
  data: Hex;
  decode(data: Hex): T | undefined;
}

export type DirectContractCallResult<T> = { status: 'success'; value: T } | { status: 'failure' };

function isContractRevert(error: unknown): boolean {
  if (!(error instanceof BaseError)) return false;
  return (
    error.walk(
      (cause) =>
        cause instanceof ExecutionRevertedError || cause instanceof ContractFunctionRevertedError,
    ) != null
  );
}

async function executeDirectContractCall<T>(
  rpc: Pick<NetworkRpcClient, 'call'>,
  blockNumber: number,
  call: DirectContractCall<T>,
): Promise<DirectContractCallResult<T>> {
  let data: Hex | undefined;
  try {
    ({ data } = await rpc.call({
      to: getAddress(call.address),
      data: call.data,
      blockNumber: BigInt(blockNumber),
    }));
  } catch (error) {
    if (isContractRevert(error)) return { status: 'failure' };
    throw error;
  }

  if (data == null || data === '0x') return { status: 'failure' };
  const value = call.decode(data);
  return value === undefined ? { status: 'failure' } : { status: 'success', value };
}

/** Execute block-pinned calls directly in bounded RPC batches without hiding transport failures. */
export async function executeDirectContractCalls<T>(
  rpc: Pick<NetworkRpcClient, 'call'>,
  blockNumber: number,
  calls: readonly DirectContractCall<T>[],
  batchSize: number,
): Promise<DirectContractCallResult<T>[]> {
  const results: DirectContractCallResult<T>[] = [];
  for (let offset = 0; offset < calls.length; offset += batchSize) {
    results.push(
      ...(await Promise.all(
        calls
          .slice(offset, offset + batchSize)
          .map((call) => executeDirectContractCall(rpc, blockNumber, call)),
      )),
    );
  }
  return results;
}
