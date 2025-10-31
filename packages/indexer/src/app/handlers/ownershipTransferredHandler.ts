import { Context } from '@/types';
import {
  DigitalAssetOwner,
  OwnershipTransferred,
  UniversalProfileOwner,
} from '@chillwhales/typeorm';

export async function ownershipTransferredHandler({
  context,
  populatedOwnershipTransferredEntities,
}: {
  context: Context;
  populatedOwnershipTransferredEntities: OwnershipTransferred[];
}) {
  const universalProfileOwners = new Map<string, UniversalProfileOwner>();
  const digitalAssetOwners = new Map<string, DigitalAssetOwner>();

  for (const {
    address,
    timestamp,
    universalProfile,
    digitalAsset,
    newOwner,
  } of populatedOwnershipTransferredEntities) {
    if (universalProfile) {
      universalProfileOwners.set(
        address,
        new UniversalProfileOwner({
          id: address,
          timestamp: timestamp,
          address: newOwner,
          universalProfile,
        }),
      );
    }
    if (digitalAsset) {
      digitalAssetOwners.set(
        address,
        new DigitalAssetOwner({
          id: address,
          timestamp: timestamp,
          address: newOwner,
          digitalAsset,
        }),
      );
    }
  }

  await context.store.upsert([...universalProfileOwners.values()]);
  await context.store.upsert([...digitalAssetOwners.values()]);
}
