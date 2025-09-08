import { Context } from '@/types';
import * as Utils from '@/utils';
import { NFT } from '@chillwhales/typeorm';

export async function verifyEntities({
  context,
  universalProfiles,
  digitalAssets,
  nfts,
}: {
  context: Context;
  universalProfiles: Set<string>;
  digitalAssets: Set<string>;
  nfts: Map<string, NFT>;
}) {
  const [
    { newUniversalProfiles, validUniversalProfiles, invalidUniversalProfiles },
    { newDigitalAssets, validDigitalAssets, invalidDigitalAssets },
    { newNfts, validNfts },
  ] = await Promise.all([
    Utils.UniversalProfile.verify({
      context,
      universalProfiles,
    }),
    Utils.DigitalAsset.verify({
      context,
      digitalAssets,
    }),
    Utils.NFT.verify({ context, nfts }),
  ]);

  if (universalProfiles.size) {
    context.log.info(
      JSON.stringify({
        message: "Verified 'UniversalProfile' entities",
        newUniversalProfilesCount: newUniversalProfiles.size,
        validUniversalProfilesCount: validUniversalProfiles.size,
        invalidUniversalProfilesCount: invalidUniversalProfiles.size,
      }),
    );
  }
  if (digitalAssets.size) {
    context.log.info(
      JSON.stringify({
        message: "Verified 'DigitalAsset' entities",
        newDigitalAssetsCount: newDigitalAssets.size,
        validDigitalAssetsCount: validDigitalAssets.size,
        invalidDigitalAssetsCount: invalidDigitalAssets.size,
      }),
    );
  }
  if (nfts.size) {
    context.log.info(
      JSON.stringify({
        message: "Verified 'NFT' entities",
        newNftsCount: newNfts.size,
        validNftsCount: validNfts.size,
      }),
    );
  }

  return {
    universalProfiles: { newUniversalProfiles, validUniversalProfiles, invalidUniversalProfiles },
    digitalAssets: { newDigitalAssets, validDigitalAssets, invalidDigitalAssets },
    nfts: { newNfts, validNfts },
  };
}
