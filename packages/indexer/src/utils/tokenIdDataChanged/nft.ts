import { ExtractParams } from '@/types';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, NFT } from '@chillwhales/sqd-typeorm';
import { generateTokenId } from '..';

export function extract({ log }: ExtractParams): NFT {
  const { address } = log;
  const { tokenId } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);

  return new NFT({
    id: generateTokenId({ address, tokenId }),
    tokenId,
    address,
    isMinted: false,
    isBurned: false,
  });
}

export function populate({
  entities,
  validDigitalAssets,
}: {
  entities: NFT[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return entities.map(
    (entity) =>
      new NFT({
        ...entity,
        digitalAsset: validDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
      }),
  );
}
