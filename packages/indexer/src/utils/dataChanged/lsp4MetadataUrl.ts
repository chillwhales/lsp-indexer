import { ExtractParams } from '@/types';
import { decodeVerifiableUri } from '@/utils';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP4MetadataUrl } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): LSP4MetadataUrl {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = LSP8IdentifiableDigitalAsset.events.DataChanged.decode(log);
  const { value, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP4MetadataUrl({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    rawBytes: dataValue,
    value,
    decodeError,
  });
}

export function populate({
  entities,
  unverifiedDigitalAssets,
}: {
  entities: LSP4MetadataUrl[];
  unverifiedDigitalAssets: Map<string, DigitalAsset>;
}) {
  return entities.map(
    (event) =>
      new LSP4MetadataUrl({
        ...event,
        digitalAsset: !unverifiedDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
