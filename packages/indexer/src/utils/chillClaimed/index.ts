import { CHILL_ADDRESS, CHILLWHALES_ADDRESS } from '@/constants/chillwhales';
import { Context } from '@/types';
import * as Utils from '@/utils';
import { CHILL } from '@chillwhales/abi';
import { Aggregate3StaticReturn } from '@chillwhales/abi/lib/abi/Multicall3';
import { ChillClaimed, DigitalAsset, NFT } from '@chillwhales/typeorm';
import { ILike, In, Not } from 'typeorm';
import { hexToBool, isHex } from 'viem';

export async function extract(
  context: Context,
  existingChillClaimedEntities: ChillClaimed[],
): Promise<ChillClaimed[]> {
  const nftsWithUnclaimedChill = await context.store.findBy(NFT, {
    address: ILike(CHILLWHALES_ADDRESS),
    tokenId: Not(In(existingChillClaimedEntities.map((entity) => entity.tokenId))),
  });

  const result: Aggregate3StaticReturn = [];
  let batchIndex = 0;
  const batchSize = 500;
  while (batchIndex * batchSize < nftsWithUnclaimedChill.length) {
    const verifiedCount = batchIndex * batchSize;
    const unverifiedCount = nftsWithUnclaimedChill.length - verifiedCount;
    const progress = {
      message: 'Verifing CHILL claimed',
      batchIndex,
      batchSize: Math.min(unverifiedCount, batchSize),
      verifiedCount,
      unverifiedCount,
      totalCount: nftsWithUnclaimedChill.length,
    };

    context.log.info(JSON.stringify(progress));
    result.push(
      ...(await Utils.Multicall3.aggregate3StaticLatest({
        context,
        calls: nftsWithUnclaimedChill
          .slice(verifiedCount, verifiedCount + progress.batchSize)
          .map((nft) => ({
            target: CHILL_ADDRESS,
            allowFailure: true,
            callData: CHILL.functions.getClaimedStatusFor.encode({ tokenId: nft.tokenId }),
          })),
      })),
    );

    batchIndex++;
    await Utils.timeout(1000);
  }

  const newChillClaimedEntities: ChillClaimed[] = [];
  nftsWithUnclaimedChill.forEach((nft, index) => {
    if (
      result[index].success &&
      isHex(result[index].returnData) &&
      hexToBool(result[index].returnData)
    )
      newChillClaimedEntities.push(
        new ChillClaimed({
          id: Utils.generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId: nft.tokenId }),
          address: CHILLWHALES_ADDRESS,
          digitalAsset: new DigitalAsset({ id: CHILLWHALES_ADDRESS }),
          tokenId: nft.tokenId,
          nft: new NFT({
            id: Utils.generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId: nft.tokenId }),
          }),
          value: true,
        }),
      );
  });

  return newChillClaimedEntities;
}
