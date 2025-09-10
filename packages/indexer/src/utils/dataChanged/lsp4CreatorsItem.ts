import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { DigitalAsset, LSP4CreatorsItem } from '@chillwhales/typeorm';
import { bytesToBigInt, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4CreatorsItem {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4CreatorsItem({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    creatorAddress: hexToBytes(dataValue as Hex).length === 20 ? dataValue : null,
    creatorIndex: bytesToBigInt(hexToBytes(dataKey as Hex).slice(16)),
    rawValue: dataValue,
  });
}

export function populate({
  lsp4CreatorsItemEntities,
  validDigitalAssets,
}: {
  lsp4CreatorsItemEntities: LSP4CreatorsItem[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4CreatorsItemEntities.map(
    (event) =>
      new LSP4CreatorsItem({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
