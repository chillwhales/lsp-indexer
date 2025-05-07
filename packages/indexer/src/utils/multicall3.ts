import { MULTICALL_ADDRESS } from '@/constants';
import { getLatestBlockNumber } from '@/utils';
import { Multicall3 } from '@chillwhales/sqd-abi';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

export async function aggregate3Static({
  context,
  calls,
  block,
}: {
  context: DataHandlerContext<Store, {}>;
  block?: { height: number };
} & Multicall3.Aggregate3StaticParams): Promise<Multicall3.Aggregate3StaticReturn> {
  if (!block)
    block = {
      height: await getLatestBlockNumber({ context }),
    };

  const contract = new Multicall3.Contract(context, block, MULTICALL_ADDRESS);
  const result = await contract.aggregate3Static(calls);

  return result;
}
