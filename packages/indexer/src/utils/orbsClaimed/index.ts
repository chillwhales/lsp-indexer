import { FieldSelection } from '@/app/processor';
import { CHILLWHALES_ADDRESS, ORBS_ADDRESS } from '@/constants';
import * as Utils from '@/utils';
import { ORBS } from '@chillwhales/sqd-abi';
import { Aggregate3StaticReturn } from '@chillwhales/sqd-abi/lib/abi/Multicall3';
import { DigitalAsset, NFT, OrbsClaimed } from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { ILike, In, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { hexToBool, isHex } from 'viem';

export async function extract(
  context: DataHandlerContext<Store, FieldSelection>,
  existingOrbsClaimedEntities: OrbsClaimed[],
): Promise<OrbsClaimed[]> {
  const nftsWithUnclaimedOrbs = await context.store.findBy(NFT, {
    address: ILike(CHILLWHALES_ADDRESS),
    tokenId: Not(In(existingOrbsClaimedEntities.map((entity) => entity.tokenId))),
  });

  const result: Aggregate3StaticReturn = [];
  let batchIndex = 0;
  const batchSize = 500;
  while (batchIndex * batchSize < nftsWithUnclaimedOrbs.length) {
    const verifiedCount = batchIndex * batchSize;
    const unverifiedCount = nftsWithUnclaimedOrbs.length - verifiedCount;
    const progress = {
      message: 'Verifing ORBS claimed',
      batchIndex,
      batchSize: Math.min(unverifiedCount, batchSize),
      verifiedCount,
      unverifiedCount,
      totalCount: nftsWithUnclaimedOrbs.length,
    };

    context.log.info(JSON.stringify(progress));
    result.push(
      ...(await Utils.Multicall3.aggregate3StaticLatest({
        context,
        calls: nftsWithUnclaimedOrbs
          .slice(verifiedCount, verifiedCount + progress.batchSize)
          .map((nft) => ({
            target: ORBS_ADDRESS,
            allowFailure: true,
            callData: ORBS.functions.getChillwhaleClaimStatus.encode({ tokenId: nft.tokenId }),
          })),
      })),
    );

    batchIndex++;
    await Utils.timeout(1000);
  }

  const newOrbsClaimedEntities: OrbsClaimed[] = [];
  nftsWithUnclaimedOrbs.forEach((nft, index) => {
    if (
      result[index].success &&
      isHex(result[index].returnData) &&
      hexToBool(result[index].returnData)
    )
      newOrbsClaimedEntities.push(
        new OrbsClaimed({
          id: uuidv4(),
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

  return newOrbsClaimedEntities;
}
