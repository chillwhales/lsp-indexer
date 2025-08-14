import { FieldSelection } from '@/app/processor';
import { DigitalAsset, OwnedAsset, UniversalProfile } from '@chillwhales/sqd-typeorm';
import { BlockData } from '@subsquid/evm-processor';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';
import { generateOwnedAssetId } from '..';

export function getOwnedAsset({
  address,
  from,
  to,
  amount,
  digitalAsset,
  block,
  updatedOwnedAssetsMap,
  existingOwnedAssetsMap,
  validUniversalProfiles,
}: {
  address: string;
  from: string;
  to: string;
  amount: bigint;
  digitalAsset: DigitalAsset;
  block: BlockData<FieldSelection>;
  updatedOwnedAssetsMap: Map<string, OwnedAsset>;
  existingOwnedAssetsMap: Map<string, OwnedAsset>;
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  const fromId = generateOwnedAssetId({ owner: from, address });
  const toId = generateOwnedAssetId({ owner: to, address });

  if (!isAddressEqual(getAddress(from), zeroAddress)) {
    if (updatedOwnedAssetsMap.has(fromId)) {
      const existingOwnedAsset = updatedOwnedAssetsMap.get(fromId);

      updatedOwnedAssetsMap.set(
        fromId,
        new OwnedAsset({
          ...existingOwnedAsset,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          balance: existingOwnedAsset.balance - amount,
        }),
      );
    } else if (existingOwnedAssetsMap.has(fromId)) {
      const existingOwnedAsset = existingOwnedAssetsMap.get(fromId);

      updatedOwnedAssetsMap.set(
        fromId,
        new OwnedAsset({
          ...existingOwnedAsset,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          balance: existingOwnedAsset.balance - amount,
        }),
      );
    }
  }

  if (!isAddressEqual(getAddress(to), zeroAddress)) {
    if (updatedOwnedAssetsMap.has(toId)) {
      const existingOwnedAsset = updatedOwnedAssetsMap.get(toId);

      updatedOwnedAssetsMap.set(
        toId,
        new OwnedAsset({
          ...existingOwnedAsset,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          balance: existingOwnedAsset.balance + amount,
        }),
      );
    } else if (existingOwnedAssetsMap.has(toId)) {
      const existingOwnedAsset = existingOwnedAssetsMap.get(toId);

      updatedOwnedAssetsMap.set(
        toId,
        new OwnedAsset({
          ...existingOwnedAsset,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          balance: existingOwnedAsset.balance + amount,
        }),
      );
    } else {
      updatedOwnedAssetsMap.set(
        toId,
        new OwnedAsset({
          id: toId,
          block: block.header.height,
          timestamp: new Date(block.header.timestamp),
          balance: amount,
          address,
          digitalAsset,
          owner: to,
          universalProfile: validUniversalProfiles.has(to)
            ? new UniversalProfile({ id: validUniversalProfiles.get(to).id })
            : null,
        }),
      );
    }
  }
}
