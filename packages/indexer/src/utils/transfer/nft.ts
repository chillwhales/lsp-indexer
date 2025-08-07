import { ExtractParams } from '@/types';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP8TokenIdFormatEnum, NFT } from '@chillwhales/sqd-typeorm';
import { isHex, zeroAddress } from 'viem';
import { formatTokenId, generateTokenId } from '..';

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

    const lsp8TokenIdFormat =
      digitalAsset.lsp8TokenIdFormat.length > 0
        ? digitalAsset.lsp8TokenIdFormat.sort(
            (a, b) => b.timestamp.valueOf() - a.timestamp.valueOf(),
          )[0].value || LSP8TokenIdFormatEnum.NUMBER
        : LSP8TokenIdFormatEnum.NUMBER;

    return new NFT({
      ...entity,
      formattedTokenId: isHex(entity.tokenId)
        ? formatTokenId({ tokenId: entity.tokenId, lsp8TokenIdFormat })
        : null,
      digitalAsset: digitalAsset ? new DigitalAsset({ id: entity.address }) : null,
    });
  });
}
