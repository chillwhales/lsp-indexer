import { ExtractParams } from '@/types';
import { decodeVerifiableUri, generateTokenId } from '@/utils';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP4MetadataUrl, NFT } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): LSP4MetadataUrl {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue, tokenId } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);
  const { value, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP4MetadataUrl({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    tokenId,
    nft: new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      address,
    }),
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
    (entity) =>
      new LSP4MetadataUrl({
        ...entity,
        digitalAsset: !unverifiedDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
        nft: !unverifiedDigitalAssets.has(entity.address)
          ? new NFT({
              ...entity.nft,
              digitalAsset: new DigitalAsset({ id: entity.address }),
            })
          : entity.nft,
      }),
  );
}
