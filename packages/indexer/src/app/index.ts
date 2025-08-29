import { processor } from '@/app/processor';
import { CHILL_ADDRESS, ORBS_ADDRESS } from '@/constants';
import * as Utils from '@/utils';
import {
  ChillClaimed,
  DigitalAsset,
  Follow,
  LSP3Profile,
  LSP3ProfileAsset,
  LSP3ProfileBackgroundImage,
  LSP3ProfileDescription,
  LSP3ProfileImage,
  LSP3ProfileLink,
  LSP3ProfileName,
  LSP3ProfileTag,
  LSP4Metadata,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataDescription,
  LSP4MetadataIcon,
  LSP4MetadataImage,
  LSP4MetadataLink,
  LSP4MetadataName,
  LSP4MetadataRank,
  LSP4MetadataScore,
  LSP8TokenIdFormat,
  NFT,
  OrbsClaimed,
  OwnedAsset,
  OwnedToken,
  Unfollow,
  UniversalProfile,
} from '@chillwhales/sqd-typeorm';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { In, IsNull, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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
      followEvents,
      unfollowEvents,
    },
    dataKeys: {
      lsp3Profiles,
      lsp4TokenNames,
      lsp4TokenSymbols,
      lsp4TokenTypes,
      lsp4Metadatas,
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
    nfts: { newNfts, validNfts },
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
      newNftsCount: newNfts.size,
      validNftsCount: validNfts.size,
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
      populatedFollows,
      populatedUnfollows,
    },
    dataKeys: {
      populatedLsp3Profiles,
      populatedLsp4Metadatas,
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
    newNfts,
    executedEvents,
    dataChangedEvents,
    universalReceiverEvents,
    transferEvents,
    tokenIdDataChangedEvents,
    followEvents,
    unfollowEvents,
    lsp3Profiles,
    lsp4Metadatas,
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
        message:
          "Found new LSP8TokenIdFormat data keys. Updating old `formattedTokenId` for 'NFT' entities.",
      }),
    );

    const nfts = await context.store.findBy(NFT, {
      address: In([...new Set(populatedLsp8TokenIdFormats.map(({ address }) => address))]),
      id: Not(In([...populatedNfts.values()].map(({ id }) => id))),
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
      message: "Saving 'UniversalProfile' entities.",
      universalProfilesCount: newUniversalProfiles.size,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: "Saving 'DigitalAsset' entities.",
      digitalAssetsCount: newDigitalAssets.size,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: "Saving 'NFT' entities.",
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
      ExecuteCount: populatedExecutes.length,
      DataChangedCount: populatedDataChangeds.length,
      UniversalReceiverCount: populatedUniversalReceivers.length,
      TransferCount: populatedTransfers.length,
      TokenIdDataChangedCount: populatedTokenIdDataChangeds.length,
      FollowCount: populatedFollows.length,
      UnfollowCount: populatedUnfollows.length,
    }),
  );
  context.log.info(
    JSON.stringify({
      message: 'Inserting new ERC725 Data Keys.',
      LSP3ProfileCount: populatedLsp3Profiles.length,
      LSP4MetadataCount: populatedLsp4Metadatas.length,
      LSP4TokenNameCount: populatedLsp4TokenNames.length,
      LSP4TokenSymbolCount: populatedLsp4TokenSymbols.length,
      LSP4TokenTypeCount: populatedLsp4TokenTypes.length,
      LSP8ReferenceContractCount: populatedLsp8ReferenceContracts.length,
      LSP8TokenIdFormatCount: populatedLsp8TokenIdFormats.length,
      LSP8TokenMetadataBaseURICount: populatedLsp8TokenMetadataBaseUris.length,
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
    /// event Follow(address,address);
    context.store.insert(populatedFollows),
    /// event Unfollow(address,address);
    context.store.insert(populatedUnfollows),

    // Save tracked starndardized DataKeys
    /// LSP3Profile
    context.store.insert(populatedLsp3Profiles),
    /// LSP4Metadata
    context.store.insert(populatedLsp4Metadatas),
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

  const universalProfilesToUpdate = new Map(
    populatedLsp3Profiles
      .filter(({ universalProfile }) => universalProfile)
      .map(({ id, universalProfile }) => [
        universalProfile.id,
        new UniversalProfile({
          ...validUniversalProfiles.get(universalProfile.id)!,
          lsp3Profile: new LSP3Profile({ id }),
        }),
      ]),
  );
  if (universalProfilesToUpdate.size) {
    context.log.info(
      JSON.stringify({
        message:
          "Inserting populated 'UniversalProfile' entities with found 'LSP3Profile' entities",
        universalProfilesToUpdateCount: universalProfilesToUpdate.size,
      }),
    );

    await context.store.upsert([...universalProfilesToUpdate.values()]);
  }

  const baseUriLsp4Metadatas: LSP4Metadata[] = [];
  if (populatedLsp8TokenMetadataBaseUris.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Extracting 'LSP4Metadata' entities from 'LSP8TokenMetadataBaseURI' data key",
      }),
    );

    const extractedLsp4Metadatas = await Utils.DataChanged.LSP4Metadata.extractFromBaseUri({
      context,
      populatedLsp8TokenMetadataBaseUris,
    });

    baseUriLsp4Metadatas.push(...extractedLsp4Metadatas);
  } else if (
    transferEvents.filter(
      (transferEvent) =>
        isAddressEqual(getAddress(transferEvent.from), zeroAddress) && transferEvent.tokenId,
    ).length > 0
  ) {
    context.log.info(
      JSON.stringify({
        message:
          "Extracting 'LSP4Metadata' entities from minted NFTs of a Digital Asset that has a valid 'LSP8TokenMetadataBaseURI'",
      }),
    );

    const extractedLsp4Metadatas = await Utils.DataChanged.LSP4Metadata.extractFromMints({
      context,
      transfers: transferEvents,
    });

    baseUriLsp4Metadatas.push(...extractedLsp4Metadatas);
  }

  if (baseUriLsp4Metadatas.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Inserting found 'LSP4Metadata' entities from 'LSP8TokenMetadataBaseURI'",
        extractedLsp4MetadatasCount: baseUriLsp4Metadatas.length,
      }),
    );

    await context.store.insert(baseUriLsp4Metadatas);
  }

  const allNewLsp4Metadatas = [...populatedLsp4Metadatas, ...baseUriLsp4Metadatas];
  const digitalAssetsToUpdate = new Map(
    allNewLsp4Metadatas
      .filter(({ digitalAsset, nft }) => digitalAsset && !nft)
      .map(({ id, digitalAsset }) => [
        digitalAsset.id,
        new DigitalAsset({
          ...validDigitalAssets.get(digitalAsset.id)!,
          lsp4Metadata: new LSP4Metadata({ id }),
        }),
      ]),
  );
  if (digitalAssetsToUpdate.size) {
    context.log.info(
      JSON.stringify({
        message: "Inserting populated 'DigitalAsset' entities with found 'LSP4Metadata'",
        digitalAssetsToUpdateCount: digitalAssetsToUpdate.size,
      }),
    );

    await context.store.upsert([...digitalAssetsToUpdate.values()]);
  }

  const nftsToUpdate = allNewLsp4Metadatas.filter(({ nft }) => nft).map(({ nft }) => nft);
  if (nftsToUpdate.length) {
    context.log.info(
      JSON.stringify({
        message: "Inserting populated 'NFT' entities with found 'LSP4Metadata'",
        nftsToUpdateCount: nftsToUpdate.length,
      }),
    );

    const knownNfts: Map<string, NFT> = await context.store
      .findBy(NFT, { address: In([...new Set(nftsToUpdate.map(({ address }) => address))]) })
      .then((nfts) => new Map(nfts.map((nft) => [nft.id, nft])));

    await context.store.upsert([
      ...new Map(
        allNewLsp4Metadatas
          .filter(({ nft }) => nft && knownNfts.has(nft.id))
          .map(({ id, nft }) => [
            nft.id,
            new NFT({
              ...knownNfts.get(nft.id),
              lsp4Metadata: new LSP4Metadata({ id }),
            }),
          ]),
      ).values(),
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
        message:
          "Extracting updated 'OwnedAsset' entities and 'OwnedToken' entities from 'Transfer' events",
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

  if (populatedFollows.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Follow events found. Adding new identifiable 'Follow' entities.",
        followsCount: populatedFollows.length,
      }),
    );

    const identifiableFollowsMap = new Map(
      populatedFollows.map((follow) => {
        const id = Utils.generateFollowId({
          followerAddress: follow.followerAddress,
          followedAddress: follow.followedAddress,
        });
        return [
          id,
          new Follow({
            ...follow,
            id,
          }),
        ];
      }),
    );
    await context.store.upsert([...identifiableFollowsMap.values()]);
  }

  if (populatedUnfollows.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Unfollow events found. Removing identifiable 'Follow' entities.",
        unfollowsCount: populatedUnfollows.length,
      }),
    );

    const identifiableUnfollowsMap = new Map(
      populatedUnfollows.map((unfollow) => {
        const id = Utils.generateFollowId({
          followerAddress: unfollow.followerAddress,
          followedAddress: unfollow.unfollowedAddress,
        });
        return [
          id,
          new Unfollow({
            ...unfollow,
            id,
          }),
        ];
      }),
    );
    await context.store.remove([...identifiableUnfollowsMap.values()]);
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
          message: "'ChillClaimed' entities found.",
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
          message: "'OrbsClaimed' entities found.",
          orbsClaimedEntitiesCount: orbsClaimedEntities.length,
        }),
      );

      await context.store.insert(orbsClaimedEntities);
    }

    const unfetchedLsp3Profiles = await context.store.findBy(LSP3Profile, {
      dataFetched: Not(true),
      url: Not(IsNull()),
    });
    if (unfetchedLsp3Profiles.length > 0) {
      context.log.info(
        JSON.stringify({
          message: "'LSP3Profile' entities found with unfetched data",
          unfetchedLsp3ProfilesCount: unfetchedLsp3Profiles.length,
        }),
      );

      const updatedLsp3Profiles: LSP3Profile[] = [];

      const lsp3ProfileNames: LSP3ProfileName[] = [];
      const lsp3ProfileDescriptions: LSP3ProfileDescription[] = [];
      const lsp3ProfileTags: LSP3ProfileTag[] = [];
      const lsp3ProfileLinks: LSP3ProfileLink[] = [];
      const lsp3ProfileAssets: LSP3ProfileAsset[] = [];
      const lsp3ProfileImages: LSP3ProfileImage[] = [];
      const lsp3ProfileBackgroundImages: LSP3ProfileBackgroundImage[] = [];

      const BATCH_SIZE = 10_000;
      const batchesCount =
        unfetchedLsp3Profiles.length % BATCH_SIZE
          ? Math.floor(unfetchedLsp3Profiles.length / BATCH_SIZE) + 1
          : unfetchedLsp3Profiles.length / BATCH_SIZE;

      for (let index = 0; index < batchesCount; index++) {
        const currentBatch = unfetchedLsp3Profiles.slice(
          index * BATCH_SIZE,
          (index + 1) * BATCH_SIZE,
        );
        context.log.info(
          JSON.stringify({
            message: `Processing batch ${index + 1}/${batchesCount} of 'LSP3Profile' entities with unfetched data`,
          }),
        );

        for (const lsp3Profile of currentBatch) {
          Utils.createLsp3Profile(lsp3Profile).then((result) => {
            if (result.fetchError) {
              updatedLsp3Profiles.push(
                new LSP3Profile({
                  ...lsp3Profile,
                  fetchError: result.fetchError,
                  dataFetched: true,
                }),
              );
            } else {
              updatedLsp3Profiles.push(
                new LSP3Profile({
                  ...lsp3Profile,
                  dataFetched: true,
                }),
              );

              lsp3ProfileNames.push(result.lsp3ProfileName);
              lsp3ProfileDescriptions.push(result.lsp3ProfileDescription);
              lsp3ProfileTags.push(...result.lsp3ProfileTags);
              lsp3ProfileLinks.push(...result.lsp3ProfileLinks);
              lsp3ProfileAssets.push(...result.lsp3ProfileAssets);
              lsp3ProfileImages.push(...result.lsp3ProfileImages);
              lsp3ProfileBackgroundImages.push(...result.lsp3ProfileBackgroundImages);
            }
          });
        }

        while (
          updatedLsp3Profiles.length <
          (index + 1 === batchesCount ? unfetchedLsp3Profiles.length : (index + 1) * BATCH_SIZE)
        ) {
          await Utils.timeout(1000);
        }
      }

      context.log.info(
        JSON.stringify({
          message: "Saving fetched 'LSP3Profile' related entities",
          lsp3ProfileNamesCount: lsp3ProfileNames.length,
          lsp3ProfileDescriptionsCount: lsp3ProfileDescriptions.length,
          lsp3ProfileTagsCount: lsp3ProfileTags.length,
          lsp3ProfileLinksCount: lsp3ProfileLinks.length,
          lsp3ProfileAssetsCount: lsp3ProfileAssets.length,
          lsp3ProfileImagesCount: lsp3ProfileImages.length,
          lsp3ProfileBackgroundImagesCount: lsp3ProfileBackgroundImages.length,
        }),
      );

      await Promise.all([
        context.store.upsert(updatedLsp3Profiles),
        context.store.insert(lsp3ProfileNames),
        context.store.insert(lsp3ProfileDescriptions),
        context.store.insert(lsp3ProfileTags),
        context.store.insert(lsp3ProfileLinks),
        context.store.insert(lsp3ProfileAssets),
        context.store.insert(lsp3ProfileImages),
        context.store.insert(lsp3ProfileBackgroundImages),
      ]);
    }

    const unfetchedLsp4Metadatas = await context.store.findBy(LSP4Metadata, {
      dataFetched: Not(true),
      url: Not(IsNull()),
    });
    if (unfetchedLsp4Metadatas.length > 0) {
      context.log.info(
        JSON.stringify({
          message: "'LSP4Metadata' entities found with unfetched data",
          unfetchedLsp4MetadatasCount: unfetchedLsp4Metadatas.length,
        }),
      );

      const updatedLsp4Metadatas: LSP4Metadata[] = [];

      const lsp4MetadataName: LSP4MetadataName[] = [];
      const lsp4MetadataDescription: LSP4MetadataDescription[] = [];
      const lsp4MetadataLinks: LSP4MetadataLink[] = [];
      const lsp4MetadataImages: LSP4MetadataImage[] = [];
      const lsp4MetadataIcons: LSP4MetadataIcon[] = [];
      const lsp4MetadataAssets: LSP4MetadataAsset[] = [];
      const lsp4MetadataAttributes: LSP4MetadataAttribute[] = [];

      const BATCH_SIZE = 10_000;
      const batchesCount =
        unfetchedLsp4Metadatas.length % BATCH_SIZE
          ? Math.floor(unfetchedLsp4Metadatas.length / BATCH_SIZE) + 1
          : unfetchedLsp4Metadatas.length / BATCH_SIZE;

      for (let index = 0; index < batchesCount; index++) {
        const currentBatch = unfetchedLsp4Metadatas.slice(
          index * BATCH_SIZE,
          (index + 1) * BATCH_SIZE,
        );
        context.log.info(
          JSON.stringify({
            message: `Processing batch ${index + 1}/${batchesCount} of 'LSP4Metadata' entities with unfetched data`,
          }),
        );

        for (const lsp4Metadata of currentBatch) {
          Utils.createLsp4Metadata(lsp4Metadata).then((result) => {
            if (result.fetchError) {
              updatedLsp4Metadatas.push(
                new LSP4Metadata({
                  ...lsp4Metadata,
                  fetchError: result.fetchError,
                  dataFetched: true,
                }),
              );
            } else {
              updatedLsp4Metadatas.push(
                new LSP4Metadata({
                  ...lsp4Metadata,
                  dataFetched: true,
                }),
              );

              lsp4MetadataName.push(result.lsp4MetadataName);
              lsp4MetadataDescription.push(result.lsp4MetadataDescription);
              lsp4MetadataLinks.push(...result.lsp4MetadataLinks);
              lsp4MetadataImages.push(...result.lsp4MetadataImages);
              lsp4MetadataIcons.push(...result.lsp4MetadataIcons);
              lsp4MetadataAssets.push(...result.lsp4MetadataAssets);
              lsp4MetadataAttributes.push(...result.lsp4MetadataAttributes);
            }
          });
        }

        while (
          updatedLsp4Metadatas.length <
          (index + 1 === batchesCount ? unfetchedLsp4Metadatas.length : (index + 1) * BATCH_SIZE)
        ) {
          await Utils.timeout(1000);
        }
      }

      context.log.info(
        JSON.stringify({
          message: "Saving fetched 'LSP4Metadata' related entities",
          lsp4MetadataNameCount: lsp4MetadataName.length,
          lsp4MetadataDescriptionCount: lsp4MetadataDescription.length,
          lsp4MetadataLinksCount: lsp4MetadataLinks.length,
          lsp4MetadataImagesCount: lsp4MetadataImages.length,
          lsp4MetadataIconsCount: lsp4MetadataIcons.length,
          lsp4MetadataAssetsCount: lsp4MetadataAssets.length,
          lsp4MetadataAttributesCount: lsp4MetadataAttributes.length,
        }),
      );

      await Promise.all([
        context.store.upsert(updatedLsp4Metadatas),
        context.store.insert(lsp4MetadataName),
        context.store.insert(lsp4MetadataDescription),
        context.store.insert(lsp4MetadataLinks),
        context.store.insert(lsp4MetadataImages),
        context.store.insert(lsp4MetadataIcons),
        context.store.insert(lsp4MetadataAssets),
        context.store.insert(lsp4MetadataAttributes),
        context.store.insert(
          lsp4MetadataAttributes
            .filter(({ key, value }) => key === 'Score' && Utils.isNumeric(value))
            .map(
              ({ value, lsp4Metadata }) =>
                new LSP4MetadataScore({
                  id: uuidv4(),
                  lsp4Metadata,
                  value: parseInt(value),
                }),
            ),
        ),
        context.store.insert(
          lsp4MetadataAttributes
            .filter(({ key, value }) => key === 'Rank' && Utils.isNumeric(value))
            .map(
              ({ value, lsp4Metadata }) =>
                new LSP4MetadataRank({
                  id: uuidv4(),
                  lsp4Metadata,
                  value: parseInt(value),
                }),
            ),
        ),
      ]);
    }
  }
});
