import { Context } from '@/types';
import * as Utils from '@/utils';
import { OwnedAsset, OwnedToken, Transfer, UniversalProfile } from '@chillwhales/typeorm';
import { In } from 'typeorm';

export async function ownedAssetsHandler({
  context,
  populatedTransferEntities,
  validUniversalProfiles,
}: {
  context: Context;
  populatedTransferEntities: Transfer[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  if (populatedTransferEntities.length > 0) {
    const updatedOwnedAssetsMap = new Map<string, OwnedAsset>();
    const updatedOwnedTokensMap = new Map<string, OwnedToken>();
    const [existingOwnedAssetsMap, existingOwnedTokensMap]: [
      Map<string, OwnedAsset>,
      Map<string, OwnedToken>,
    ] = await Promise.all([
      context.store.findBy(OwnedAsset, {
        id: In([
          ...new Set(
            populatedTransferEntities.flatMap(({ address, from, to }) => [
              Utils.generateOwnedAssetId({ address, owner: from }),
              Utils.generateOwnedAssetId({ address, owner: to }),
            ]),
          ),
        ]),
      }),
      context.store.findBy(OwnedToken, {
        id: In([
          ...new Set(
            populatedTransferEntities
              .filter(({ tokenId }) => tokenId)
              .flatMap(({ address, from, to, tokenId }) => [
                Utils.generateOwnedTokenId({ address, owner: from, tokenId }),
                Utils.generateOwnedTokenId({ address, owner: to, tokenId }),
              ]),
          ),
        ]),
      }),
    ]).then(([ownedAssets, ownedTokens]) => [
      new Map(ownedAssets.map((ownedAsset) => [ownedAsset.id, ownedAsset])),
      new Map(ownedTokens.map((ownedToken) => [ownedToken.id, ownedToken])),
    ]);

    context.log.info(
      JSON.stringify({
        message:
          "Extracting updated 'OwnedAsset' entities and 'OwnedToken' entities from 'Transfer' events",
        transfersCount: populatedTransferEntities.length,
      }),
    );

    for (const transfer of populatedTransferEntities) {
      const { address, tokenId, digitalAsset, nft, from, to, amount } = transfer;
      const block = context.blocks.sort((a, b) => b.header.timestamp - a.header.timestamp)[0];

      Utils.Transfer.OwnedAsset.getOwnedAsset({
        address,
        from,
        to,
        amount,
        digitalAsset,
        block,
        updatedOwnedAssetsMap,
        existingOwnedAssetsMap,
        validUniversalProfiles,
      });

      if (tokenId) {
        Utils.Transfer.OwnedToken.getOwnedToken({
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
        });
      }
    }

    const ownedAssetsToSave = [...updatedOwnedAssetsMap.values()].filter(
      ({ balance }) => balance > 0n,
    );
    const ownedAssetsToDelete = [...updatedOwnedAssetsMap.values()].filter(
      ({ balance }) => balance === 0n,
    );

    const ownedTokensToSave = [...updatedOwnedTokensMap.values()].filter(({ tokenId }) => tokenId);
    const ownedTokensToDelete = [...updatedOwnedTokensMap.values()].filter(
      ({ tokenId }) => !tokenId,
    );

    context.log.info(
      JSON.stringify({
        message: "Updating and removing extracted 'OwnedAsset' entities and 'OwnedToken' entities",
        ownedAssetsToSaveCount: ownedAssetsToSave.length,
        ownedAssetsToDeleteCount: ownedAssetsToDelete.length,
        ownedTokensToSaveCount: ownedTokensToSave.length,
        ownedTokensToDeleteCount: ownedTokensToDelete.length,
      }),
    );

    await context.store.upsert(ownedAssetsToSave);
    await context.store.remove(ownedTokensToDelete);
    await context.store.remove(ownedAssetsToDelete);
    await context.store.upsert(ownedTokensToSave);
  }
}
