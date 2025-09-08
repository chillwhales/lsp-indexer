import { Block } from '@/types';
import { DigitalAsset, NFT, OwnedAsset, OwnedToken, UniversalProfile } from '@chillwhales/typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';
import { generateOwnedAssetId, generateOwnedTokenId } from '..';

export function getOwnedToken({
  address,
  from,
  to,
  tokenId,
  digitalAsset,
  nft,
  block,
  updatedOwnedTokensMap,
  existingOwnedTokensMap,
  validUniversalProfiles,
}: {
  address: string;
  from: string;
  to: string;
  tokenId: string;
  digitalAsset: DigitalAsset;
  nft: NFT;
  block: Block;
  updatedOwnedTokensMap: Map<string, OwnedToken>;
  existingOwnedTokensMap: Map<string, OwnedToken>;
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  if (!isAddressEqual(getAddress(from), zeroAddress)) {
    const fromId = generateOwnedTokenId({ owner: from, address, tokenId });

    if (updatedOwnedTokensMap.has(fromId)) {
      const existingOwnedToken = updatedOwnedTokensMap.get(fromId);

      updatedOwnedTokensMap.set(
        fromId,
        new OwnedToken({
          ...existingOwnedToken,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          tokenId: null,
        }),
      );
    } else if (existingOwnedTokensMap.has(fromId)) {
      const existingOwnedToken = existingOwnedTokensMap.get(fromId);

      updatedOwnedTokensMap.set(
        fromId,
        new OwnedToken({
          ...existingOwnedToken,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          tokenId: null,
        }),
      );
    }
  }

  if (!isAddressEqual(getAddress(to), zeroAddress)) {
    const toId = generateOwnedTokenId({ owner: to, address, tokenId });

    if (updatedOwnedTokensMap.has(toId)) {
      const existingOwnedToken = updatedOwnedTokensMap.get(toId);

      updatedOwnedTokensMap.set(
        toId,
        new OwnedToken({
          ...existingOwnedToken,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          tokenId,
        }),
      );
    } else if (existingOwnedTokensMap.has(toId)) {
      const existingOwnedToken = existingOwnedTokensMap.get(toId);

      updatedOwnedTokensMap.set(
        toId,
        new OwnedToken({
          ...existingOwnedToken,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          tokenId,
        }),
      );
    } else {
      updatedOwnedTokensMap.set(
        toId,
        new OwnedToken({
          id: toId,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          address,
          digitalAsset,
          tokenId,
          nft,
          owner: to,
          universalProfile: validUniversalProfiles.has(to)
            ? new UniversalProfile({ id: validUniversalProfiles.get(to).id })
            : null,
          ownedAsset: new OwnedAsset({ id: generateOwnedAssetId({ owner: to, address }) }),
        }),
      );
    }
  }
}
