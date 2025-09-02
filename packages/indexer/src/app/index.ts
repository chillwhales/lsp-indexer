import { processor } from '@/app/processor';
import {
  CHILL_ADDRESS,
  FETCH_BATCH_SIZE,
  FETCH_LIMIT,
  FETCH_RETRY_COUNT,
  ORBS_ADDRESS,
} from '@/constants';
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
} from '@chillwhales/typeorm';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { In, IsNull, LessThan, Like, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { getAddress, isAddressEqual, isHex, zeroAddress } from 'viem';
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
  } = await Utils.verifyAll({
    context,
    universalProfiles,
    digitalAssets,
    nfts,
  });

  if (universalProfiles.size) {
    context.log.info(
      JSON.stringify({
        message: "Verified 'UniversalProfile' entities",
        newUniversalProfilesCount: newUniversalProfiles.size,
        validUniversalProfilesCount: validUniversalProfiles.size,
        invalidUniversalProfilesCount: invalidUniversalProfiles.size,
      }),
    );
  }
  if (digitalAssets.size) {
    context.log.info(
      JSON.stringify({
        message: "Verified 'DigitalAsset' entities",
        newDigitalAssetsCount: newDigitalAssets.size,
        validDigitalAssetsCount: validDigitalAssets.size,
        invalidDigitalAssetsCount: invalidDigitalAssets.size,
      }),
    );
  }
  if (nfts.size) {
    context.log.info(
      JSON.stringify({
        message: "Verified 'NFT' entities",
        newNftsCount: newNfts.size,
        validNftsCount: validNfts.size,
      }),
    );
  }

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
  } = Utils.populateAll({
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

  if (populatedLsp3ProfileEntities.length > 0) {
    await Utils.clearLsp3ProfileEntities({
      context,
      lsp3ProfileEntites: populatedLsp3ProfileEntities,
    });
  }

  if (populatedLsp4MetadataEntities.length > 0) {
    await Utils.clearLsp4MetadataEntities({
      context,
      lsp4MetadataEntites: populatedLsp4MetadataEntities,
    });
  }

  const lsp4MetadataBaseUriEntities = await Utils.LSP4MetadataBaseURI.extract({
    context,
    populatedTransferEntities,
    populatedLsp8TokenMetadataBaseUriEntities,
    populatedNfts,
  });
  if (lsp4MetadataBaseUriEntities.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Inserting found 'LSP4Metadata' entities from 'LSP8TokenMetadataBaseURI'",
        lsp4MetadataBaseUriEntitiesCount: lsp4MetadataBaseUriEntities.length,
      }),
    );

    await Utils.clearLsp4MetadataEntities({
      context,
      lsp4MetadataEntites: lsp4MetadataBaseUriEntities,
    });
  }

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
        message: 'Inserting new Events',
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
    lsp4MetadataBaseUriEntities.length ||
    populatedLsp4TokenNameEntities.length ||
    populatedLsp4TokenSymbolEntities.length ||
    populatedLsp4TokenTypeEntities.length ||
    populatedLsp8ReferenceContractEntities.length ||
    populatedLsp8TokenIdFormatEntities.length ||
    populatedLsp8TokenMetadataBaseUriEntities.length
  ) {
    context.log.info(
      JSON.stringify({
        message: 'Inserting new ERC725 Data Keys',
        ...(populatedLsp3ProfileEntities.length && {
          LSP3ProfileEntitiesCount: populatedLsp3ProfileEntities.length,
        }),
        ...(populatedLsp4MetadataEntities.length && {
          LSP4MetadataEntitiesCount: populatedLsp4MetadataEntities.length,
        }),
        ...(lsp4MetadataBaseUriEntities.length && {
          LSP4MetadataBaseURIEntitiesCount: lsp4MetadataBaseUriEntities.length,
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
    context.store.upsert(lsp4MetadataBaseUriEntities),
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

  const universalProfilesToUpdate = new Map(
    populatedLsp3ProfileEntities
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
        message: "Saving populated 'UniversalProfile' entities with found 'LSP3Profile' entities",
        universalProfilesToUpdateCount: universalProfilesToUpdate.size,
      }),
    );

    await context.store.upsert([...universalProfilesToUpdate.values()]);
  }

  const digitalAssetsToUpdate = new Map(
    populatedLsp4MetadataEntities
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
        message: "Saving populated 'DigitalAsset' entities with found 'LSP4Metadata' entities",
        digitalAssetsToUpdateCount: digitalAssetsToUpdate.size,
      }),
    );

    await context.store.upsert([...digitalAssetsToUpdate.values()]);
  }

  const foundNfts = [...populatedLsp4MetadataEntities, ...lsp4MetadataBaseUriEntities]
    .filter(({ nft }) => nft)
    .map(({ nft }) => nft);
  if (foundNfts.length) {
    const knownNfts: Map<string, NFT> = await context.store
      .findBy(NFT, {
        address: In([...new Set(foundNfts.map(({ address }) => address))]),
      })
      .then((nfts) => new Map(nfts.map((nft) => [nft.id, nft])));

    const nftsToUpdate = new Map<string, NFT>();

    for (const lsp4MetadataEntity of [
      ...populatedLsp4MetadataEntities,
      ...lsp4MetadataBaseUriEntities,
    ].filter(({ nft }) => nft && knownNfts.has(nft.id))) {
      const { id, nft } = lsp4MetadataEntity;

      if (nftsToUpdate.has(nft.id)) {
        nftsToUpdate.set(
          nft.id,
          new NFT({
            ...nftsToUpdate.get(nft.id),
            ...(lsp4MetadataEntity.id.startsWith('BaseURI - ')
              ? { lsp4MetadataBaseUri: new LSP4Metadata({ id }) }
              : { lsp4Metadata: new LSP4Metadata({ id }) }),
          }),
        );
      } else {
        nftsToUpdate.set(
          nft.id,
          new NFT({
            ...knownNfts.get(nft.id),
            ...(lsp4MetadataEntity.id.startsWith('BaseURI - ')
              ? { lsp4MetadataBaseUri: new LSP4Metadata({ id }) }
              : { lsp4Metadata: new LSP4Metadata({ id }) }),
          }),
        );
      }
    }

    context.log.info(
      JSON.stringify({
        message: "Saving populated 'NFT' entities with found 'LSP4Metadata' entities",
        nftsToUpdateCount: nftsToUpdate.size,
      }),
    );

    await context.store.upsert([...nftsToUpdate.values()]);
  }

  const lsp4MetadataEntitesWithInvalidUrl = await context.store.findBy(LSP4Metadata, {
    url: Like('%undefined%'),
    nft: { formattedTokenId: Not(IsNull()) },
  });
  if (lsp4MetadataEntitesWithInvalidUrl.length) {
    context.log.info({
      message: "Fixing 'LSP4Metadata' entities with invalid URLs, ending in 'undefined'",
      lsp4MetadataEntitesCount: lsp4MetadataEntitesWithInvalidUrl.length,
    });

    const updatedLsp4MetadataEntities: LSP4Metadata[] = [];

    const nfts = new Map(
      await context.store
        .findBy(NFT, {
          id: In(
            lsp4MetadataEntitesWithInvalidUrl.map(({ address, tokenId }) =>
              Utils.generateTokenId({ address, tokenId }),
            ),
          ),
        })
        .then((nfts) => nfts.map((nft) => [nft.id, nft])),
    );

    for (const lsp4Metadata of lsp4MetadataEntitesWithInvalidUrl) {
      const { address, tokenId, url } = lsp4Metadata;

      if (url.endsWith('undefined')) {
        updatedLsp4MetadataEntities.push(
          new LSP4Metadata({
            ...lsp4Metadata,
            url: url.replace(
              'undefined',
              nfts.get(Utils.generateTokenId({ address, tokenId })).formattedTokenId,
            ),
            isDataFetched: false,
            fetchErrorMessage: null,
            fetchErrorCode: null,
            fetchErrorStatus: null,
            retryCount: 0,
          }),
        );
      }
    }

    await context.store.upsert(updatedLsp4MetadataEntities);
  }

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

  if (populatedFollowEntities.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Follow events found. Adding new identifiable 'Follow' entities.",
        followsCount: populatedFollowEntities.length,
      }),
    );

    const identifiableFollowsMap = new Map(
      populatedFollowEntities.map((follow) => {
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

  if (populatedUnfollowEntities.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Unfollow events found. Removing identifiable 'Follow' entities.",
        unfollowsCount: populatedUnfollowEntities.length,
      }),
    );

    const identifiableUnfollowsMap = new Map(
      populatedUnfollowEntities.map((unfollow) => {
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
    const chillMintTransfers = transferEntities.filter(
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
    const orbsMintTransfers = transferEntities.filter(
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

    const unfetchedLsp3Profiles: LSP3Profile[] = [];
    unfetchedLsp3Profiles.push(
      ...(await context.store.find(LSP3Profile, {
        take: FETCH_LIMIT,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorCode: IsNull(),
          fetchErrorMessage: IsNull(),
          fetchErrorStatus: IsNull(),
        },
      })),
    );
    unfetchedLsp3Profiles.push(
      ...(await context.store.find(LSP3Profile, {
        take: FETCH_LIMIT - unfetchedLsp3Profiles.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );
    unfetchedLsp3Profiles.push(
      ...(await context.store.find(LSP3Profile, {
        take: FETCH_LIMIT - unfetchedLsp3Profiles.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );
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

      const batchesCount =
        unfetchedLsp3Profiles.length % FETCH_BATCH_SIZE
          ? Math.floor(unfetchedLsp3Profiles.length / FETCH_BATCH_SIZE) + 1
          : unfetchedLsp3Profiles.length / FETCH_BATCH_SIZE;

      for (let index = 0; index < batchesCount; index++) {
        const currentBatch = unfetchedLsp3Profiles.slice(
          index * FETCH_BATCH_SIZE,
          (index + 1) * FETCH_BATCH_SIZE,
        );
        context.log.info(
          JSON.stringify({
            message: `Processing batch ${index + 1}/${batchesCount} of 'LSP3Profile' entities with unfetched data`,
          }),
        );

        for (const lsp3Profile of currentBatch) {
          Utils.createLsp3Profile(lsp3Profile).then((result) => {
            if ('fetchErrorMessage' in result) {
              const { fetchErrorMessage, fetchErrorCode, fetchErrorStatus } = result;
              updatedLsp3Profiles.push(
                new LSP3Profile({
                  ...lsp3Profile,
                  fetchErrorMessage,
                  fetchErrorCode,
                  fetchErrorStatus,
                  retryCount: lsp3Profile.retryCount + 1,
                }),
              );
            } else {
              updatedLsp3Profiles.push(
                new LSP3Profile({
                  ...lsp3Profile,
                  isDataFetched: true,
                  fetchErrorMessage: null,
                  fetchErrorCode: null,
                  fetchErrorStatus: null,
                  retryCount: null,
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
          (index + 1 === batchesCount
            ? unfetchedLsp3Profiles.length
            : (index + 1) * FETCH_BATCH_SIZE)
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

    const unfetchedLsp4Metadatas: LSP4Metadata[] = [];
    unfetchedLsp4Metadatas.push(
      ...(await context.store.find(LSP4Metadata, {
        take: FETCH_LIMIT,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorCode: IsNull(),
          fetchErrorMessage: IsNull(),
          fetchErrorStatus: IsNull(),
        },
      })),
    );
    unfetchedLsp4Metadatas.push(
      ...(await context.store.find(LSP4Metadata, {
        take: FETCH_LIMIT - unfetchedLsp4Metadatas.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );
    unfetchedLsp4Metadatas.push(
      ...(await context.store.find(LSP4Metadata, {
        take: FETCH_LIMIT - unfetchedLsp4Metadatas.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );
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

      const batchesCount =
        unfetchedLsp4Metadatas.length % FETCH_BATCH_SIZE
          ? Math.floor(unfetchedLsp4Metadatas.length / FETCH_BATCH_SIZE) + 1
          : unfetchedLsp4Metadatas.length / FETCH_BATCH_SIZE;

      for (let index = 0; index < batchesCount; index++) {
        const currentBatch = unfetchedLsp4Metadatas.slice(
          index * FETCH_BATCH_SIZE,
          (index + 1) * FETCH_BATCH_SIZE,
        );
        context.log.info(
          JSON.stringify({
            message: `Processing batch ${index + 1}/${batchesCount} of 'LSP4Metadata' entities with unfetched data`,
          }),
        );

        for (const lsp4Metadata of currentBatch) {
          Utils.createLsp4Metadata(lsp4Metadata).then((result) => {
            if ('fetchErrorMessage' in result) {
              const { fetchErrorMessage, fetchErrorCode, fetchErrorStatus } = result;

              updatedLsp4Metadatas.push(
                new LSP4Metadata({
                  ...lsp4Metadata,
                  fetchErrorMessage,
                  fetchErrorCode,
                  fetchErrorStatus,
                  retryCount: lsp4Metadata.retryCount + 1,
                }),
              );
            } else {
              updatedLsp4Metadatas.push(
                new LSP4Metadata({
                  ...lsp4Metadata,
                  isDataFetched: true,
                  fetchErrorMessage: null,
                  fetchErrorCode: null,
                  fetchErrorStatus: null,
                  retryCount: null,
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
          (index + 1 === batchesCount
            ? unfetchedLsp4Metadatas.length
            : (index + 1) * FETCH_BATCH_SIZE)
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
