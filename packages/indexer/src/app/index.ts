import { processor } from '@/app/processor';
import * as Utils from '@/utils';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import {
  chillClaimedHandler,
  followerSystemHandler,
  lsp3ProfileHandler,
  lsp4MetadataHandler,
  orbsClaimedHandler,
  orbsLevelHandler,
  ownedAssetsHandler,
} from './handlers';
import { scanLogs } from './scanner';

processor.run(new TypeormDatabase(), async (context) => {
  const {
    universalProfiles,
    assets: { digitalAssets, nfts },
    events: {
      executedEntities,
      dataChangedEntities,
      universalReceiverEntities,
      transferEntities,
      tokenIdDataChangedEntities,
      followEntities,
      unfollowEntities,
    },
    dataKeys: {
      lsp3ProfileEntities,
      lsp4TokenNameEntities,
      lsp4TokenSymbolEntities,
      lsp4TokenTypeEntities,
      lsp4MetadataEntities,
      lsp8TokenIdFormatEntities,
      lsp8ReferenceContractEntities,
      lsp8TokenMetadataBaseUriEntities,
    },
  } = scanLogs(context);

  const {
    universalProfiles: { newUniversalProfiles, validUniversalProfiles, invalidUniversalProfiles },
    digitalAssets: { newDigitalAssets, validDigitalAssets, invalidDigitalAssets },
    nfts: { newNfts, validNfts },
  } = await Utils.verifyEntities({
    context,
    universalProfiles,
    digitalAssets,
    nfts,
  });

  const {
    populatedNfts,
    events: {
      populatedExecuteEntities,
      populatedDataChangedEntities,
      populatedUniversalReceiverEntities,
      populatedTransferEntities,
      populatedTokenIdDataChangedEntities,
      populatedFollowEntities,
      populatedUnfollowEntities,
    },
    dataKeys: {
      populatedLsp3ProfileEntities,
      populatedLsp4MetadataEntities,
      populatedLsp4TokenNameEntities,
      populatedLsp4TokenSymbolEntities,
      populatedLsp4TokenTypeEntities,
      populatedLsp8ReferenceContractEntities,
      populatedLsp8TokenIdFormatEntities,
      populatedLsp8TokenMetadataBaseUriEntities,
    },
  } = await Utils.populateEntities({
    context,
    validUniversalProfiles,
    validDigitalAssets,
    newNfts,
    executedEntities,
    dataChangedEntities,
    universalReceiverEntities,
    transferEntities,
    tokenIdDataChangedEntities,
    followEntities,
    unfollowEntities,
    lsp3ProfileEntities,
    lsp4MetadataEntities,
    lsp4TokenNameEntities,
    lsp4TokenSymbolEntities,
    lsp4TokenTypeEntities,
    lsp8ReferenceContractEntities,
    lsp8TokenIdFormatEntities,
    lsp8TokenMetadataBaseUriEntities,
  });

  if (newUniversalProfiles.size) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'UniversalProfile' entities.",
        universalProfilesCount: newUniversalProfiles.size,
      }),
    );
  }
  if (newDigitalAssets.size) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'DigitalAsset' entities.",
        digitalAssetsCount: newDigitalAssets.size,
      }),
    );
  }
  if (populatedNfts.size) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'NFT' entities.",
        nftsCount: populatedNfts.size,
      }),
    );
  }

  await Promise.all([
    context.store.upsert([...newUniversalProfiles.values()]),
    context.store.upsert([...newDigitalAssets.values()]),
    context.store.upsert([...populatedNfts.values()]),
  ]);

  if (populatedLsp3ProfileEntities.length > 0) {
    await Utils.DataChanged.LSP3Profile.clearSubEntities({
      context,
      lsp3ProfileEntites: populatedLsp3ProfileEntities,
    });
  }

  if (populatedLsp4MetadataEntities.length > 0) {
    await Utils.DataChanged.LSP4Metadata.clearSubEntities({
      context,
      lsp4MetadataEntites: populatedLsp4MetadataEntities,
    });
  }

  const populatedLsp4MetadataBaseUriEntities = await Utils.LSP4MetadataBaseURI.extract({
    context,
    populatedTransferEntities,
    populatedLsp8TokenMetadataBaseUriEntities,
    populatedNfts,
  });

  if (populatedLsp4MetadataBaseUriEntities.length > 0) {
    await Utils.DataChanged.LSP4Metadata.clearSubEntities({
      context,
      lsp4MetadataEntites: populatedLsp4MetadataBaseUriEntities,
    });
  }

  if (
    populatedExecuteEntities.length ||
    populatedDataChangedEntities.length ||
    populatedUniversalReceiverEntities.length ||
    populatedTransferEntities.length ||
    populatedTokenIdDataChangedEntities.length ||
    populatedFollowEntities.length ||
    populatedUnfollowEntities.length
  ) {
    context.log.info(
      JSON.stringify({
        message: 'Found new Events',
        ...(populatedExecuteEntities.length && {
          ExecuteEntitiesCount: populatedExecuteEntities.length,
        }),
        ...(populatedDataChangedEntities.length && {
          DataChangedEntitiesCount: populatedDataChangedEntities.length,
        }),
        ...(populatedUniversalReceiverEntities.length && {
          UniversalReceiverEntitiesCount: populatedUniversalReceiverEntities.length,
        }),
        ...(populatedTransferEntities.length && {
          TransferEntitiesCount: populatedTransferEntities.length,
        }),
        ...(populatedTokenIdDataChangedEntities.length && {
          TokenIdDataChangedEntitiesCount: populatedTokenIdDataChangedEntities.length,
        }),
        ...(populatedFollowEntities.length && {
          FollowEntitiesCount: populatedFollowEntities.length,
        }),
        ...(populatedUnfollowEntities.length && {
          UnfollowEntitiesCount: populatedUnfollowEntities.length,
        }),
      }),
    );
  }
  if (
    populatedLsp3ProfileEntities.length ||
    populatedLsp4MetadataEntities.length ||
    populatedLsp4MetadataBaseUriEntities.length ||
    populatedLsp4TokenNameEntities.length ||
    populatedLsp4TokenSymbolEntities.length ||
    populatedLsp4TokenTypeEntities.length ||
    populatedLsp8ReferenceContractEntities.length ||
    populatedLsp8TokenIdFormatEntities.length ||
    populatedLsp8TokenMetadataBaseUriEntities.length
  ) {
    context.log.info(
      JSON.stringify({
        message: 'Found new ERC725 Data Keys',
        ...(populatedLsp3ProfileEntities.length && {
          LSP3ProfileEntitiesCount: populatedLsp3ProfileEntities.length,
        }),
        ...(populatedLsp4MetadataEntities.length && {
          LSP4MetadataEntitiesCount: populatedLsp4MetadataEntities.length,
        }),
        ...(populatedLsp4MetadataBaseUriEntities.length && {
          LSP4MetadataBaseURIEntitiesCount: populatedLsp4MetadataBaseUriEntities.length,
        }),
        ...(populatedLsp4TokenNameEntities.length && {
          LSP4TokenNameEntitiesCount: populatedLsp4TokenNameEntities.length,
        }),
        ...(populatedLsp4TokenSymbolEntities.length && {
          LSP4TokenSymbolEntitiesCount: populatedLsp4TokenSymbolEntities.length,
        }),
        ...(populatedLsp4TokenTypeEntities.length && {
          LSP4TokenTypeEntitiesCount: populatedLsp4TokenTypeEntities.length,
        }),
        ...(populatedLsp8ReferenceContractEntities.length && {
          LSP8ReferenceContractEntitiesCount: populatedLsp8ReferenceContractEntities.length,
        }),
        ...(populatedLsp8TokenIdFormatEntities.length && {
          LSP8TokenIdFormatEntitiesCount: populatedLsp8TokenIdFormatEntities.length,
        }),
        ...(populatedLsp8TokenMetadataBaseUriEntities.length && {
          LSP8TokenMetadataBaseURIEntitiesCount: populatedLsp8TokenMetadataBaseUriEntities.length,
        }),
      }),
    );
  }

  await Promise.all([
    // Save tracked events
    /// event Executed(uint256,address,uint256,bytes4);
    context.store.insert(populatedExecuteEntities),
    /// event DataChanged(bytes32,bytes);
    context.store.insert(populatedDataChangedEntities),
    /// event UniversalReceiver(address,uint256,bytes32,bytes,bytes);
    context.store.insert(populatedUniversalReceiverEntities),
    /// event Transfer(address,address,address,uint256,bool,bytes);
    /// event Transfer(address,address,address,bytes32,bool,bytes);
    context.store.insert(populatedTransferEntities),
    /// event TokenIdDataChanged(bytes32,bytes32,bytes);
    context.store.insert(populatedTokenIdDataChangedEntities),
    /// event Follow(address,address);
    context.store.insert(populatedFollowEntities),
    /// event Unfollow(address,address);
    context.store.insert(populatedUnfollowEntities),

    // Save tracked starndardized DataKeys
    /// LSP3Profile
    context.store.upsert(populatedLsp3ProfileEntities),
    /// LSP4Metadata
    context.store.upsert(populatedLsp4MetadataEntities),
    context.store.upsert(populatedLsp4MetadataBaseUriEntities),
    /// LSP4TokenName
    context.store.upsert(populatedLsp4TokenNameEntities),
    /// LSP4TokenSymbol
    context.store.upsert(populatedLsp4TokenSymbolEntities),
    /// LSP4TokenType
    context.store.upsert(populatedLsp4TokenTypeEntities),
    /// LSP8ReferenceContract
    context.store.upsert(populatedLsp8ReferenceContractEntities),
    /// LSP8TokenIdFormat
    context.store.upsert(populatedLsp8TokenIdFormatEntities),
    /// LSP8TokenMetadataBaseURI
    context.store.upsert(populatedLsp8TokenMetadataBaseUriEntities),
  ]);

  await ownedAssetsHandler({ context, populatedTransferEntities, validUniversalProfiles });
  await followerSystemHandler({ context, populatedFollowEntities, populatedUnfollowEntities });

  await lsp3ProfileHandler({ context, populatedLsp3ProfileEntities, validUniversalProfiles });
  await lsp4MetadataHandler({
    context,
    populatedLsp4MetadataEntities,
    populatedLsp4MetadataBaseUriEntities,
    validDigitalAssets,
  });

  await orbsLevelHandler({
    context,
    populatedTransferEntities,
    populatedTokenIdDataChangedEntities,
  });
  await orbsClaimedHandler({ context, populatedTransferEntities });
  await chillClaimedHandler({ context, populatedTransferEntities });
});
