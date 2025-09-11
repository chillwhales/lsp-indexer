import { Context } from '@/types';
import * as Utils from '@/utils';
import { LSP7DigitalAsset } from '@chillwhales/abi';
import { Decimals, DigitalAsset } from '@chillwhales/typeorm';
import { hexToNumber, isHex } from 'viem';

export async function decimalsHandler({
  context,
  newDigitalAssets,
}: {
  context: Context;
  newDigitalAssets: Map<string, DigitalAsset>;
}) {
  const newDigitalAssetsList = [...newDigitalAssets.values()];
  const newDecimalEntities: Decimals[] = [];
  let processedDigitalAssets = 0;

  const batchesCount =
    newDigitalAssetsList.length % 100
      ? Math.floor(newDigitalAssetsList.length / 100) + 1
      : newDigitalAssetsList.length / 100;

  for (let index = 0; index < batchesCount; index++) {
    const results = await Utils.Multicall3.aggregate3StaticLatest({
      context,
      calls: newDigitalAssetsList.slice(index * 100, (index + 1) * 100).map((digitalAsset) => ({
        target: digitalAsset.address,
        allowFailure: true,
        callData: LSP7DigitalAsset.functions.decimals.encode({}),
      })),
    });

    results.forEach((result) => {
      if (result.success && isHex(result.returnData) && result.returnData !== '0x') {
        newDecimalEntities.push(
          new Decimals({
            id: newDigitalAssetsList[processedDigitalAssets].address,
            address: newDigitalAssetsList[processedDigitalAssets].address,
            digitalAsset: newDigitalAssetsList[processedDigitalAssets],
            value: hexToNumber(result.returnData),
          }),
        );
      }

      processedDigitalAssets++;
    });
  }

  if (newDecimalEntities.length) {
    context.log.info(
      JSON.stringify({
        message: "Inserting new 'Decimals' entities.",
        DecimalsEntitiesCount: newDecimalEntities.length,
      }),
    );

    await context.store.insert(newDecimalEntities);
  }
}
