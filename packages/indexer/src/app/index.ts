import { processor } from '@/app/processor';
import * as Utils from '@/utils';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import * as Handlers from './handlers';
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
      deployedContractsEntities,
      deployedERC1167ProxiesEntities,
      ownershipTransferredEntities,
    },
    dataKeys: {
      lsp3ProfileEntities,
      lsp4TokenNameEntities,
      lsp4TokenSymbolEntities,
      lsp4TokenTypeEntities,
      lsp4MetadataEntities,
      lsp4CreatorsLengthEntities,
      lsp4CreatorsItemEntities,
      lsp4CreatorsMapEntities,
      lsp5ReceivedAssetsLengthEntities,
      lsp5ReceivedAssetsItemEntities,
      lsp5ReceivedAssetsMapEntities,
      lsp6ControllersLengthEntities,
      lsp6ControllersItemEntities,
      lsp6ControllerPermissionsEntities,
      lsp6PermissionEntities,
      lsp6ControllerAllowedCallsEntities,
      lsp6AllowedCallEntities,
      lsp6ControllerAllowedErc725YDataKeysEntities,
      lsp6AllowedErc725YDataKeyEntities,
      lsp8TokenIdFormatEntities,
      lsp8ReferenceContractEntities,
      lsp8TokenMetadataBaseUriEntities,
      lsp12IssuedAssetsLengthEntities,
      lsp12IssuedAssetsItemEntities,
      lsp12IssuedAssetsMapEntities,
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
      populatedOwnershipTransferredEntities,
    },
    dataKeys: {
      populatedLsp3ProfileEntities,
      populatedLsp4MetadataEntities,
      populatedLsp4TokenNameEntities,
      populatedLsp4TokenSymbolEntities,
      populatedLsp4TokenTypeEntities,
      populatedLsp4CreatorsLengthEntities,
      populatedLsp4CreatorsItemEntities,
      populatedLsp4CreatorsMapEntities,
      populatedLsp5ReceivedAssetsLengthEntities,
      populatedLsp5ReceivedAssetsItemEntities,
      populatedLsp5ReceivedAssetsMapEntities,
      populatedLsp6ControllersLengthEntities,
      populatedLsp6ControllersItemEntities,
      populatedLsp6ControllerPermissionsEntities,
      populatedLsp6ControllerAllowedCallsEntities,
      populatedLsp6ControllerAllowedErc725YDataKeysEntities,
      populatedLsp8ReferenceContractEntities,
      populatedLsp8TokenIdFormatEntities,
      populatedLsp8TokenMetadataBaseUriEntities,
      populatedLsp12IssuedAssetsLengthEntities,
      populatedLsp12IssuedAssetsItemEntities,
      populatedLsp12IssuedAssetsMapEntities,
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
    ownershipTransferredEntities,
    lsp3ProfileEntities,
    lsp4MetadataEntities,
    lsp4TokenNameEntities,
    lsp4TokenSymbolEntities,
    lsp4TokenTypeEntities,
    lsp4CreatorsLengthEntities,
    lsp4CreatorsItemEntities,
    lsp4CreatorsMapEntities,
    lsp5ReceivedAssetsLengthEntities,
    lsp5ReceivedAssetsItemEntities,
    lsp5ReceivedAssetsMapEntities,
    lsp6ControllersLengthEntities,
    lsp6ControllersItemEntities,
    lsp6ControllerPermissionsEntities,
    lsp6ControllerAllowedCallsEntities,
    lsp6ControllerAllowedErc725YDataKeysEntities,
    lsp8ReferenceContractEntities,
    lsp8TokenIdFormatEntities,
    lsp8TokenMetadataBaseUriEntities,
    lsp12IssuedAssetsLengthEntities,
    lsp12IssuedAssetsItemEntities,
    lsp12IssuedAssetsMapEntities,
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
    populatedUnfollowEntities.length ||
    populatedOwnershipTransferredEntities.length
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
        ...(populatedOwnershipTransferredEntities.length && {
          OwnershipTransferredEntitiesCount: populatedOwnershipTransferredEntities.length,
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
    populatedLsp4CreatorsLengthEntities.length ||
    populatedLsp4CreatorsItemEntities.length ||
    populatedLsp4CreatorsMapEntities.length ||
    populatedLsp5ReceivedAssetsLengthEntities.length ||
    populatedLsp5ReceivedAssetsItemEntities.length ||
    populatedLsp5ReceivedAssetsMapEntities.length ||
    populatedLsp6ControllersLengthEntities.length ||
    populatedLsp6ControllersItemEntities.length ||
    populatedLsp6ControllerPermissionsEntities.length ||
    populatedLsp6ControllerAllowedCallsEntities.length ||
    populatedLsp6ControllerAllowedErc725YDataKeysEntities.length ||
    populatedLsp8ReferenceContractEntities.length ||
    populatedLsp8TokenIdFormatEntities.length ||
    populatedLsp8TokenMetadataBaseUriEntities.length ||
    populatedLsp12IssuedAssetsLengthEntities.length ||
    populatedLsp12IssuedAssetsItemEntities.length ||
    populatedLsp12IssuedAssetsMapEntities.length
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
        ...(populatedLsp4CreatorsLengthEntities.length && {
          LSP4CreatorsLengthCount: populatedLsp4CreatorsLengthEntities.length,
        }),
        ...(populatedLsp4CreatorsItemEntities.length && {
          LSP4CreatorsItemCount: populatedLsp4CreatorsItemEntities.length,
        }),
        ...(populatedLsp4CreatorsMapEntities.length && {
          LSP4CreatorsMapCount: populatedLsp4CreatorsMapEntities.length,
        }),
        ...(populatedLsp5ReceivedAssetsLengthEntities.length && {
          LSP5ReceivedAssetsLengthCount: populatedLsp5ReceivedAssetsLengthEntities.length,
        }),
        ...(populatedLsp5ReceivedAssetsItemEntities.length && {
          LSP5ReceivedAssetsItemCount: populatedLsp5ReceivedAssetsItemEntities.length,
        }),
        ...(populatedLsp5ReceivedAssetsMapEntities.length && {
          LSP5ReceivedAssetsMapCount: populatedLsp5ReceivedAssetsMapEntities.length,
        }),
        ...(populatedLsp6ControllersLengthEntities.length && {
          LSP6ControllersLengthCount: populatedLsp6ControllersLengthEntities.length,
        }),
        ...(populatedLsp6ControllersItemEntities.length && {
          LSP6ControllersItemCount: populatedLsp6ControllersItemEntities.length,
        }),
        ...(populatedLsp6ControllerPermissionsEntities.length && {
          LSP6ControllerPermissionsCount: populatedLsp6ControllerPermissionsEntities.length,
        }),
        ...(populatedLsp6ControllerAllowedCallsEntities.length && {
          LSP6ControllerAllowedCallsCount: populatedLsp6ControllerAllowedCallsEntities.length,
        }),
        ...(populatedLsp6ControllerAllowedErc725YDataKeysEntities.length && {
          LSP6ControllerAllowedERC725YDataKeysCount:
            populatedLsp6ControllerAllowedErc725YDataKeysEntities.length,
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
        ...(populatedLsp12IssuedAssetsLengthEntities.length && {
          LSP12IssuedAssetsLengthCount: populatedLsp12IssuedAssetsLengthEntities.length,
        }),
        ...(populatedLsp12IssuedAssetsItemEntities.length && {
          LSP12IssuedAssetsItemCount: populatedLsp12IssuedAssetsItemEntities.length,
        }),
        ...(populatedLsp12IssuedAssetsMapEntities.length && {
          LSP12IssuedAssetsMapCount: populatedLsp12IssuedAssetsMapEntities.length,
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
    /// event OwnershipTransferred(address,address);
    context.store.insert(populatedOwnershipTransferredEntities),

    /// event DeployedContracts(address,address,[bytes32,uint256,bytes],[uint256,bytes,bool,bytes],address,bytes);
    context.store.insert(deployedContractsEntities),
    /// event DeployedERC1167Proxies(address,address,[bytes32,uint256,address,bytes],[uint256,address,bytes,bool,bytes],address,bytes);
    context.store.insert(deployedERC1167ProxiesEntities),

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
    // LSP4Creators[]
    context.store.upsert(populatedLsp4CreatorsLengthEntities),
    // LSP4Creators[index]
    context.store.upsert(populatedLsp4CreatorsItemEntities),
    // LSP4CreatorsMap
    context.store.upsert(populatedLsp4CreatorsMapEntities),
    // LSP5ReceivedAssets[]
    context.store.upsert(populatedLsp5ReceivedAssetsLengthEntities),
    // LSP5ReceivedAssets[index]
    context.store.upsert(populatedLsp5ReceivedAssetsItemEntities),
    // LSP5ReceivedAssetsMap
    context.store.upsert(populatedLsp5ReceivedAssetsMapEntities),

    // AddressPermissions[]
    context.store.upsert(populatedLsp6ControllersLengthEntities),
    // AddressPermissions[index]
    context.store.upsert(populatedLsp6ControllersItemEntities),
    // AddressPermissions:Permissions:<address>
    context.store.upsert(populatedLsp6ControllerPermissionsEntities),
    // AddressPermissions:AllowedCalls:<address>
    context.store.upsert(populatedLsp6ControllerAllowedCallsEntities),
    // AddressPermissions:AllowedERC725YDataKeys:<address>
    context.store.upsert(populatedLsp6ControllerAllowedErc725YDataKeysEntities),

    /// LSP8ReferenceContract
    context.store.upsert(populatedLsp8ReferenceContractEntities),
    /// LSP8TokenIdFormat
    context.store.upsert(populatedLsp8TokenIdFormatEntities),
    /// LSP8TokenMetadataBaseURI
    context.store.upsert(populatedLsp8TokenMetadataBaseUriEntities),

    // LSP12IssuedAssets[]
    context.store.upsert(populatedLsp12IssuedAssetsLengthEntities),
    // LSP12IssuedAssets[index]
    context.store.upsert(populatedLsp12IssuedAssetsItemEntities),
    // LSP12IssuedAssetsMap
    context.store.upsert(populatedLsp12IssuedAssetsMapEntities),
  ]);

  await Handlers.permissionsUpdateHandler({
    context,
    populatedLsp6ControllerPermissionsEntities,
    lsp6PermissionEntities,
    populatedLsp6ControllerAllowedCallsEntities,
    lsp6AllowedCallEntities,
    populatedLsp6ControllerAllowedErc725YDataKeysEntities,
    lsp6AllowedErc725YDataKeyEntities,
  });

  await Handlers.removeEmptyEntities({ context });

  await Handlers.decimalsHandler({ context, newDigitalAssets });
  await Handlers.totalSupplyHandler({ context, populatedTransferEntities });
  await Handlers.ownedAssetsHandler({ context, populatedTransferEntities, validUniversalProfiles });
  await Handlers.followerSystemHandler({
    context,
    populatedFollowEntities,
    populatedUnfollowEntities,
  });

  await Handlers.lsp3ProfileHandler({
    context,
    populatedLsp3ProfileEntities,
    validUniversalProfiles,
  });
  await Handlers.lsp4MetadataHandler({
    context,
    populatedLsp4MetadataEntities,
    populatedLsp4MetadataBaseUriEntities,
    validDigitalAssets,
  });

  await Handlers.orbsLevelHandler({
    context,
    populatedTransferEntities,
    populatedTokenIdDataChangedEntities,
  });
  await Handlers.orbsClaimedHandler({ context, populatedTransferEntities });
  await Handlers.chillClaimedHandler({ context, populatedTransferEntities });
  await Handlers.ownershipTransferredHandler({ context, populatedOwnershipTransferredEntities });
});
