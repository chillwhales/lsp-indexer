import {
  ERC725X,
  ERC725Y,
  LSP0ERC725Account,
  LSP7DigitalAsset,
  LSP8IdentifiableDigitalAsset,
} from '@chillwhales/sqd-abi';
import {
  DataChanged,
  DigitalAsset,
  Executed,
  LSP3ProfileUrl,
  LSP4MetadataUrl,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP4TokenTypeEnum,
  LSP8ReferenceContract,
  LSP8TokenIdFormat,
  LSP8TokenIdFormatEnum,
  OperationType,
  TokenIdDataChanged,
  Transfer,
  UniversalProfile,
  UniversalReceiver,
} from '@chillwhales/sqd-typeorm';
import ERC725 from '@erc725/erc725.js';
import { LSP3DataKeys } from '@lukso/lsp3-contracts';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { EvmBatchProcessor } from '@subsquid/evm-processor';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { v4 as uuidv4 } from 'uuid';
import { hexToNumber, hexToString, isHex } from 'viem';
import { finalityConfirmation, gateway, rpcEndpoint } from './constants';

const Events = {
  Executed: ERC725X.events.Executed,
  DataChanged: ERC725Y.events.DataChanged,
  UniversalReceiver: LSP0ERC725Account.events.UniversalReceiver,
  LSP7Transfer: LSP7DigitalAsset.events.Transfer,
  LSP8Transfer: LSP8IdentifiableDigitalAsset.events.Transfer,
  TokenIdDataChanged: LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged,
};

const processor = new EvmBatchProcessor()
  .setGateway(gateway)
  .setRpcEndpoint(rpcEndpoint)
  .setFinalityConfirmation(finalityConfirmation)
  // .addTrace({
  //   type: ['create']
  // })
  .addLog({
    topic0: [
      Events.Executed.topic,
      Events.DataChanged.topic,
      Events.UniversalReceiver.topic,
      Events.TokenIdDataChanged.topic,
      Events.LSP7Transfer.topic,
      Events.LSP8Transfer.topic,
    ],
  });

