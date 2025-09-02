import { ExtractParams } from '@/types';
import { decodeTokenType } from '@/utils';
import { ERC725Y } from '@chillwhales/abi';
import { DigitalAsset, LSP4TokenType } from '@chillwhales/typeorm';
import { hexToNumber, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4TokenType {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4TokenType({
    id: address,
    timestamp: new Date(timestamp),
    address,
    value: !isHex(dataValue) || dataValue === '0x' ? null : decodeTokenType(hexToNumber(dataValue)),
    rawValue: dataValue,
  });
}

export function populate({
  lsp4TokenTypeEntities,
  validDigitalAssets,
}: {
  lsp4TokenTypeEntities: LSP4TokenType[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4TokenTypeEntities.map(
    (event) =>
      new LSP4TokenType({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
