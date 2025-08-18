import { ExtractParams } from '@/types';
import * as Utils from '@/utils';
import {
  ERC725X,
  ERC725Y,
  LSP0ERC725Account,
  LSP26FollowerSystem,
  LSP7DigitalAsset,
  LSP8IdentifiableDigitalAsset,
} from '@chillwhales/sqd-abi';
import {
  DataChanged,
  Executed,
  Follow,
  LSP3ProfileUrl,
  LSP4MetadataUrl,
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
  UniversalReceiver,
} from '@chillwhales/sqd-typeorm';
import { LSP3DataKeys } from '@lukso/lsp3-contracts';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { FieldSelection } from './processor';

export function scanLogs(context: DataHandlerContext<Store, FieldSelection>) {
  context.log.info(
    JSON.stringify({
      message: 'Scanning block range',
      blockRange: {
        start: context.blocks[0].header.height,
        end: context.blocks[context.blocks.length - 1].header.height,
      },
    }),
  );

  const universalProfiles = new Set<string>();
  const digitalAssets = new Set<string>();
  const nfts = new Map<string, NFT>();

  const executedEvents: Executed[] = [];
  const dataChangedEvents: DataChanged[] = [];
  const universalReceiverEvents: UniversalReceiver[] = [];
  const transferEvents: Transfer[] = [];
  const tokenIdDataChangedEvents: TokenIdDataChanged[] = [];
  const followEvents: Follow[] = [];
  const unfollowEvents: Unfollow[] = [];

  const lsp3ProfileUrls: LSP3ProfileUrl[] = [];
  const lsp4TokenNames: LSP4TokenName[] = [];
  const lsp4TokenSymbols: LSP4TokenSymbol[] = [];
  const lsp4TokenTypes: LSP4TokenType[] = [];
  const lsp4MetadataUrls: LSP4MetadataUrl[] = [];
  const lsp8TokenIdFormats: LSP8TokenIdFormat[] = [];
  const lsp8ReferenceContracts: LSP8ReferenceContract[] = [];
  const lsp8TokenMetadataBaseUris: LSP8TokenMetadataBaseURI[] = [];

  for (const block of context.blocks) {
    const { logs } = block;

    for (const log of logs) {
      const extractParams: ExtractParams = { context, block, log };

      switch (log.topics[0]) {
        case ERC725X.events.Executed.topic: {
          universalProfiles.add(log.address);
          executedEvents.push(Utils.Executed.extract(extractParams));
          break;
        }

        case ERC725Y.events.DataChanged.topic: {
          universalProfiles.add(log.address);
          digitalAssets.add(log.address);
          dataChangedEvents.push(Utils.DataChanged.extract(extractParams));

          const { dataKey } = ERC725Y.events.DataChanged.decode(log);
          switch (dataKey) {
            case LSP3DataKeys.LSP3Profile: {
              lsp3ProfileUrls.push(Utils.DataChanged.LSP3ProfileUrl.extract(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4Metadata: {
              lsp4MetadataUrls.push(Utils.DataChanged.LSP4MetadataUrl.extract(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenName: {
              lsp4TokenNames.push(Utils.DataChanged.LSP4TokenName.extract(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenSymbol: {
              lsp4TokenSymbols.push(Utils.DataChanged.LSP4TokenSymbol.extract(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenType: {
              lsp4TokenTypes.push(Utils.DataChanged.LSP4TokenType.extract(extractParams));
              break;
            }

            case LSP8DataKeys.LSP8ReferenceContract: {
              lsp8ReferenceContracts.push(
                Utils.DataChanged.LSP8ReferenceContract.extract(extractParams),
              );
              break;
            }

            case LSP8DataKeys.LSP8TokenIdFormat: {
              lsp8TokenIdFormats.push(Utils.DataChanged.LSP8TokenIdFormat.extract(extractParams));
              break;
            }

            case LSP8DataKeys.LSP8TokenMetadataBaseURI: {
              lsp8TokenMetadataBaseUris.push(
                Utils.DataChanged.LSP8TokenMetadataBaseURI.extract(extractParams),
              );
              break;
            }
          }

          break;
        }

        case LSP0ERC725Account.events.UniversalReceiver.topic: {
          universalProfiles.add(log.address);
          universalReceiverEvents.push(Utils.UniversalReceiver.extract(extractParams));
          break;
        }

        case LSP7DigitalAsset.events.Transfer.topic: {
          const transferEvent = Utils.Transfer.extract(extractParams);
          transferEvents.push(transferEvent);

          digitalAssets.add(transferEvent.address);
          universalProfiles.add(transferEvent.from);
          universalProfiles.add(transferEvent.to);

          break;
        }

        case LSP8IdentifiableDigitalAsset.events.Transfer.topic: {
          const transferEvent = Utils.Transfer.extract(extractParams);
          transferEvents.push(transferEvent);

          const nft = Utils.Transfer.NFT.extract(extractParams);
          if (nft !== null) nfts.set(nft.id, nft);

          digitalAssets.add(transferEvent.address);
          universalProfiles.add(transferEvent.from);
          universalProfiles.add(transferEvent.to);

          break;
        }

        case LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.topic: {
          digitalAssets.add(log.address);
          tokenIdDataChangedEvents.push(Utils.TokenIdDataChanged.extract(extractParams));

          const nft = Utils.TokenIdDataChanged.NFT.extract(extractParams);
          if (!nfts.has(nft.id)) nfts.set(nft.id, nft);

          const { dataKey } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);
          switch (dataKey) {
            case LSP4DataKeys.LSP4Metadata: {
              lsp4MetadataUrls.push(
                Utils.TokenIdDataChanged.LSP4MetadataUrl.extract(extractParams),
              );
              break;
            }
          }

          break;
        }

        case LSP26FollowerSystem.events.Follow.topic: {
          const followEvent = Utils.Follow.extract(extractParams);
          followEvents.push(followEvent);

          universalProfiles.add(followEvent.followerAddress);
          universalProfiles.add(followEvent.followedAddress);
          break;
        }

        case LSP26FollowerSystem.events.Unfollow.topic: {
          const unfollowEvent = Utils.Unfollow.extract(extractParams);
          unfollowEvents.push(unfollowEvent);

          universalProfiles.add(unfollowEvent.followerAddress);
          universalProfiles.add(unfollowEvent.unfollowedAddress);
          break;
        }
      }
    }
  }

  context.log.info(
    JSON.stringify({
      message: 'Block range scan ended.',
      blockRange: {
        start: context.blocks[0].header.height,
        end: context.blocks[context.blocks.length - 1].header.height,
      },
      universalProfilesCount: universalProfiles.size,
      digitalAssetsCount: digitalAssets.size,
      nftsCount: nfts.size,
      events: {
        executedEventsCount: executedEvents.length,
        dataChangedEventsCount: dataChangedEvents.length,
        universalReceiverEventsCount: universalReceiverEvents.length,
        transferEventsCount: transferEvents.length,
        tokenIdDataChangedEventsCount: tokenIdDataChangedEvents.length,
      },
      dataKeys: {
        lsp3ProfileUrlsCount: lsp3ProfileUrls.length,
        lsp4TokenNamesCount: lsp4TokenNames.length,
        lsp4TokenSymbolsCount: lsp4TokenSymbols.length,
        lsp4TokenTypesCount: lsp4TokenTypes.length,
        lsp4MetadataUrlsCount: lsp4MetadataUrls.length,
        lsp8TokenIdFormatsCount: lsp8TokenIdFormats.length,
        lsp8ReferenceContractsCount: lsp8ReferenceContracts.length,
        lsp8TokenMetadataBaseUrisCount: lsp8TokenMetadataBaseUris.length,
      },
    }),
  );

  return {
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
      lsp3ProfileUrls,
      lsp4TokenNames,
      lsp4TokenSymbols,
      lsp4TokenTypes,
      lsp4MetadataUrls,
      lsp8TokenIdFormats,
      lsp8ReferenceContracts,
      lsp8TokenMetadataBaseUris,
    },
  };
}

export function scanTransactions(context: DataHandlerContext<Store, FieldSelection>) {
  for (const block of context.blocks) {
    const { transactions } = block;

    for (const transaction of transactions) {
      context.log.info(JSON.stringify({ transaction }));
    }
  }
}

export function scanTraces(context: DataHandlerContext<Store, FieldSelection>) {
  for (const block of context.blocks) {
    const { traces } = block;

    for (const trace of traces) {
      context.log.info(JSON.stringify({ trace }));
    }
  }
}
