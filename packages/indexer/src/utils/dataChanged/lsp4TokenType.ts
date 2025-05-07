import { ExtractParams } from '@/types';
import { decodeTokenType } from '@/utils';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP4TokenType } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';
import { hexToNumber, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4TokenType {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4TokenType({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    value: !isHex(dataValue) || dataValue === '0x' ? null : decodeTokenType(hexToNumber(dataValue)),
  });
}

export function populate({
  entities,
  unverifiedDigitalAssets,
}: {
  entities: LSP4TokenType[];
  unverifiedDigitalAssets: Map<string, DigitalAsset>;
}) {
  return entities.map(
    (event) =>
      new LSP4TokenType({
        ...event,
        digitalAsset: !unverifiedDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
