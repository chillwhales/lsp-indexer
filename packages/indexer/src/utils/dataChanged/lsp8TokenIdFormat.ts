import { ExtractParams } from '@/types';
import { decodeTokenIdFormat } from '@/utils';
import { ERC725Y } from '@chillwhales/abi';
import { DigitalAsset, LSP8TokenIdFormat } from '@chillwhales/typeorm';
import { hexToNumber, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP8TokenIdFormat {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP8TokenIdFormat({
    id: address,
    timestamp: new Date(timestamp),
    address,
    value:
      !isHex(dataValue) || dataValue === '0x' ? null : decodeTokenIdFormat(hexToNumber(dataValue)),
    rawValue: dataValue,
  });
}

export function populate({
  lsp8TokenIdFormatEntities,
  validDigitalAssets,
}: {
  lsp8TokenIdFormatEntities: LSP8TokenIdFormat[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp8TokenIdFormatEntities.map(
    (event) =>
      new LSP8TokenIdFormat({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
