import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP4TokenSymbol } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';
import { hexToString, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4TokenSymbol {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4TokenSymbol({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    value: !isHex(dataValue) || dataValue === '0x' ? null : hexToString(dataValue),
  });
}

export function populate({
  entities,
  unverifiedDigitalAssets,
}: {
  entities: LSP4TokenSymbol[];
  unverifiedDigitalAssets: Map<string, DigitalAsset>;
}) {
  return entities.map(
    (event) =>
      new LSP4TokenSymbol({
        ...event,
        digitalAsset: !unverifiedDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
