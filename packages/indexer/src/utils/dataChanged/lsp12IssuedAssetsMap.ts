import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP12IssuedAssetsMap, UniversalProfile } from '@chillwhales/typeorm';
import { bytesToBigInt, bytesToHex, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP12IssuedAssetsMap {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP12IssuedAssetsMap({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    issuedAssetAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
    issuedAssetInterfaceId:
      hexToBytes(dataValue as Hex).length === 20
        ? bytesToHex(hexToBytes(dataValue as Hex).slice(0, 4))
        : null,
    issuedAssetIndex:
      hexToBytes(dataValue as Hex).length === 20
        ? bytesToBigInt(hexToBytes(dataValue as Hex).slice(4))
        : null,
    rawValue: dataValue,
  });
}

export function populate({
  lsp12IssuedAssetsMapEntities,
  validUniversalProfiles,
}: {
  lsp12IssuedAssetsMapEntities: LSP12IssuedAssetsMap[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp12IssuedAssetsMapEntities.map(
    (entity) =>
      new LSP12IssuedAssetsMap({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
