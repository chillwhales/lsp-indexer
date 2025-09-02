import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { DigitalAsset, LSP4TokenSymbol } from '@chillwhales/typeorm';
import { hexToString, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4TokenSymbol {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4TokenSymbol({
    id: address,
    timestamp: new Date(timestamp),
    address,
    value: !isHex(dataValue) || dataValue === '0x' ? null : hexToString(dataValue),
    rawValue: dataValue,
  });
}

export function populate({
  lsp4TokenSymbolEntities,
  validDigitalAssets,
}: {
  lsp4TokenSymbolEntities: LSP4TokenSymbol[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4TokenSymbolEntities.map(
    (event) =>
      new LSP4TokenSymbol({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
