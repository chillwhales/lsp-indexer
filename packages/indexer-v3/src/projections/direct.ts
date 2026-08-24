import {
  BaseError,
  ContractFunctionRevertedError,
  decodeFunctionResult,
  encodeFunctionData,
  ExecutionRevertedError,
  getAddress,
  isHex,
  multicall3Abi,
  RpcRequestError,
  type Hex,
} from 'viem';
import { normalizeBytes32 } from '../db/identity.js';
import type { NetworkRpcClient } from '../rpc/index.js';
import type { ProjectionBlockRef } from './block.js';

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
        cause instanceof ExecutionRevertedError ||
        cause instanceof ContractFunctionRevertedError ||
        (cause instanceof RpcRequestError &&
          (cause.code === ExecutionRevertedError.code ||
            ExecutionRevertedError.nodeMessage.test(cause.details))),
    ) != null
  );
}

function normalizeBlockHash(block: ProjectionBlockRef): Hex {
  const blockHash = normalizeBytes32(block.hash, `Portal block ${block.number} hash`);
  if (!isHex(blockHash)) throw new Error(`Portal block ${block.number} hash is not hexadecimal`);
  return blockHash;
}

async function requestContractCall(
  rpc: Pick<NetworkRpcClient, 'request'>,
  blockHash: Hex,
  address: string,
  data: Hex,
): Promise<Hex> {
  return rpc.request({
    method: 'eth_call',
    params: [
      { to: getAddress(address), data },
      { blockHash, requireCanonical: true },
    ],
  });
}

async function executeDirectContractCall<T>(
  rpc: Pick<NetworkRpcClient, 'request'>,
  blockHash: Hex,
  call: DirectContractCall<T>,
): Promise<DirectContractCallResult<T>> {
  let data: Hex;
  try {
    data = await requestContractCall(rpc, blockHash, call.address, call.data);
  } catch (error) {
    if (isContractRevert(error)) return { status: 'failure' };
    throw error;
  }

  if (data === '0x') return { status: 'failure' };
  const value = call.decode(data);
  return value === undefined ? { status: 'failure' } : { status: 'success', value };
}

/** Execute hash-bound calls directly in bounded RPC batches without hiding transport failures. */
export async function executeDirectContractCalls<T>(
  rpc: Pick<NetworkRpcClient, 'request'>,
  block: ProjectionBlockRef,
  calls: readonly DirectContractCall<T>[],
  batchSize: number,
): Promise<DirectContractCallResult<T>[]> {
  const blockHash = normalizeBlockHash(block);
  const results: DirectContractCallResult<T>[] = [];
  for (let offset = 0; offset < calls.length; offset += batchSize) {
    results.push(
      ...(await Promise.all(
        calls
          .slice(offset, offset + batchSize)
          .map((call) => executeDirectContractCall(rpc, blockHash, call)),
      )),
    );
  }
  return results;
}

/** Execute one hash-bound Multicall3 aggregate and decode each allowed-to-fail result. */
export async function executeMulticallContractCalls<T>(
  rpc: Pick<NetworkRpcClient, 'request'>,
  block: ProjectionBlockRef,
  multicallAddress: string,
  calls: readonly DirectContractCall<T>[],
): Promise<DirectContractCallResult<T>[]> {
  if (calls.length === 0) return [];

  const aggregateData = encodeFunctionData({
    abi: multicall3Abi,
    functionName: 'aggregate3',
    args: [
      calls.map((call) => ({
        target: getAddress(call.address),
        allowFailure: true,
        callData: call.data,
      })),
    ],
  });
  const response = await requestContractCall(
    rpc,
    normalizeBlockHash(block),
    multicallAddress,
    aggregateData,
  );
  const aggregateResults = decodeFunctionResult({
    abi: multicall3Abi,
    functionName: 'aggregate3',
    data: response,
  });
  if (aggregateResults.length !== calls.length) {
    throw new Error(
      `Multicall3 returned ${aggregateResults.length} results for ${calls.length} calls at block ${block.number}`,
    );
  }

  return aggregateResults.map((result, index): DirectContractCallResult<T> => {
    const call = calls[index];
    if (!result.success || call == null) return { status: 'failure' };
    const value = call.decode(result.returnData);
    return value === undefined ? { status: 'failure' } : { status: 'success', value };
  });
}
