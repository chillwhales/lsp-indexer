import { MULTICALL_ADDRESS } from '@/constants';
import { Multicall3 } from '@chillwhales/abi';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

export async function aggregate3Static({
  context,
  calls,
  block,
}: {
  context: DataHandlerContext<Store, {}>;
  block: { height: number };
} & Multicall3.Aggregate3StaticParams): Promise<Multicall3.Aggregate3StaticReturn> {
  const contract = new Multicall3.Contract(context, block, MULTICALL_ADDRESS);
  const result = await contract.aggregate3Static(calls);

  return result;
}

export async function aggregate3StaticLatest({
  context,
  calls,
}: {
  context: DataHandlerContext<Store, {}>;
} & Multicall3.Aggregate3StaticParams): Promise<Multicall3.Aggregate3StaticReturn> {
  const result = await context._chain.client.call('eth_call', [
    {
      from: null,
      to: MULTICALL_ADDRESS,
      data: Multicall3.functions.aggregate3Static.encode({ calls }),
    },
    'latest',
  ]);
  const decodedResult = Multicall3.functions.aggregate3Static.decodeResult(result);

  return decodedResult;
}
