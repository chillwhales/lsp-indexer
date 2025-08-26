import * as Utils from '@/utils';
import { LSP7DigitalAsset } from '@chillwhales/sqd-abi';
import { Aggregate3StaticReturn } from '@chillwhales/sqd-abi/lib/abi/Multicall3';
import { DigitalAsset } from '@chillwhales/sqd-typeorm';
import { INTERFACE_ID_LSP7, INTERFACE_ID_LSP7_PREVIOUS } from '@lukso/lsp7-contracts';
import { INTERFACE_ID_LSP8, INTERFACE_ID_LSP8_PREVIOUS } from '@lukso/lsp8-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { hexToBool, isHex } from 'viem';

const calldatasByInterfaceId = [
  LSP7DigitalAsset.functions.supportsInterface.encode({
    interfaceId: INTERFACE_ID_LSP7,
  }),
  LSP7DigitalAsset.functions.supportsInterface.encode({
    interfaceId: INTERFACE_ID_LSP8,
  }),
  LSP7DigitalAsset.functions.supportsInterface.encode({
    interfaceId: INTERFACE_ID_LSP7_PREVIOUS['v0.14.0'],
  }),
  LSP7DigitalAsset.functions.supportsInterface.encode({
    interfaceId: INTERFACE_ID_LSP8_PREVIOUS['v0.14.0'],
  }),
  LSP7DigitalAsset.functions.supportsInterface.encode({
    interfaceId: INTERFACE_ID_LSP7_PREVIOUS['v0.12.0'],
  }),
  LSP7DigitalAsset.functions.supportsInterface.encode({
    interfaceId: INTERFACE_ID_LSP8_PREVIOUS['v0.12.0'],
  }),
];

interface VerifyParams {
  context: DataHandlerContext<Store, {}>;
  digitalAssets: Set<string>;
}

export async function verify({ context, digitalAssets }: VerifyParams): Promise<{
  newDigitalAssets: Map<string, DigitalAsset>;
  validDigitalAssets: Map<string, DigitalAsset>;
  invalidDigitalAssets: Map<string, DigitalAsset>;
}> {
  const addressArray = [...digitalAssets];
  const knownDigitalAssets: Map<string, DigitalAsset> = await context.store
    .findBy(DigitalAsset, { id: In(addressArray) })
    .then((ts) => new Map(ts.map((t) => [t.id, t])));

  if (addressArray.length === knownDigitalAssets.size)
    return {
      newDigitalAssets: new Map(),
      validDigitalAssets: knownDigitalAssets,
      invalidDigitalAssets: new Map(),
    };

  let unverifiedDigitalAssets = addressArray.filter((address) => !knownDigitalAssets.has(address));
  const newDigitalAssets = new Map<string, DigitalAsset>();

  for (const callData of calldatasByInterfaceId) {
    if (unverifiedDigitalAssets.length === 0) continue;

    const result: Aggregate3StaticReturn = [];
    let batchIndex = 0;
    const batchSize = 100;
    while (batchIndex * batchSize < unverifiedDigitalAssets.length) {
      const verifiedCount = batchIndex * batchSize;
      const unverifiedCount = unverifiedDigitalAssets.length - verifiedCount;
      const progress = {
        message: 'Verifing supported standards for Digital Assets',
        ...LSP7DigitalAsset.functions.supportsInterface.decode(callData),
        batchIndex,
        batchSize: Math.min(unverifiedCount, batchSize),
        verifiedCount,
        unverifiedCount,
        totalCount: unverifiedDigitalAssets.length,
      };

      context.log.info(JSON.stringify(progress));
      result.push(
        ...(await Utils.Multicall3.aggregate3StaticLatest({
          context,
          calls: unverifiedDigitalAssets
            .slice(verifiedCount, verifiedCount + progress.batchSize)
            .map((target) => ({
              target,
              allowFailure: true,
              callData,
            })),
        })),
      );

      batchIndex++;
      await Utils.timeout(1000);
    }

    unverifiedDigitalAssets.forEach((address, index) =>
      result[index].success &&
      isHex(result[index].returnData) &&
      result[index].returnData !== '0x' &&
      hexToBool(result[index].returnData)
        ? newDigitalAssets.set(address, new DigitalAsset({ id: address, address }))
        : null,
    );

    unverifiedDigitalAssets = unverifiedDigitalAssets.filter(
      (address) => !newDigitalAssets.has(address),
    );
  }

  return {
    newDigitalAssets,
    validDigitalAssets: new Map(
      addressArray
        .filter((address) => knownDigitalAssets.has(address) || newDigitalAssets.has(address))
        .map((address) => [address, new DigitalAsset({ id: address, address })]),
    ),
    invalidDigitalAssets: new Map(
      addressArray
        .filter((address) => !knownDigitalAssets.has(address) && !newDigitalAssets.has(address))
        .map((address) => [address, new DigitalAsset({ id: address, address })]),
    ),
  };
}
