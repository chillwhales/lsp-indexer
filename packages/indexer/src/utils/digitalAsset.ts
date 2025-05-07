import { getLatestBlockNumber, Multicall3Utils } from '@/utils';
import { LSP7DigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset } from '@chillwhales/sqd-typeorm';
import { INTERFACE_ID_LSP7, INTERFACE_ID_LSP7_PREVIOUS } from '@lukso/lsp7-contracts';
import { INTERFACE_ID_LSP8, INTERFACE_ID_LSP8_PREVIOUS } from '@lukso/lsp8-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { hexToBool, isHex } from 'viem';

interface CustomParams {
  context: DataHandlerContext<Store, {}>;
  addressSet: Set<string>;
}

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

export async function verify({ context, addressSet }: CustomParams): Promise<{
  verifiedDigitalAssets: Map<string, DigitalAsset>;
  unverifiedDigitalAssets: Map<string, DigitalAsset>;
}> {
  const addressArray = [...addressSet];
  const knownDigitalAssets: Map<string, DigitalAsset> = await context.store
    .findBy(DigitalAsset, { id: In(addressArray) })
    .then((ts) => new Map(ts.map((t) => [t.id, t])));

  if (addressArray.length === knownDigitalAssets.size)
    return {
      verifiedDigitalAssets: new Map(),
      unverifiedDigitalAssets: new Map(),
    };

  const block = {
    height: await getLatestBlockNumber({ context }),
  };

  let unverifiedDigitalAssets = addressArray.filter((address) => !knownDigitalAssets.has(address));
  const verifiedDigitalAssets = new Map<string, DigitalAsset>();

  for (const callData of calldatasByInterfaceId) {
    if (unverifiedDigitalAssets.length === 0) continue;

    const result = await Multicall3Utils.aggregate3Static({
      context,
      block,
      calls: unverifiedDigitalAssets.map((target) => ({
        target,
        allowFailure: true,
        callData,
      })),
    });

    unverifiedDigitalAssets.forEach((address, index) => {
      if (
        result[index].success &&
        isHex(result[index].returnData) &&
        hexToBool(result[index].returnData)
      )
        verifiedDigitalAssets.set(address, new DigitalAsset({ id: address, address }));
    });

    unverifiedDigitalAssets = unverifiedDigitalAssets.filter(
      (address) => !verifiedDigitalAssets.has(address),
    );
  }

  return {
    verifiedDigitalAssets,
    unverifiedDigitalAssets: new Map(
      addressArray
        .filter(
          (address) => !knownDigitalAssets.has(address) && !verifiedDigitalAssets.has(address),
        )
        .map((address) => [address, new DigitalAsset({ id: address, address })]),
    ),
  };
}
