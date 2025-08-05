import { processor } from '@/app/processor';
import { CHILL_ADDRESS, ORBS_ADDRESS } from '@/constants';
import * as Utils from '@/utils';
import { ChillClaimed, OrbsClaimed } from '@chillwhales/sqd-typeorm';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';
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
    },
  } = scanLogs(context);

  // scanTransactions(context);
  const chillClaimedEntities: ChillClaimed[] = [];
  const orbsClaimedEntities: OrbsClaimed[] = [];
  if (context.isHead) {
    if (
      (await context.store.find(ChillClaimed)).length === 0 ||
      transferEvents.filter(
        (event) =>
          isAddressEqual(CHILL_ADDRESS, getAddress(event.address)) &&
          isAddressEqual(zeroAddress, getAddress(event.from)),
      )
    ) {
      chillClaimedEntities.push(...(await Utils.ChillClaimed.extract(context)));
    }

    if (
      (await context.store.find(OrbsClaimed)).length === 0 ||
      transferEvents.filter(
        (event) =>
          isAddressEqual(ORBS_ADDRESS, getAddress(event.address)) &&
          isAddressEqual(zeroAddress, getAddress(event.from)),
      )
    ) {
      orbsClaimedEntities.push(...(await Utils.OrbsClaimed.extract(context)));
    }
  }

  const {
    universalProfiles: { newUniversalProfiles, validUniversalProfiles },
    digitalAssets: { newDigitalAssets, validDigitalAssets },
    verifiedNfts,
  } = await Utils.verifyAll({
    context,
    universalProfiles,
    digitalAssets,
    nfts,
  });

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
  });

  await Promise.all([
    context.store.upsert([...newUniversalProfiles.values()]),
    context.store.upsert([...newDigitalAssets.values()]),
    context.store.upsert(populatedNfts),
  ]);

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

    // Save chillwhales specific events
    context.store.insert(chillClaimedEntities),
    context.store.insert(orbsClaimedEntities),
  ]);

  const lsp3Profiles = await Promise.all(
    populatedLsp3ProfileUrls.map((lsp3ProfileUrl) =>
      Utils.createLsp3ProfilePromise(lsp3ProfileUrl),
    ),
  );
  await context.store.insert(lsp3Profiles.map(({ lsp3Profile }) => lsp3Profile));
  await Promise.all([
    context.store.insert(lsp3Profiles.flatMap(({ lsp3Links }) => lsp3Links)),
    context.store.insert(lsp3Profiles.flatMap(({ lsp3Assets }) => lsp3Assets)),
    context.store.insert(lsp3Profiles.flatMap(({ lsp3ProfileImages }) => lsp3ProfileImages)),
    context.store.insert(lsp3Profiles.flatMap(({ lsp3BackgroundImages }) => lsp3BackgroundImages)),
  ]);

  const lsp4Metadatas = await Promise.all(
    populatedLsp4MetadataUrls.map((lsp4MetadataUrl) =>
      Utils.createLsp4MetadataPromise(lsp4MetadataUrl),
    ),
  );
  await context.store.insert(lsp4Metadatas.map(({ lsp4Metadata }) => lsp4Metadata));
  await Promise.all([
    context.store.insert(lsp4Metadatas.flatMap(({ lsp4Links }) => lsp4Links)),
    context.store.insert(lsp4Metadatas.flatMap(({ lsp4Assets }) => lsp4Assets)),
    context.store.insert(lsp4Metadatas.flatMap(({ lsp4Icons }) => lsp4Icons)),
    context.store.insert(lsp4Metadatas.flatMap(({ lsp4Images }) => lsp4Images)),
    context.store.insert(lsp4Metadatas.flatMap(({ lsp4Attributes }) => lsp4Attributes)),
  ]);
});
