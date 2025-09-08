import { CHILLWHALES_ADDRESS, ORBS_ADDRESS } from '@/constants';
import { Context } from '@/types';
import * as Utils from '@/utils';
import { DigitalAsset, NFT, OrbsClaimed, Transfer } from '@chillwhales/typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

export async function orbsClaimedHandler({
  context,
  populatedTransferEntities,
}: {
  context: Context;
  populatedTransferEntities: Transfer[];
}) {
  const chillwhalesMintedTransferEntities = populatedTransferEntities.filter(
    (event) =>
      isAddressEqual(CHILLWHALES_ADDRESS, getAddress(event.address)) &&
      isAddressEqual(zeroAddress, getAddress(event.from)),
  );
  if (chillwhalesMintedTransferEntities.length) {
    await context.store.insert(
      chillwhalesMintedTransferEntities.map(
        ({ tokenId }) =>
          new OrbsClaimed({
            id: Utils.generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId }),
            address: CHILLWHALES_ADDRESS,
            digitalAsset: new DigitalAsset({ id: CHILLWHALES_ADDRESS }),
            tokenId,
            nft: new NFT({
              id: Utils.generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId }),
            }),
            value: false,
          }),
      ),
    );
  }

  if (context.isHead) {
    const existingOrbsClaimedEntities = await context.store.findBy(OrbsClaimed, { value: true });
    const orbsMintTransfers = populatedTransferEntities.filter(
      (event) =>
        isAddressEqual(ORBS_ADDRESS, getAddress(event.address)) &&
        isAddressEqual(zeroAddress, getAddress(event.from)),
    );
    if (existingOrbsClaimedEntities.length === 0 || orbsMintTransfers.length > 0) {
      const orbsClaimedEntities = await Utils.OrbsClaimed.extract(
        context,
        existingOrbsClaimedEntities,
      );

      context.log.info(
        JSON.stringify({
          message: "'OrbsClaimed' entities found.",
          orbsClaimedEntitiesCount: orbsClaimedEntities.length,
        }),
      );

      await context.store.upsert(orbsClaimedEntities);
    }
  }
}
