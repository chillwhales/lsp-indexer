import { processor } from '@/app/processor';
import { CHILL_ADDRESS, ORBS_ADDRESS } from '@/constants';
import * as Utils from '@/utils';
import {
  ChillClaimed,
  LSP8TokenIdFormat,
  NFT,
  OrbsClaimed,
  OwnedAsset,
  OwnedToken,
} from '@chillwhales/sqd-typeorm';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, isHex, zeroAddress } from 'viem';
import { scanLogs } from './scanner';

processor.run(new TypeormDatabase(), async (context) => {
  const {
    universalProfiles,
    assets: { digitalAssets, nfts },
    events: {
      executedEvents,
      dataChangedEvents,
      universalReceiverEvents,
      transferEvents,
      tokenIdDataChangedEvents,
    },
    dataKeys: {
      lsp3ProfileUrls,
      lsp4TokenNames,
      lsp4TokenSymbols,
      lsp4TokenTypes,
      lsp4MetadataUrls,
      lsp8TokenIdFormats,
      lsp8ReferenceContracts,
      lsp8TokenMetadataBaseUris,
    },
  } = scanLogs(context);

  context.log.info(
    JSON.stringify({
      message: 'Validating Universal Profiles.',
      universalProfilesCount: universalProfiles.size,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: 'Validating Digital Assets.',
      digitalAssetsCount: digitalAssets.size,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: 'Validating NFTs.',
      nftsCount: nfts.size,
    }),
  );

  const {
    universalProfiles: { newUniversalProfiles, validUniversalProfiles, invalidUniversalProfiles },
    digitalAssets: { newDigitalAssets, validDigitalAssets, invalidDigitalAssets },
    verifiedNfts,
  } = await Utils.verifyAll({
    context,
    universalProfiles,
    digitalAssets,
    nfts,
  });

  context.log.info(
    JSON.stringify({
      message: 'Populating Universal Profiles.',
      newUniversalProfilesCount: newUniversalProfiles.size,
      validUniversalProfilesCount: validUniversalProfiles.size,
      invalidUniversalProfilesCount: invalidUniversalProfiles.size,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: 'Populating Digital Assets.',
      newDigitalAssetsCount: newDigitalAssets.size,
      validDigitalAssetsCount: validDigitalAssets.size,
      invalidDigitalAssetsCount: invalidDigitalAssets.size,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: 'Populating NFTs.',
      verifiedNftsCount: verifiedNfts.length,
    }),
  );

  const {
    populatedNfts,
    events: {
      populatedExecutes,
      populatedDataChangeds,
      populatedUniversalReceivers,
      populatedTransfers,
      populatedTokenIdDataChangeds,
    },
    dataKeys: {
      populatedLsp3ProfileUrls,
      populatedLsp4MetadataUrls,
      populatedLsp4TokenNames,
      populatedLsp4TokenSymbols,
      populatedLsp4TokenTypes,
      populatedLsp8ReferenceContracts,
      populatedLsp8TokenIdFormats,
      populatedLsp8TokenMetadataBaseUris,
    },
  } = Utils.populateAll({
    validUniversalProfiles,
    validDigitalAssets,
    verifiedNfts,
    executedEvents,
    dataChangedEvents,
    universalReceiverEvents,
    transferEvents,
    tokenIdDataChangedEvents,
    lsp3ProfileUrls,
    lsp4MetadataUrls,
    lsp4TokenNames,
    lsp4TokenSymbols,
    lsp4TokenTypes,
    lsp8ReferenceContracts,
    lsp8TokenIdFormats,
    lsp8TokenMetadataBaseUris,
  });

  const populatedNftsWithoutFormattedTokenId = [...populatedNfts.values()].filter(
    (nft) => !nft.formattedTokenId,
  );
  if (populatedNftsWithoutFormattedTokenId.length > 0) {
    context.log.info(
      JSON.stringify({
        message: 'Updating `formattedTokenId` for NFTs.',
      }),
    );

    const lsp8TokenIdFormats = [
      ...(await context.store.findBy(LSP8TokenIdFormat, {
        address: In([
          ...new Set(populatedNftsWithoutFormattedTokenId.map(({ address }) => address)),
        ]),
      })),
      ...populatedLsp8TokenIdFormats,
    ];

    for (const nft of populatedNftsWithoutFormattedTokenId) {
      const latestLsp8TokenIdFormat = lsp8TokenIdFormats
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

  if (populatedLsp8TokenIdFormats.length > 0) {
    context.log.info(
      JSON.stringify({
        message: 'Found new LSP8TokenIdFormat data keys. Updating old `formattedTokenId` for NFTs.',
      }),
    );

    const nfts = await context.store.findBy(NFT, {
      address: In([...new Set(populatedLsp8TokenIdFormats.map(({ address }) => address))]),
    });

    for (const nft of nfts) {
      if (!populatedNfts.has(nft.id)) {
        populatedNfts.set(nft.id, nft);
      }
    }

    for (const lsp8TokenIdFormat of populatedLsp8TokenIdFormats) {
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

  context.log.info(
    JSON.stringify({
      message: 'Saving Universal Profiles.',
      universalProfilesCount: newUniversalProfiles.size,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: 'Saving Digital Assets.',
      digitalAssetsCount: newDigitalAssets.size,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: 'Saving NFTs.',
      nftsCount: populatedNfts.size,
    }),
  );

  await Promise.all([
    context.store.upsert([...newUniversalProfiles.values()]),
    context.store.upsert([...newDigitalAssets.values()]),
    context.store.upsert([...populatedNfts.values()]),
  ]);

  context.log.info(
    JSON.stringify({
      message: 'Inserting new Events.',
      populatedExecutesCount: populatedExecutes.length,
      populatedDataChangedsCount: populatedDataChangeds.length,
      populatedUniversalReceiversCount: populatedUniversalReceivers.length,
      populatedTransfersCount: populatedTransfers.length,
      populatedTokenIdDataChangedsCount: populatedTokenIdDataChangeds.length,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: 'Inserting new ERC725 Data Keys.',
      populatedLsp3ProfileUrlsCount: populatedLsp3ProfileUrls.length,
      populatedLsp4MetadataUrlsCount: populatedLsp4MetadataUrls.length,
      populatedLsp4TokenNamesCount: populatedLsp4TokenNames.length,
      populatedLsp4TokenSymbolsCount: populatedLsp4TokenSymbols.length,
      populatedLsp4TokenTypesCount: populatedLsp4TokenTypes.length,
      populatedLsp8ReferenceContractsCount: populatedLsp8ReferenceContracts.length,
      populatedLsp8TokenIdFormatsCount: populatedLsp8TokenIdFormats.length,
      populatedLsp8TokenMetadataBaseUrisCount: populatedLsp8TokenMetadataBaseUris.length,
    }),
  );

  await Promise.all([
    // Save tracked events
    /// event Executed(uint256,address,uint256,bytes4);
    context.store.insert(populatedExecutes),
    /// event DataChanged(bytes32,bytes);
    context.store.insert(populatedDataChangeds),
    /// event UniversalReceiver(address,uint256,bytes32,bytes,bytes);
    context.store.insert(populatedUniversalReceivers),
    /// event Transfer(address,address,address,uint256,bool,bytes);
    /// event Transfer(address,address,address,bytes32,bool,bytes);
    context.store.insert(populatedTransfers),
    /// event TokenIdDataChanged(bytes32,bytes32,bytes);
    context.store.insert(populatedTokenIdDataChangeds),

    // Save tracked starndardized DataKeys
    /// LSP3ProfileUrl
    context.store.insert(populatedLsp3ProfileUrls),
    /// LSP4MetadataUrl
    context.store.insert(populatedLsp4MetadataUrls),
    /// LSP4TokenName
    context.store.insert(populatedLsp4TokenNames),
    /// LSP4TokenSymbol
    context.store.insert(populatedLsp4TokenSymbols),
    /// LSP4TokenType
    context.store.insert(populatedLsp4TokenTypes),
    /// LSP8ReferenceContract
    context.store.insert(populatedLsp8ReferenceContracts),
    /// LSP8TokenIdFormat
    context.store.insert(populatedLsp8TokenIdFormats),
    /// LSP8TokenMetadataBaseURI
    context.store.insert(populatedLsp8TokenMetadataBaseUris),
  ]);

  if (populatedLsp3ProfileUrls.length > 0) {
    context.log.info(
      JSON.stringify({ message: 'Extracting LSP3Profile from LSP3Profile data key' }),
    );

    const { lsp3Profiles, lsp3Links, lsp3Assets, lsp3ProfileImages, lsp3BackgroundImages } =
      await Utils.DataChanged.LSP3Profile.extractFromUrl({ context, populatedLsp3ProfileUrls });

    await context.store.insert(lsp3Profiles);
    await Promise.all([
      context.store.insert(lsp3Links),
      context.store.insert(lsp3Assets),
      context.store.insert(lsp3ProfileImages),
      context.store.insert(lsp3BackgroundImages),
    ]);
  }

  if (populatedLsp4MetadataUrls.length > 0) {
    context.log.info(
      JSON.stringify({ message: 'Extracting LSP4Metadata from LSP4Metadata data key' }),
    );

    const { lsp4Metadatas, lsp4Links, lsp4Assets, lsp4Icons, lsp4Images, lsp4Attributes } =
      await Utils.DataChanged.LSP4Metadata.extractFromUrl({ context, populatedLsp4MetadataUrls });

    await context.store.insert(lsp4Metadatas);
    await Promise.all([
      context.store.insert(lsp4Links),
      context.store.insert(lsp4Assets),
      context.store.insert(lsp4Icons),
      context.store.insert(lsp4Images),
      context.store.insert(lsp4Attributes),
    ]);
  }

  if (populatedLsp8TokenMetadataBaseUris.length > 0) {
    context.log.info(
      JSON.stringify({ message: 'Extracting LSP4Metadata from LSP8TokenMetadataBaseURI data key' }),
    );

    const { lsp4Metadatas, lsp4Links, lsp4Assets, lsp4Icons, lsp4Images, lsp4Attributes } =
      await Utils.DataChanged.LSP4Metadata.extractFromBaseUri({
        context,
        populatedLsp8TokenMetadataBaseUris,
      });

    await context.store.insert(lsp4Metadatas);
    await Promise.all([
      context.store.insert(lsp4Links),
      context.store.insert(lsp4Assets),
      context.store.insert(lsp4Icons),
      context.store.insert(lsp4Images),
      context.store.insert(lsp4Attributes),
    ]);
  } else if (
    transferEvents.filter(
      (transferEvent) =>
        isAddressEqual(getAddress(transferEvent.from), zeroAddress) && transferEvent.tokenId,
    ).length > 0
  ) {
    context.log.info(
      JSON.stringify({
        message:
          'Extracting LSP4Metadata from minted NFTs of a Digital Asset that has a valid LSP8TokenMetadataBaseURI',
      }),
    );

    const { lsp4Metadatas, lsp4Links, lsp4Assets, lsp4Icons, lsp4Images, lsp4Attributes } =
      await Utils.DataChanged.LSP4Metadata.extractFromTransfers({
        context,
        transfers: transferEvents,
      });

    await context.store.insert(lsp4Metadatas);
    await Promise.all([
      context.store.insert(lsp4Links),
      context.store.insert(lsp4Assets),
      context.store.insert(lsp4Icons),
      context.store.insert(lsp4Images),
      context.store.insert(lsp4Attributes),
    ]);
  }

  if (populatedTransfers.length > 0) {
    const updatedOwnedAssetsMap = new Map<string, OwnedAsset>();
    const updatedOwnedTokensMap = new Map<string, OwnedToken>();
    const [existingOwnedAssetsMap, existingOwnedTokensMap]: [
      Map<string, OwnedAsset>,
      Map<string, OwnedToken>,
    ] = await Promise.all([
      context.store.findBy(OwnedAsset, {
        id: In([
          ...new Set(
            populatedTransfers.flatMap(({ address, from, to }) => [
              Utils.generateOwnedAssetId({ address, owner: from }),
              Utils.generateOwnedAssetId({ address, owner: to }),
            ]),
          ),
        ]),
      }),
      context.store.findBy(OwnedToken, {
        id: In([
          ...new Set(
            populatedTransfers
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
        message: 'Extracting updated OwnedAssets and OwnedTokens from Transfers',
        transfersCount: populatedTransfers.length,
      }),
    );

    for (const transfer of populatedTransfers) {
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
        message: 'Updating and removing extracted OwnedAssets and OwnedTokens',
        ownedAssetsToSaveCount: ownedAssetsToSave.length,
        ownedAssetsToDeleteCount: ownedAssetsToDelete.length,
        ownedTokensToSaveCount: ownedTokensToSave.length,
        ownedTokensToDeleteCount: ownedTokensToDelete.length,
      }),
    );

    await context.store.upsert(ownedAssetsToSave);
    await context.store.upsert(ownedTokensToSave);

    await context.store.remove(ownedTokensToDelete);
    await context.store.remove(ownedAssetsToDelete);
  }

  if (context.isHead) {
    const existingChillClaimedEntities = await context.store.find(ChillClaimed);
    const chillMintTransfers = transferEvents.filter(
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
          message: 'CHILL claim events found.',
          chillClaimedEntitiesCount: chillClaimedEntities.length,
        }),
      );

      await context.store.insert(chillClaimedEntities);
    }

    const existingOrbsClaimedEntities = await context.store.find(OrbsClaimed);
    const orbsMintTransfers = transferEvents.filter(
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
          message: 'ORBS claim events found.',
          orbsClaimedEntitiesCount: orbsClaimedEntities.length,
        }),
      );

      await context.store.insert(orbsClaimedEntities);
    }
  }
});
