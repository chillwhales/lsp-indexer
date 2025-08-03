import { ExtractParams } from '@/types';
import * as Utils from '@/utils';
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
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

export function scanLogs(context: DataHandlerContext<Store, {}>) {
  const universalProfiles = new Set<string>();
  const digitalAssets = new Set<string>();
  const nfts = new Map<string, NFT>();

  const executedEvents: Executed[] = [];
  const dataChangedEvents: DataChanged[] = [];
  const universalReceiverEvents: UniversalReceiver[] = [];
  const transferEvents: Transfer[] = [];
  const tokenIdDataChangedEvents: TokenIdDataChanged[] = [];

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
          digitalAssets.add(log.address);
          transferEvents.push(Utils.Transfer.extract(extractParams));
          break;
        }

        case LSP8IdentifiableDigitalAsset.events.Transfer.topic: {
          digitalAssets.add(log.address);
          transferEvents.push(Utils.Transfer.extract(extractParams));

          const nft = Utils.Transfer.NFT.extract(extractParams);
          if (nft !== null) nfts.set(nft.id, nft);

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
      }
    }
  }

  return {
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
  };
}

export function scanTransactions(context: DataHandlerContext<Store, {}>) {
  for (const block of context.blocks) {
    const { transactions } = block;

    for (const transaction of transactions) {
      console.log(transaction);
    }
  }
}
