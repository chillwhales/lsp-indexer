import { ExtractParams } from '@/types';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/abi';
import { DigitalAsset, NFT } from '@chillwhales/typeorm';
import { zeroAddress } from 'viem';
import { generateTokenId } from '..';

export function extract({ log }: ExtractParams): NFT | null {
  const { address } = log;
  const { from, to, tokenId } = LSP8IdentifiableDigitalAsset.events.Transfer.decode(log);

  if (from === zeroAddress)
    return new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      address,
      digitalAsset: new DigitalAsset({ id: address, address }),
      isMinted: true,
      isBurned: false,
    });

  if (to === zeroAddress)
    return new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      address,
      digitalAsset: new DigitalAsset({ id: address, address }),
      isMinted: false,
      isBurned: true,
    });

  return null;
}

export function populate({
  entities,
  validDigitalAssets,
}: {
  entities: NFT[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return entities.map((entity) => {
    const digitalAsset = validDigitalAssets.get(entity.address);

    return new NFT({
      ...entity,
      digitalAsset: digitalAsset ? new DigitalAsset({ id: entity.address }) : null,
    });
  });
}
