import { Context } from '@/types';
import * as Utils from '@/utils';
import {
  DataChanged,
  DigitalAsset,
  Executed,
  Follow,
  LSP3Profile,
  LSP4Metadata,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
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
  lsp8ReferenceContractEntities,
  lsp8TokenIdFormatEntities,
  lsp8TokenMetadataBaseUriEntities,
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
  lsp8ReferenceContractEntities: Map<string, LSP8ReferenceContract>;
  lsp8TokenIdFormatEntities: Map<string, LSP8TokenIdFormat>;
  lsp8TokenMetadataBaseUriEntities: Map<string, LSP8TokenMetadataBaseURI>;
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
      populatedLsp8ReferenceContractEntities,
      populatedLsp8TokenIdFormatEntities,
      populatedLsp8TokenMetadataBaseUriEntities,
    },
  };
}