processor.run(new TypeormDatabase(), async ({ store, blocks }) => {
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

  for (const block of blocks) {
    for (const log of block.logs) {
      const { timestamp } = block.header;
      const { address } = log;

      switch (log.topics[0]) {
        case Events.Executed.topic: {
          const { operationType, value, target, selector } = Events.Executed.decode(log);

          const parsedOperationType =
            operationType === 0n
              ? OperationType.CALL
              : operationType === 1n
                ? OperationType.CREATE
                : operationType === 2n
                  ? OperationType.CREATE2
                  : operationType === 3n
                    ? OperationType.DELEGATECALL
                    : operationType === 4n
                      ? OperationType.STATICCALL
                      : null;

          if (parsedOperationType !== null)
            executedEvents.push(
              new Executed({
                id: log.id,
                timestamp: new Date(timestamp),
                universalProfile: new UniversalProfile({ address }),
                operationType: parsedOperationType,
                value,
                target,
                selector,
              }),
            );

          break;
        }

        case Events.DataChanged.topic: {
          const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

          if (!isHex(dataValue)) continue;

          switch (dataKey) {
            case LSP3DataKeys.LSP3Profile: {
              const erc725 = new ERC725([]);

              if (dataValue === '0x' || hexToNumber(dataValue) === 0) {
                lsp3ProfileUrls.push(
                  new LSP3ProfileUrl({
                    id: uuidv4(),
                    timestamp: new Date(timestamp),
                    universalProfile: new UniversalProfile({ address }),
                    value: null,
                    rawBytes: dataValue,
                  }),
                );
              } else {
                try {
                  const decodedMetadataUrl = erc725.decodeValueContent('VerifiableURI', dataValue);

                  const url =
                    decodedMetadataUrl === null
                      ? null
                      : typeof decodedMetadataUrl === 'object'
                        ? decodedMetadataUrl.url
                        : null;

                  if (url.match(/[^\x20-\x7E]+/g) !== null)
                    lsp3ProfileUrls.push(
                      new LSP3ProfileUrl({
                        id: uuidv4(),
                        timestamp: new Date(timestamp),
                        universalProfile: new UniversalProfile({ address }),
                        value: null,
                        rawBytes: dataValue,
                        decodeError: 'Url contains invalid characters',
                      }),
                    );
                  else
                    lsp3ProfileUrls.push(
                      new LSP3ProfileUrl({
                        id: uuidv4(),
                        timestamp: new Date(timestamp),
                        universalProfile: new UniversalProfile({ address }),
                        value: url,
                        rawBytes: dataValue,
                      }),
                    );
                } catch (error) {
                  lsp3ProfileUrls.push(
                    new LSP3ProfileUrl({
                      id: uuidv4(),
                      timestamp: new Date(timestamp),
                      universalProfile: new UniversalProfile({ address }),
                      value: null,
                      rawBytes: dataValue,
                      decodeError: error.toString(),
                    }),
                  );
                }
              }

              break;
            }

            case LSP4DataKeys.LSP4TokenName: {
              lsp4TokenNames.push(
                new LSP4TokenName({
                  id: uuidv4(),
                  timestamp: new Date(timestamp),
                  digitalAsset: new DigitalAsset({ address }),
                  value: hexToString(dataValue),
                }),
              );

              break;
            }

            case LSP4DataKeys.LSP4TokenSymbol: {
              lsp4TokenSymbols.push(
                new LSP4TokenSymbol({
                  id: uuidv4(),
                  timestamp: new Date(timestamp),
                  digitalAsset: new DigitalAsset({ address }),
                  value: hexToString(dataValue),
                }),
              );

              break;
            }

            case LSP4DataKeys.LSP4TokenType: {
              const tokenTypeDecimal = hexToNumber(dataValue);

              lsp4TokenTypes.push(
                new LSP4TokenType({
                  id: uuidv4(),
                  timestamp: new Date(timestamp),
                  digitalAsset: new DigitalAsset({ address }),
                  value:
                    tokenTypeDecimal === 0
                      ? LSP4TokenTypeEnum.TOKEN
                      : tokenTypeDecimal === 1
                        ? LSP4TokenTypeEnum.NFT
                        : tokenTypeDecimal === 2
                          ? LSP4TokenTypeEnum.COLLECTION
                          : null,
                }),
              );

              break;
            }

            case LSP4DataKeys.LSP4Metadata: {
              const erc725 = new ERC725([]);

              if (dataValue === '0x' || hexToNumber(dataValue) === 0) {
                lsp4MetadataUrls.push(
                  new LSP4MetadataUrl({
                    id: uuidv4(),
                    timestamp: new Date(timestamp),
                    digitalAsset: new DigitalAsset({ address }),
                    value: null,
                    rawBytes: dataValue,
                  }),
                );
              } else {
                try {
                  const decodedMetadataUrl = erc725.decodeValueContent('VerifiableURI', dataValue);

                  const url =
                    decodedMetadataUrl === null
                      ? null
                      : typeof decodedMetadataUrl === 'object'
                        ? decodedMetadataUrl.url
                        : null;

                  if (url.match(/[^\x20-\x7E]+/g) !== null)
                    lsp4MetadataUrls.push(
                      new LSP4MetadataUrl({
                        id: uuidv4(),
                        timestamp: new Date(timestamp),
                        digitalAsset: new DigitalAsset({ address }),
                        value: null,
                        rawBytes: dataValue,
                        decodeError: 'Url contains invalid characters',
                      }),
                    );
                  else
                    lsp4MetadataUrls.push(
                      new LSP4MetadataUrl({
                        id: uuidv4(),
                        timestamp: new Date(timestamp),
                        digitalAsset: new DigitalAsset({ address }),
                        value: url,
                        rawBytes: dataValue,
                      }),
                    );
                } catch (error) {
                  lsp4MetadataUrls.push(
                    new LSP4MetadataUrl({
                      id: uuidv4(),
                      timestamp: new Date(timestamp),
                      digitalAsset: new DigitalAsset({ address }),
                      value: null,
                      rawBytes: dataValue,
                      decodeError: error.toString(),
                    }),
                  );
                }
              }

              break;
            }

            case LSP8DataKeys.LSP8ReferenceContract: {
              lsp8ReferenceContracts.push(
                new LSP8ReferenceContract({
                  id: uuidv4(),
                  timestamp: new Date(timestamp),
                  digitalAsset: new DigitalAsset({ address }),
                  value: dataValue,
                }),
              );

              break;
            }

            case LSP8DataKeys.LSP8TokenIdFormat: {
              const tokenIdFormatDecimal = hexToNumber(dataValue);

              lsp8TokenIdFormats.push(
                new LSP8TokenIdFormat({
                  id: uuidv4(),
                  timestamp: new Date(timestamp),
                  digitalAsset: new DigitalAsset({ address }),
                  value: [0, 100].includes(tokenIdFormatDecimal)
                    ? LSP8TokenIdFormatEnum.NUMBER
                    : [1, 101].includes(tokenIdFormatDecimal)
                      ? LSP8TokenIdFormatEnum.STRING
                      : [2, 102].includes(tokenIdFormatDecimal)
                        ? LSP8TokenIdFormatEnum.ADDRESS
                        : [3, 4, 103, 104].includes(tokenIdFormatDecimal)
                          ? LSP8TokenIdFormatEnum.BYTES32
                          : null,
                }),
              );

              break;
            }
            case LSP8DataKeys.LSP8TokenMetadataBaseURI: {
              break;
            }
          }

          break;
        }

        case Events.UniversalReceiver.topic: {
          const { from, value, typeId, receivedData, returnedValue } =
            Events.UniversalReceiver.decode(log);

          universalReceiverEvents.push(
            new UniversalReceiver({
              id: log.id,
              timestamp: new Date(timestamp),
              universalProfile: new UniversalProfile({ address }),
              from,
              value,
              typeId,
              receivedData,
              returnedValue,
            }),
          );

          break;
        }

        case Events.LSP7Transfer.topic: {
          const { from, to, amount } = Events.LSP7Transfer.decode(log);

          transferEvents.push(
            new Transfer({
              id: log.id,
              timestamp: new Date(timestamp),
              digitalAsset: new DigitalAsset({ address }),
              from,
              to,
              amount,
            }),
          );

          break;
        }

        case Events.LSP8Transfer.topic: {
          const { from, to, tokenId } = Events.LSP8Transfer.decode(log);

          transferEvents.push(
            new Transfer({
              id: log.id,
              timestamp: new Date(timestamp),
              digitalAsset: new DigitalAsset({ address }),
              from,
              to,
              amount: 1n,
              tokenId,
            }),
          );

          break;
        }

        case Events.TokenIdDataChanged.topic: {
          const { tokenId, dataKey, dataValue } = Events.TokenIdDataChanged.decode(log);

          tokenIdDataChangedEvents.push(
            new TokenIdDataChanged({
              id: log.id,
              timestamp: new Date(timestamp),
              digitalAsset: new DigitalAsset({ address }),
              tokenId,
              dataKey,
              dataValue,
            }),
          );

          break;
        }
      }
    }
  }

  await store.insert(executedEvents);
  await store.insert(dataChangedEvents);
  await store.insert(universalReceiverEvents);
  await store.insert(transferEvents);
  await store.insert(tokenIdDataChangedEvents);

  await store.insert(lsp3ProfileUrls);
  await store.insert(lsp4TokenNames);
  await store.insert(lsp4TokenSymbols);
  await store.insert(lsp4TokenTypes);
  await store.insert(lsp4MetadataUrls);
  await store.insert(lsp8TokenIdFormats);
});
