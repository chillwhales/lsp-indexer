import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP4TokenName } from '@chillwhales/sqd-typeorm';
import { hexToString, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4TokenName {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4TokenName({
    id: address,
    timestamp: new Date(timestamp),
    address,
    value: !isHex(dataValue) || dataValue === '0x' ? null : hexToString(dataValue),
    rawValue: dataValue,
  });
}

export function populate({
  lsp4TokenNameEntities,
  validDigitalAssets,
}: {
  lsp4TokenNameEntities: LSP4TokenName[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4TokenNameEntities.map(
    (event) =>
      new LSP4TokenName({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
