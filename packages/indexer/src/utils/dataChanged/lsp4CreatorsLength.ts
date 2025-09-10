import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { DigitalAsset, LSP4CreatorsLength } from '@chillwhales/typeorm';
import { hexToBigInt, hexToBytes, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4CreatorsLength {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4CreatorsLength({
    id: address,
    timestamp: new Date(timestamp),
    address,
    value: isHex(dataValue)
      ? hexToBytes(dataValue).length === 16
        ? hexToBigInt(dataValue)
        : null
      : null,
    rawValue: dataValue,
  });
}

export function populate({
  lsp4CreatorsLengthEntities,
  validDigitalAssets,
}: {
  lsp4CreatorsLengthEntities: LSP4CreatorsLength[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4CreatorsLengthEntities.map(
    (event) =>
      new LSP4CreatorsLength({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
