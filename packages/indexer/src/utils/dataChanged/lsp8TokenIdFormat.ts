import { ExtractParams } from '@/types';
import { decodeTokenIdFormat } from '@/utils';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP8TokenIdFormat } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';
import { hexToNumber, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP8TokenIdFormat {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP8TokenIdFormat({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    value:
      !isHex(dataValue) || dataValue === '0x' ? null : decodeTokenIdFormat(hexToNumber(dataValue)),
    rawValue: dataValue,
  });
}

export function populate({
  lsp8TokenIdFormats,
  validDigitalAssets,
}: {
  lsp8TokenIdFormats: LSP8TokenIdFormat[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp8TokenIdFormats.map(
    (event) =>
      new LSP8TokenIdFormat({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
