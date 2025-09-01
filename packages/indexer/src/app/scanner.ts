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
  UniversalReceiver,
} from '@chillwhales/sqd-typeorm';
import { LSP3DataKeys } from '@lukso/lsp3-contracts';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { FieldSelection } from './processor';

export function scanLogs(context: DataHandlerContext<Store, FieldSelection>) {
  const universalProfiles = new Set<string>();
  const digitalAssets = new Set<string>();
  const nfts = new Map<string, NFT>();

  const executedEntities: Executed[] = [];
  const dataChangedEntities: DataChanged[] = [];
  const universalReceiverEntities: UniversalReceiver[] = [];
  const transferEntities: Transfer[] = [];
  const tokenIdDataChangedEntities: TokenIdDataChanged[] = [];
  const followEntities: Follow[] = [];
  const unfollowEntities: Unfollow[] = [];

  const lsp3ProfileEntities = new Map<string, LSP3Profile>();
  const lsp4TokenNameEntities = new Map<string, LSP4TokenName>();
  const lsp4TokenSymbolEntities = new Map<string, LSP4TokenSymbol>();
  const lsp4TokenTypeEntities = new Map<string, LSP4TokenType>();
  const lsp4MetadataEntities = new Map<string, LSP4Metadata>();
  const lsp8TokenIdFormatEntities = new Map<string, LSP8TokenIdFormat>();
  const lsp8ReferenceContractEntities = new Map<string, LSP8ReferenceContract>();
  const lsp8TokenMetadataBaseUriEntities = new Map<string, LSP8TokenMetadataBaseURI>();

  for (const block of context.blocks) {
    const { logs } = block;

    for (const log of logs) {
      const extractParams: ExtractParams = { context, block, log };

      switch (log.topics[0]) {
        case ERC725X.events.Executed.topic: {
          universalProfiles.add(log.address);
          executedEntities.push(Utils.Executed.extract(extractParams));
          break;
        }

        case ERC725Y.events.DataChanged.topic: {
          universalProfiles.add(log.address);
          digitalAssets.add(log.address);
          dataChangedEntities.push(Utils.DataChanged.extract(extractParams));

          const { dataKey } = ERC725Y.events.DataChanged.decode(log);
          switch (dataKey) {
            case LSP3DataKeys.LSP3Profile: {
              const lsp3Profile = Utils.DataChanged.LSP3Profile.extract(extractParams);
              lsp3ProfileEntities.set(lsp3Profile.id, lsp3Profile);
              break;
            }

            case LSP4DataKeys.LSP4Metadata: {
              const lsp4Metadata = Utils.DataChanged.LSP4Metadata.extract(extractParams);
              lsp4MetadataEntities.set(lsp4Metadata.id, lsp4Metadata);
              break;
            }

            case LSP4DataKeys.LSP4TokenName: {
              const lsp4TokenName = Utils.DataChanged.LSP4TokenName.extract(extractParams);
              lsp4TokenNameEntities.set(lsp4TokenName.id, lsp4TokenName);
              break;
            }

            case LSP4DataKeys.LSP4TokenSymbol: {
              const lsp4TokenSymbol = Utils.DataChanged.LSP4TokenSymbol.extract(extractParams);
              lsp4TokenSymbolEntities.set(lsp4TokenSymbol.id, lsp4TokenSymbol);
              break;
            }

            case LSP4DataKeys.LSP4TokenType: {
              const lsp4TokenType = Utils.DataChanged.LSP4TokenType.extract(extractParams);
              lsp4TokenTypeEntities.set(lsp4TokenType.id, lsp4TokenType);
              break;
            }

            case LSP8DataKeys.LSP8ReferenceContract: {
              const lsp8ReferenceContract =
                Utils.DataChanged.LSP8ReferenceContract.extract(extractParams);
              lsp8ReferenceContractEntities.set(lsp8ReferenceContract.id, lsp8ReferenceContract);
              break;
            }

            case LSP8DataKeys.LSP8TokenIdFormat: {
              const lsp8TokenIdFormat = Utils.DataChanged.LSP8TokenIdFormat.extract(extractParams);
              lsp8TokenIdFormatEntities.set(lsp8TokenIdFormat.id, lsp8TokenIdFormat);
              break;
            }

            case LSP8DataKeys.LSP8TokenMetadataBaseURI: {
              const lsp8TokenMetadataBaseUri =
                Utils.DataChanged.LSP8TokenMetadataBaseURI.extract(extractParams);
              lsp8TokenMetadataBaseUriEntities.set(
                lsp8TokenMetadataBaseUri.id,
                lsp8TokenMetadataBaseUri,
              );
              break;
            }
          }

          break;
        }

        case LSP0ERC725Account.events.UniversalReceiver.topic: {
          universalProfiles.add(log.address);
          universalReceiverEntities.push(Utils.UniversalReceiver.extract(extractParams));
          break;
        }

        case LSP7DigitalAsset.events.Transfer.topic: {
          const transferEvent = Utils.Transfer.extract(extractParams);
          transferEntities.push(transferEvent);

          digitalAssets.add(transferEvent.address);
          universalProfiles.add(transferEvent.from);
          universalProfiles.add(transferEvent.to);

          break;
        }

        case LSP8IdentifiableDigitalAsset.events.Transfer.topic: {
          const transferEvent = Utils.Transfer.extract(extractParams);
          transferEntities.push(transferEvent);

          const nft = Utils.Transfer.NFT.extract(extractParams);
          if (nft !== null) nfts.set(nft.id, nft);

          digitalAssets.add(transferEvent.address);
          universalProfiles.add(transferEvent.from);
          universalProfiles.add(transferEvent.to);

          break;
        }

        case LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.topic: {
          digitalAssets.add(log.address);
          tokenIdDataChangedEntities.push(Utils.TokenIdDataChanged.extract(extractParams));

          const nft = Utils.TokenIdDataChanged.NFT.extract(extractParams);
          if (!nfts.has(nft.id)) nfts.set(nft.id, nft);

          const { dataKey } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);
          switch (dataKey) {
            case LSP4DataKeys.LSP4Metadata: {
              const lsp4Metadata = Utils.TokenIdDataChanged.LSP4Metadata.extract(extractParams);
              lsp4MetadataEntities.set(lsp4Metadata.id, lsp4Metadata);
              break;
            }
          }

          break;
        }

        case LSP26FollowerSystem.events.Follow.topic: {
          const followEvent = Utils.Follow.extract(extractParams);
          followEntities.push(followEvent);

          universalProfiles.add(followEvent.followerAddress);
          universalProfiles.add(followEvent.followedAddress);
          break;
        }

        case LSP26FollowerSystem.events.Unfollow.topic: {
          const unfollowEvent = Utils.Unfollow.extract(extractParams);
          unfollowEntities.push(unfollowEvent);

          universalProfiles.add(unfollowEvent.followerAddress);
          universalProfiles.add(unfollowEvent.unfollowedAddress);
          break;
        }
      }
    }
  }

  return {
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
