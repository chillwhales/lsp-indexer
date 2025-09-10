import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP12IssuedAssetsItem, UniversalProfile } from '@chillwhales/typeorm';
import { bytesToBigInt, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP12IssuedAssetsItem {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP12IssuedAssetsItem({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    issuedAssetAddress: hexToBytes(dataValue as Hex).length === 20 ? dataValue : null,
    issuedAssetIndex: bytesToBigInt(hexToBytes(dataKey as Hex).slice(16)),
    rawValue: dataValue,
  });
}

export function populate({
  lsp12IssuedAssetsItemEntities,
  validUniversalProfiles,
}: {
  lsp12IssuedAssetsItemEntities: LSP12IssuedAssetsItem[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp12IssuedAssetsItemEntities.map(
    (entity) =>
      new LSP12IssuedAssetsItem({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
