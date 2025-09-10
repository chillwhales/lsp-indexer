import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { DigitalAsset, LSP4CreatorsMap } from '@chillwhales/typeorm';
import { bytesToBigInt, bytesToHex, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4CreatorsMap {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4CreatorsMap({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    creatorAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
    creatorInterfaceId:
      hexToBytes(dataValue as Hex).length === 20
        ? bytesToHex(hexToBytes(dataValue as Hex).slice(0, 4))
        : null,
    creatorIndex:
      hexToBytes(dataValue as Hex).length === 20
        ? bytesToBigInt(hexToBytes(dataValue as Hex).slice(4))
        : null,
    rawValue: dataValue,
  });
}

export function populate({
  lsp4CreatorsMapEntities,
  validDigitalAssets,
}: {
  lsp4CreatorsMapEntities: LSP4CreatorsMap[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4CreatorsMapEntities.map(
    (event) =>
      new LSP4CreatorsMap({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
