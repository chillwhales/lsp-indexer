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
import type { ExtractParams } from './extractors';
import {
  extractDataChanged,
  extractExecuted,
  extractLsp3ProfileUrl,
  extractLsp4MetadataUrl,
  extractLsp4TokenName,
  extractLsp4TokenSymbol,
  extractLsp4TokenType,
  extractLsp7Transfer,
  extractLsp8ReferenceContract,
  extractLsp8TokenIdFormat,
  extractLsp8Transfer,
  extractTokenIdDataChanged,
  extractTokenIdDataChangedNft,
  extractTransferNft,
  extractUniversalReceiver,
} from './extractors';
import { extractDigitalAssets } from './extractors/digitalAsset';
import { extractNfts } from './extractors/nft';
import { extractUniversalProfiles } from './extractors/universalProfile';
import { processor } from './processor';

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
          executedEvents.push(extractExecuted(extractParams));
          break;
        }

        case ERC725Y.events.DataChanged.topic: {
          universalProfiles.add(log.address);
          digitalAssets.add(log.address);
          const { dataKey } = ERC725Y.events.DataChanged.decode(log);

          dataChangedEvents.push(extractDataChanged(extractParams));

          switch (dataKey) {
            case LSP3DataKeys.LSP3Profile: {
              lsp3ProfileUrls.push(extractLsp3ProfileUrl(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenName: {
              lsp4TokenNames.push(extractLsp4TokenName(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenSymbol: {
              lsp4TokenSymbols.push(extractLsp4TokenSymbol(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4TokenType: {
              lsp4TokenTypes.push(extractLsp4TokenType(extractParams));
              break;
            }

            case LSP4DataKeys.LSP4Metadata: {
              lsp4MetadataUrls.push(extractLsp4MetadataUrl(extractParams));
              break;
            }

            case LSP8DataKeys.LSP8ReferenceContract: {
              lsp8ReferenceContracts.push(extractLsp8ReferenceContract(extractParams));
              break;
            }

            case LSP8DataKeys.LSP8TokenIdFormat: {
              lsp8TokenIdFormats.push(extractLsp8TokenIdFormat(extractParams));
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
          universalReceiverEvents.push(extractUniversalReceiver(extractParams));
          break;
        }

        case LSP7DigitalAsset.events.Transfer.topic: {
          digitalAssets.add(log.address);
          transferEvents.push(extractLsp7Transfer(extractParams));
          break;
        }

        case LSP8IdentifiableDigitalAsset.events.Transfer.topic: {
          digitalAssets.add(log.address);
          transferEvents.push(extractLsp8Transfer(extractParams));

          const nft = extractTransferNft(extractParams);
          if (nft !== null) nfts.set(nft.id, nft);

          break;
        }

        case LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.topic: {
          digitalAssets.add(log.address);
          tokenIdDataChangedEvents.push(extractTokenIdDataChanged(extractParams));

          const nft = extractTokenIdDataChangedNft(extractParams);
          if (!nfts.has(nft.id)) nfts.set(nft.id, nft);

          break;
        }
      }
    }
  }

  await context.store.upsert(
    await extractUniversalProfiles({ context, addressSet: universalProfiles }),
  );
  await context.store.upsert(await extractDigitalAssets({ context, addressSet: digitalAssets }));
  await context.store.upsert(await extractNfts({ context, nfts }));

  // Save tracked events
  await context.store.insert(executedEvents);
  await context.store.insert(dataChangedEvents);
  await context.store.insert(universalReceiverEvents);
  await context.store.insert(transferEvents);
  await context.store.insert(tokenIdDataChangedEvents);

  // Save starndardized DataKeys updates
  await context.store.insert(lsp3ProfileUrls);
  await context.store.insert(lsp4TokenNames);
  await context.store.insert(lsp4TokenSymbols);
  await context.store.insert(lsp4TokenTypes);
  await context.store.insert(lsp4MetadataUrls);
  await context.store.insert(lsp8TokenIdFormats);
});
