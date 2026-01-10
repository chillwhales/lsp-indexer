import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { DataChanged, DigitalAsset, UniversalProfile } from '@chillwhales/typeorm';
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
  dataChangedEntities,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  dataChangedEntities: DataChanged[];
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return dataChangedEntities.map(
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

export * as LSP12IssuedAssetsItem from './lsp12IssuedAssetsItem';
export * as LSP12IssuedAssetsLength from './lsp12IssuedAssetsLength';
export * as LSP12IssuedAssetsMap from './lsp12IssuedAssetsMap';
export * as LSP3Profile from './lsp3Profile';
export * as LSP4CreatorsItem from './lsp4CreatorsItem';
export * as LSP4CreatorsLength from './lsp4CreatorsLength';
export * as LSP4CreatorsMap from './lsp4CreatorsMap';
export * as LSP4Metadata from './lsp4Metadata';
export * as LSP4TokenName from './lsp4TokenName';
export * as LSP4TokenSymbol from './lsp4TokenSymbol';
export * as LSP4TokenType from './lsp4TokenType';
export * as LSP5ReceivedAssetsItem from './lsp5ReceivedAssetsItem';
export * as LSP5ReceivedAssetsLength from './lsp5ReceivedAssetsLength';
export * as LSP5ReceivedAssetsMap from './lsp5ReceivedAssetsMap';
export * as LSP6ControllerAllowedCalls from './lsp6ControllerAllowedCalls';
export * as LSP6ControllerAllowedERC725YDataKeys from './lsp6ControllerAllowedErc725DataKey';
export * as LSP6ControllerPermissions from './lsp6ControllerPermissions';
export * as LSP6ControllersItem from './lsp6ControllersItem';
export * as LSP6ControllersLength from './lsp6ControllersLength';
export * as LSP8ReferenceContract from './lsp8ReferenceContract';
export * as LSP8TokenIdFormat from './lsp8TokenIdFormat';
export * as LSP8TokenMetadataBaseURI from './lsp8TokenMetadataBaseUri';
export * as LSP29EncryptedAsset from './lsp29EncryptedAsset';
export * as LSP29EncryptedAssetsLength from './lsp29EncryptedAssetsLength';
export * as LSP29EncryptedAssetsItem from './lsp29EncryptedAssetsItem';
export * as LSP29EncryptedAssetsMap from './lsp29EncryptedAssetsMap';
export * as LSP29EncryptedAssetRevisionCount from './lsp29EncryptedAssetRevisionCount';
