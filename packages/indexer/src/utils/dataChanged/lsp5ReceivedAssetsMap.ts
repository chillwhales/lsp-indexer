import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP5ReceivedAssetsMap, UniversalProfile } from '@chillwhales/typeorm';
import { bytesToBigInt, bytesToHex, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP5ReceivedAssetsMap {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP5ReceivedAssetsMap({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    receivedAssetAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
    receivedAssetInterfaceId:
      hexToBytes(dataValue as Hex).length === 20
        ? bytesToHex(hexToBytes(dataValue as Hex).slice(0, 4))
        : null,
    receivedAssetIndex:
      hexToBytes(dataValue as Hex).length === 20
        ? bytesToBigInt(hexToBytes(dataValue as Hex).slice(4))
        : null,
    rawValue: dataValue,
  });
}

export function populate({
  lsp5ReceivedAssetsMapEntities,
  validUniversalProfiles,
}: {
  lsp5ReceivedAssetsMapEntities: LSP5ReceivedAssetsMap[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp5ReceivedAssetsMapEntities.map(
    (entity) =>
      new LSP5ReceivedAssetsMap({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
