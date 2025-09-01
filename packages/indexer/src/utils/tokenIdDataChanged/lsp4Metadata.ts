import { ExtractParams } from '@/types';
import { decodeVerifiableUri, generateTokenId } from '@/utils';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP4Metadata, NFT } from '@chillwhales/sqd-typeorm';

export function extract({ block, log }: ExtractParams): LSP4Metadata {
  const timestamp = new Date(block.header.timestamp);
  const { address } = log;
  const { dataValue, tokenId } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);
  const { value: url, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP4Metadata({
    id: generateTokenId({ address, tokenId }),
    timestamp,
    address,
    tokenId,
    nft: new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      address,
    }),
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
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
    (entity) =>
      new LSP4Metadata({
        ...entity,
        digitalAsset: validDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
        nft: validDigitalAssets.has(entity.address)
          ? new NFT({
              ...entity.nft,
              digitalAsset: new DigitalAsset({ id: entity.address }),
            })
          : entity.nft,
      }),
  );
}
