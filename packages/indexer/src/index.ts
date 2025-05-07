import { processor } from '@/processor';
import type { ExtractParams } from '@/types';
import {
  DataChangedUtils,
  DigitalAssetUtils,
  ExecutedUtils,
  NFTUtils,
  TokenIdDataChangedUtils,
  TransferUtils,
  UniversalProfileUtils,
  UniversalReceiverUtils,
} from '@/utils';
import {
  ERC725X,
  ERC725Y,
  LSP0ERC725Account,
  LSP7DigitalAsset,
  LSP8IdentifiableDigitalAsset,
} from '@chillwhales/sqd-abi';
import {
  DataChanged,
  Executed,
  LSP3ProfileUrl,
  LSP4MetadataUrl,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP8ReferenceContract,
  LSP8TokenIdFormat,
  NFT,
  TokenIdDataChanged,
  Transfer,
  UniversalReceiver,
} from '@chillwhales/sqd-typeorm';
import { LSP3DataKeys } from '@lukso/lsp3-contracts';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { TypeormDatabase } from '@subsquid/typeorm-store';

processor.run(new TypeormDatabase(), async (context) => {
  const executedEvents: Executed[] = [];
  const dataChangedEvents: DataChanged[] = [];
  const universalReceiverEvents: UniversalReceiver[] = [];
  const transferEvents: Transfer[] = [];
  const tokenIdDataChangedEvents: TokenIdDataChanged[] = [];

  const universalProfiles = new Set<string>();
  const digitalAssets = new Set<string>();
  const nfts = new Map<string, NFT>();

  const lsp3ProfileUrls: LSP3ProfileUrl[] = [];
  const lsp4TokenNames: LSP4TokenName[] = [];
  const lsp4TokenSymbols: LSP4TokenSymbol[] = [];
  const lsp4TokenTypes: LSP4TokenType[] = [];
  const lsp4MetadataUrls: LSP4MetadataUrl[] = [];
  const lsp8TokenIdFormats: LSP8TokenIdFormat[] = [];
  const lsp8ReferenceContracts: LSP8ReferenceContract[] = [];

  for (const block of context.blocks) {
    const { logs } = block;

    for (const log of logs) {
      const extractParams: ExtractParams = { context, block, log };

      switch (log.topics[0]) {
        case ERC725X.events.Executed.topic: {
          universalProfiles.add(log.address);
          executedEvents.push(ExecutedUtils.extract(extractParams));
          break;
        }

        case ERC725Y.events.DataChanged.topic: {
          universalProfiles.add(log.address);
          digitalAssets.add(log.address);
          dataChangedEvents.push(DataChangedUtils.extract(extractParams));

          const { dataKey } = ERC725Y.events.DataChanged.decode(log);
          switch (dataKey) {
            case LSP3DataKeys.LSP3Profile: {
              lsp3ProfileUrls.push(DataChangedUtils.LSP3ProfileUrl.extract(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4Metadata: {
              lsp4MetadataUrls.push(DataChangedUtils.LSP4MetadataUrl.extract(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenName: {
              lsp4TokenNames.push(DataChangedUtils.LSP4TokenName.extract(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenSymbol: {
              lsp4TokenSymbols.push(DataChangedUtils.LSP4TokenSymbol.extract(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenType: {
              lsp4TokenTypes.push(DataChangedUtils.LSP4TokenType.extract(extractParams));
              break;
            }

            case LSP8DataKeys.LSP8ReferenceContract: {
              lsp8ReferenceContracts.push(
                DataChangedUtils.LSP8ReferenceContract.extract(extractParams),
              );
              break;
            }

            case LSP8DataKeys.LSP8TokenIdFormat: {
              lsp8TokenIdFormats.push(DataChangedUtils.LSP8TokenIdFormat.extract(extractParams));
              break;
            }

            case LSP8DataKeys.LSP8TokenMetadataBaseURI: {
              break;
            }
          }

          break;
        }

        case LSP0ERC725Account.events.UniversalReceiver.topic: {
          universalProfiles.add(log.address);
          universalReceiverEvents.push(UniversalReceiverUtils.extract(extractParams));
          break;
        }

        case LSP7DigitalAsset.events.Transfer.topic: {
          digitalAssets.add(log.address);
          transferEvents.push(TransferUtils.extract(extractParams));
          break;
        }

        case LSP8IdentifiableDigitalAsset.events.Transfer.topic: {
          digitalAssets.add(log.address);
          transferEvents.push(TransferUtils.extract(extractParams));

          const nft = TransferUtils.NFT.extract(extractParams);
          if (nft !== null) nfts.set(nft.id, nft);

          break;
        }

        case LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.topic: {
          digitalAssets.add(log.address);
          tokenIdDataChangedEvents.push(TokenIdDataChangedUtils.extract(extractParams));

          const nft = TokenIdDataChangedUtils.NFT.extract(extractParams);
          if (!nfts.has(nft.id)) nfts.set(nft.id, nft);

          const { dataKey } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);
          switch (dataKey) {
            case LSP4DataKeys.LSP4Metadata: {
              lsp4MetadataUrls.push(TokenIdDataChangedUtils.LSP4MetadataUrl.extract(extractParams));
              break;
            }
          }

          break;
        }
      }
    }
  }

  // TODO
  // Investigate: https://www.reddit.com/r/node/comments/11e5hyj/executing_1000_http_requests_at_once/
  // RunQueue: https://www.npmjs.com/package/run-queue
  // if (context.isHead) {
  //   context.store.findBy(UniversalProfile, { lsp3ProfileUrl: {} });
  // }

  const { verifiedUniversalProfiles, unverifiedUniversalProfiles } =
    await UniversalProfileUtils.verify({ context, addressSet: universalProfiles });
  await context.store.upsert([...verifiedUniversalProfiles.values()]);

  const { verifiedDigitalAssets, unverifiedDigitalAssets } = await DigitalAssetUtils.verify({
    context,
    addressSet: digitalAssets,
  });
  await context.store.upsert([...verifiedDigitalAssets.values()]);

  const verifiedNfts = await NFTUtils.verify({ context, nfts });
  await context.store.upsert(
    NFTUtils.populate({ entities: verifiedNfts, unverifiedDigitalAssets }),
  );

  // Save tracked events
  await context.store.insert(
    ExecutedUtils.populate({ entities: executedEvents, unverifiedUniversalProfiles }),
  );

  await context.store.insert(
    DataChangedUtils.populate({
      entities: dataChangedEvents,
      unverifiedUniversalProfiles,
      unverifiedDigitalAssets,
    }),
  );

  await context.store.insert(
    UniversalReceiverUtils.populate({
      entities: universalReceiverEvents,
      unverifiedUniversalProfiles,
    }),
  );

  await context.store.insert(
    TransferUtils.populate({ entities: transferEvents, unverifiedDigitalAssets }),
  );

  await context.store.insert(
    TokenIdDataChangedUtils.populate({
      entities: tokenIdDataChangedEvents,
      unverifiedDigitalAssets,
    }),
  );

  // Save starndardized DataKeys update
  await context.store.insert(
    DataChangedUtils.LSP3ProfileUrl.populate({
      entities: lsp3ProfileUrls,
      unverifiedUniversalProfiles,
    }),
  );

  await context.store.insert([
    ...DataChangedUtils.LSP4MetadataUrl.populate({
      entities: lsp4MetadataUrls.filter(({ nft }) => nft === null),
      unverifiedDigitalAssets,
    }),
    ...TokenIdDataChangedUtils.LSP4MetadataUrl.populate({
      entities: lsp4MetadataUrls.filter(({ nft }) => nft !== null),
      unverifiedDigitalAssets,
    }),
  ]);

  await context.store.insert(
    DataChangedUtils.LSP4TokenName.populate({
      entities: lsp4TokenNames,
      unverifiedDigitalAssets,
    }),
  );

  await context.store.insert(
    DataChangedUtils.LSP4TokenSymbol.populate({
      entities: lsp4TokenSymbols,
      unverifiedDigitalAssets,
    }),
  );

  await context.store.insert(
    DataChangedUtils.LSP4TokenType.populate({
      entities: lsp4TokenTypes,
      unverifiedDigitalAssets,
    }),
  );

  await context.store.insert(
    DataChangedUtils.LSP8ReferenceContract.populate({
      entities: lsp8ReferenceContracts,
      unverifiedDigitalAssets,
    }),
  );

  await context.store.insert(
    DataChangedUtils.LSP8TokenIdFormat.populate({
      entities: lsp8TokenIdFormats,
      unverifiedDigitalAssets,
    }),
  );
});
