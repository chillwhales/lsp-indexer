/**
 * Multicall3 utility for batched RPC calls.
 *
 * Provides a shared helper for executing Multicall3.aggregate3Static calls
 * against the latest block. Used by verification.ts and entity handlers
 * (decimals, totalSupply, etc.) to batch contract reads efficiently.
 */
import { MULTICALL_ADDRESS } from '@/constants';
import { Multicall3 } from '@chillwhales/abi';
import { Aggregate3StaticReturn } from '@chillwhales/abi/lib/abi/Multicall3';

import { Context } from './types';

/**
 * Execute a Multicall3.aggregate3Static call against the latest block
 * using raw eth_call (same as v1).
 *
 * @param context - Subsquid batch context (for chain RPC access)
 * @param calls   - Array of target/callData/allowFailure tuples
 * @returns Multicall3 result array (parallel to input calls)
 */
export async function aggregate3StaticLatest(
  context: Context,
  calls: Multicall3.Aggregate3StaticParams['calls'],
): Promise<Aggregate3StaticReturn> {
  const result = await context._chain.client.call<string>('eth_call', [
    {
      from: null,
      to: MULTICALL_ADDRESS,
      data: Multicall3.functions.aggregate3Static.encode({ calls }),
    },
    'latest',
  ]);
  return Multicall3.functions.aggregate3Static.decodeResult(result);
}
