import { processor } from '@/app/processor';
import * as Utils from '@/utils';
import { TypeormDatabase } from '@subsquid/typeorm-store';
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
  ]);

  await Promise.all(
    populatedLsp3ProfileUrls.map((lsp3ProfileUrl) =>
      Utils.createLsp3ProfilePromise(lsp3ProfileUrl),
    ),
  ).then((lsp3Profiles) => context.store.insert(lsp3Profiles));
  await Promise.all(
    populatedLsp4MetadataUrls.map((lsp4MetadataUrl) =>
      Utils.createLsp4MetadataPromise(lsp4MetadataUrl),
    ),
  ).then((lsp4Metadatas) => context.store.insert(lsp4Metadatas));

  // TODO
  // Investigate: https://www.reddit.com/r/node/comments/11e5hyj/executing_1000_http_requests_at_once/
  // RunQueue: https://www.npmjs.com/package/run-queue
  // if (context.isHead) {
  //   context.store.findBy(UniversalProfile, { lsp3ProfileUrlLatest: Not(null) });
  // }
});
