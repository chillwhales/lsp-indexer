import { CHILL_ADDRESS, CHILLWHALES_ADDRESS } from '@/constants';
import { Context } from '@/types';
import * as Utils from '@/utils';
import { ChillClaimed, DigitalAsset, NFT, Transfer } from '@chillwhales/typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

export async function chillClaimedHandler({
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
          new ChillClaimed({
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
    const existingChillClaimedEntities = await context.store.findBy(ChillClaimed, { value: true });
    const chillMintTransfers = populatedTransferEntities.filter(
      (event) =>
        isAddressEqual(CHILL_ADDRESS, getAddress(event.address)) &&
        isAddressEqual(zeroAddress, getAddress(event.from)),
    );

    if (existingChillClaimedEntities.length === 0 || chillMintTransfers.length > 0) {
      const chillClaimedEntities = await Utils.ChillClaimed.extract(
        context,
        existingChillClaimedEntities,
      );

      context.log.info(
        JSON.stringify({
          message: "'ChillClaimed' entities found.",
          chillClaimedEntitiesCount: chillClaimedEntities.length,
        }),
      );

      await context.store.upsert(chillClaimedEntities);
    }
  }
}
