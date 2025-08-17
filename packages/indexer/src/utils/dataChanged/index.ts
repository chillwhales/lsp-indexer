import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { DataChanged, DigitalAsset, UniversalProfile } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): DataChanged {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new DataChanged({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    dataKey,
    dataValue,
  });
}

export function populate({
  dataChangedEvents,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  dataChangedEvents: DataChanged[];
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return dataChangedEvents.map(
    (entity) =>
      new DataChanged({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
        digitalAsset: validDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
      }),
  );
}

export * as LSP3Profile from './lsp3Profile';
export * as LSP3ProfileUrl from './lsp3ProfileUrl';
export * as LSP4Metadata from './lsp4Metadata';
export * as LSP4MetadataUrl from './lsp4MetadataUrl';
export * as LSP4TokenName from './lsp4TokenName';
export * as LSP4TokenSymbol from './lsp4TokenSymbol';
export * as LSP4TokenType from './lsp4TokenType';
export * as LSP8ReferenceContract from './lsp8ReferenceContract';
export * as LSP8TokenIdFormat from './lsp8TokenIdFormat';
export * as LSP8TokenMetadataBaseURI from './lsp8TokenMetadataBaseUri';
