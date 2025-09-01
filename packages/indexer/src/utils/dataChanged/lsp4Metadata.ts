import { ExtractParams } from '@/types';
import * as Utils from '@/utils';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP4Metadata } from '@chillwhales/sqd-typeorm';

export function extract({ block, log }: ExtractParams): LSP4Metadata {
  const timestamp = new Date(block.header.timestamp);
  const { address } = log;
  const { dataValue } = LSP8IdentifiableDigitalAsset.events.DataChanged.decode(log);
  const { value: url, decodeError } = Utils.decodeVerifiableUri(dataValue);

  return new LSP4Metadata({
    id: address,
    address,
    timestamp,
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
    isRetryable: false,
    retryCount: 0,
  });
}

export function populate({
  lsp4MetadataEntities,
  validDigitalAssets,
}: {
  lsp4MetadataEntities: LSP4Metadata[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4MetadataEntities.map(
    (event) =>
      new LSP4Metadata({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
