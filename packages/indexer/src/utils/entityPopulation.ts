import { Context } from '@/types';
import * as Utils from '@/utils';
import {
  DataChanged,
  DigitalAsset,
  Executed,
  Follow,
  LSP12IssuedAssetsItem,
  LSP12IssuedAssetsLength,
  LSP12IssuedAssetsMap,
  LSP3Profile,
  LSP4CreatorsItem,
  LSP4CreatorsLength,
  LSP4CreatorsMap,
  LSP4Metadata,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP5ReceivedAssetsItem,
  LSP5ReceivedAssetsLength,
  LSP5ReceivedAssetsMap,
  LSP6ControllerAllowedCalls,
  LSP6ControllerAllowedERC725YDataKeys,
  LSP6ControllerPermissions,
  LSP6ControllersItem,
  LSP6ControllersLength,
  LSP8ReferenceContract,
  LSP8TokenIdFormat,
  LSP8TokenMetadataBaseURI,
  NFT,
  TokenIdDataChanged,
  Transfer,
  Unfollow,
  UniversalProfile,
  UniversalReceiver,
} from '@chillwhales/typeorm';
import { In, Not } from 'typeorm';
import { isHex } from 'viem';

export async function populateEntities({
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
}: {
  context: Context;
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
  newNfts: Map<string, NFT>;
  executedEntities: Executed[];
  dataChangedEntities: DataChanged[];
  universalReceiverEntities: UniversalReceiver[];
  transferEntities: Transfer[];
  tokenIdDataChangedEntities: TokenIdDataChanged[];
  followEntities: Follow[];
  unfollowEntities: Unfollow[];
  lsp3ProfileEntities: Map<string, LSP3Profile>;
  lsp4MetadataEntities: Map<string, LSP4Metadata>;
  lsp4TokenNameEntities: Map<string, LSP4TokenName>;
  lsp4TokenSymbolEntities: Map<string, LSP4TokenSymbol>;
  lsp4TokenTypeEntities: Map<string, LSP4TokenType>;
  lsp4CreatorsLengthEntities: Map<string, LSP4CreatorsLength>;
  lsp4CreatorsItemEntities: Map<string, LSP4CreatorsItem>;
  lsp4CreatorsMapEntities: Map<string, LSP4CreatorsMap>;
  lsp5ReceivedAssetsLengthEntities: Map<string, LSP5ReceivedAssetsLength>;
  lsp5ReceivedAssetsItemEntities: Map<string, LSP5ReceivedAssetsItem>;
  lsp5ReceivedAssetsMapEntities: Map<string, LSP5ReceivedAssetsMap>;
  lsp6ControllersLengthEntities: Map<string, LSP6ControllersLength>;
  lsp6ControllersItemEntities: Map<string, LSP6ControllersItem>;
  lsp6ControllerPermissionsEntities: Map<string, LSP6ControllerPermissions>;
  lsp6ControllerAllowedCallsEntities: Map<string, LSP6ControllerAllowedCalls>;
  lsp6ControllerAllowedErc725YDataKeysEntities: Map<string, LSP6ControllerAllowedERC725YDataKeys>;
  lsp8ReferenceContractEntities: Map<string, LSP8ReferenceContract>;
  lsp8TokenIdFormatEntities: Map<string, LSP8TokenIdFormat>;
  lsp8TokenMetadataBaseUriEntities: Map<string, LSP8TokenMetadataBaseURI>;
  lsp12IssuedAssetsLengthEntities: Map<string, LSP12IssuedAssetsLength>;
  lsp12IssuedAssetsItemEntities: Map<string, LSP12IssuedAssetsItem>;
  lsp12IssuedAssetsMapEntities: Map<string, LSP12IssuedAssetsMap>;
}) {
  const populatedNfts = Utils.NFT.populate({ entities: [...newNfts.values()], validDigitalAssets });

  // Events
  /// event Executed(uint256,address,uint256,bytes4);
  const populatedExecuteEntities = Utils.Executed.populate({
    executedEntities,
    validUniversalProfiles,
  });
  /// event DataChanged(bytes32,bytes);
  const populatedDataChangedEntities = Utils.DataChanged.populate({
    dataChangedEntities,
    validUniversalProfiles,
    validDigitalAssets,
  });
  /// event UniversalReceiver(address,uint256,bytes32,bytes,bytes);
  const populatedUniversalReceiverEntities = Utils.UniversalReceiver.populate({
    universalReceiverEntities,
    validUniversalProfiles,
  });
  /// event Transfer(address,address,address,uint256,bool,bytes);
  /// event Transfer(address,address,address,bytes32,bool,bytes);
  const populatedTransferEntities = Utils.Transfer.populate({
    transferEntities,
    validDigitalAssets,
  });
  /// event TokenIdDataChanged(bytes32,bytes32,bytes);
  const populatedTokenIdDataChangedEntities = Utils.TokenIdDataChanged.populate({
    tokenIdDataChangedEntities,
    validDigitalAssets,
  });
  /// event Follow(address,address);
  const populatedFollowEntities = Utils.Follow.populate({ followEntities, validUniversalProfiles });
  /// event Unfollow(address,address);
  const populatedUnfollowEntities = Utils.Unfollow.populate({
    unfollowEntities,
    validUniversalProfiles,
  });

  // DataKeys
  /// LSP3ProfileUrl
  const populatedLsp3ProfileEntities = Utils.DataChanged.LSP3Profile.populate({
    lsp3ProfileEntities: [...lsp3ProfileEntities.values()],
    validUniversalProfiles,
  });
  /// LSP4Metadata
  const populatedLsp4Metadatas_DataChanged = Utils.DataChanged.LSP4Metadata.populate({
    lsp4MetadataEntities: [...lsp4MetadataEntities.values()].filter(({ nft }) => nft === null),
    validDigitalAssets,
  });
  const populatedLsp4Metadatas_TokenIdDataChanged = Utils.TokenIdDataChanged.LSP4Metadata.populate({
    lsp4MetadataEntities: [...lsp4MetadataEntities.values()].filter(({ nft }) => nft !== null),
    validDigitalAssets,
  });
  const populatedLsp4MetadataEntities = [
    ...populatedLsp4Metadatas_DataChanged,
    ...populatedLsp4Metadatas_TokenIdDataChanged,
  ];
  /// LSP4TokenName
  const populatedLsp4TokenNameEntities = Utils.DataChanged.LSP4TokenName.populate({
    lsp4TokenNameEntities: [...lsp4TokenNameEntities.values()],
    validDigitalAssets,
  });
  /// LSP4TokenSymbol
  const populatedLsp4TokenSymbolEntities = Utils.DataChanged.LSP4TokenSymbol.populate({
    lsp4TokenSymbolEntities: [...lsp4TokenSymbolEntities.values()],
    validDigitalAssets,
  });
  /// LSP4TokenType
  const populatedLsp4TokenTypeEntities = Utils.DataChanged.LSP4TokenType.populate({
    lsp4TokenTypeEntities: [...lsp4TokenTypeEntities.values()],
    validDigitalAssets,
  });
  // LSP4Creators[]
  const populatedLsp4CreatorsLengthEntities = Utils.DataChanged.LSP4CreatorsLength.populate({
    lsp4CreatorsLengthEntities: [...lsp4CreatorsLengthEntities.values()],
    validDigitalAssets,
  });
  // LSP4Creators[index]
  const populatedLsp4CreatorsItemEntities = Utils.DataChanged.LSP4CreatorsItem.populate({
    lsp4CreatorsItemEntities: [...lsp4CreatorsItemEntities.values()],
    validDigitalAssets,
  });
  // LSP4CreatorsMap
  const populatedLsp4CreatorsMapEntities = Utils.DataChanged.LSP4CreatorsMap.populate({
    lsp4CreatorsMapEntities: [...lsp4CreatorsMapEntities.values()],
    validDigitalAssets,
  });
  // LSP5ReceivedAssets[]
  const populatedLsp5ReceivedAssetsLengthEntities =
    Utils.DataChanged.LSP5ReceivedAssetsLength.populate({
      lsp5ReceivedAssetsLengthEntities: [...lsp5ReceivedAssetsLengthEntities.values()],
      validUniversalProfiles,
    });
  // LSP5ReceivedAssets[index]
  const populatedLsp5ReceivedAssetsItemEntities = Utils.DataChanged.LSP5ReceivedAssetsItem.populate(
    {
      lsp5ReceivedAssetsItemEntities: [...lsp5ReceivedAssetsItemEntities.values()],
      validUniversalProfiles,
    },
  );
  // LSP5ReceivedAssetsMap
  const populatedLsp5ReceivedAssetsMapEntities = Utils.DataChanged.LSP5ReceivedAssetsMap.populate({
    lsp5ReceivedAssetsMapEntities: [...lsp5ReceivedAssetsMapEntities.values()],
    validUniversalProfiles,
  });
  // AddressPermissions[]
  const populatedLsp6ControllersLengthEntities = Utils.DataChanged.LSP6ControllersLength.populate({
    lsp6ControllersLengthEntities: [...lsp6ControllersLengthEntities.values()],
    validUniversalProfiles,
  });
  // AddressPermissions[index]
  const populatedLsp6ControllersItemEntities = Utils.DataChanged.LSP6ControllersItem.populate({
    lsp6ControllersItemEntities: [...lsp6ControllersItemEntities.values()],
    validUniversalProfiles,
  });
  // AddressPermissions:Permissions:<address>
  const populatedLsp6ControllerPermissionsEntities =
    Utils.DataChanged.LSP6ControllerPermissions.populate({
      lsp6ControllerPermissionsEntities: [...lsp6ControllerPermissionsEntities.values()],
      validUniversalProfiles,
    });
  // AddressPermissions:AllowedCalls:<address>
  const populatedLsp6ControllerAllowedCallsEntities =
    Utils.DataChanged.LSP6ControllerAllowedCalls.populate({
      lsp6ControllerAllowedCallsEntities: [...lsp6ControllerAllowedCallsEntities.values()],
      validUniversalProfiles,
    });
  // AddressPermissions:AllowedERC725YDataKeys:<address>
  const populatedLsp6ControllerAllowedErc725YDataKeysEntities =
    Utils.DataChanged.LSP6ControllerAllowedERC725YDataKeys.populate({
      lsp6ControllerAllowedErc725YDataKeysEntities: [
        ...lsp6ControllerAllowedErc725YDataKeysEntities.values(),
      ],
      validUniversalProfiles,
    });
  /// LSP8ReferenceContract
  const populatedLsp8ReferenceContractEntities = Utils.DataChanged.LSP8ReferenceContract.populate({
    lsp8ReferenceContractEntities: [...lsp8ReferenceContractEntities.values()],
    validDigitalAssets,
  });
  /// LSP8TokenIdFormat
  const populatedLsp8TokenIdFormatEntities = Utils.DataChanged.LSP8TokenIdFormat.populate({
    lsp8TokenIdFormatEntities: [...lsp8TokenIdFormatEntities.values()],
    validDigitalAssets,
  });
  /// LSP8TokenMetadataBaseURI
  const populatedLsp8TokenMetadataBaseUriEntities =
    Utils.DataChanged.LSP8TokenMetadataBaseURI.populate({
      lsp8TokenMetadataBaseUriEntities: [...lsp8TokenMetadataBaseUriEntities.values()],
      validDigitalAssets,
    });
  // LSP12IssuedAssets[]
  const populatedLsp12IssuedAssetsLengthEntities =
    Utils.DataChanged.LSP12IssuedAssetsLength.populate({
      lsp12IssuedAssetsLengthEntities: [...lsp12IssuedAssetsLengthEntities.values()],
      validUniversalProfiles,
    });
  // LSP12IssuedAssets[index]
  const populatedLsp12IssuedAssetsItemEntities = Utils.DataChanged.LSP12IssuedAssetsItem.populate({
    lsp12IssuedAssetsItemEntities: [...lsp12IssuedAssetsItemEntities.values()],
    validUniversalProfiles,
  });
  // LSP12IssuedAssetsMap
  const populatedLsp12IssuedAssetsMapEntities = Utils.DataChanged.LSP12IssuedAssetsMap.populate({
    lsp12IssuedAssetsMapEntities: [...lsp12IssuedAssetsMapEntities.values()],
    validUniversalProfiles,
  });

  /// Populate NFTs with `formattedTokenId`
  const populatedNftsWithoutFormattedTokenId = [...populatedNfts.values()].filter(
    (nft) => !nft.formattedTokenId,
  );
  if (populatedNftsWithoutFormattedTokenId.length > 0) {
    context.log.info(
      JSON.stringify({
        message: 'Updating `formattedTokenId` for NFTs.',
      }),
    );

    const lsp8TokenIdFormatEntities = [
      ...(await context.store.findBy(LSP8TokenIdFormat, {
        address: In([
          ...new Set(populatedNftsWithoutFormattedTokenId.map(({ address }) => address)),
        ]),
      })),
      ...populatedLsp8TokenIdFormatEntities,
    ];

    for (const nft of populatedNftsWithoutFormattedTokenId) {
      const latestLsp8TokenIdFormat = lsp8TokenIdFormatEntities
        .filter((lsp8TokenIdFormat) => lsp8TokenIdFormat.address === nft.address)
        .sort((a, b) => b.timestamp.valueOf() - a.timestamp.valueOf())[0];

      const lsp8TokenIdFormat = latestLsp8TokenIdFormat?.value || null;

      populatedNfts.set(
        nft.id,
        new NFT({
          ...nft,
          formattedTokenId: isHex(nft.tokenId)
            ? Utils.formatTokenId({ tokenId: nft.tokenId, lsp8TokenIdFormat })
            : null,
        }),
      );
    }
  }

  if (populatedLsp8TokenIdFormatEntities.length > 0) {
    context.log.info(
      JSON.stringify({
        message:
          "Found new LSP8TokenIdFormat data keys. Updating old `formattedTokenId` for 'NFT' entities.",
      }),
    );

    const nfts = await context.store.findBy(NFT, {
      address: In([...new Set(populatedLsp8TokenIdFormatEntities.map(({ address }) => address))]),
      id: Not(In([...populatedNfts.values()].map(({ id }) => id))),
    });

    for (const nft of nfts) {
      if (!populatedNfts.has(nft.id)) {
        populatedNfts.set(nft.id, nft);
      }
    }

    for (const lsp8TokenIdFormat of populatedLsp8TokenIdFormatEntities) {
      const nftsToUpdate = [...populatedNfts.values()].filter(
        (nft) => nft.address === lsp8TokenIdFormat.address,
      );

      for (const nft of nftsToUpdate) {
        populatedNfts.set(
          nft.id,
          new NFT({
            ...nft,
            formattedTokenId: isHex(nft.tokenId)
              ? Utils.formatTokenId({
                  tokenId: nft.tokenId,
                  lsp8TokenIdFormat: lsp8TokenIdFormat.value,
                })
              : null,
          }),
        );
      }
    }
  }

  return {
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
  };
}
