import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP5ReceivedAssetsItem, UniversalProfile } from '@chillwhales/typeorm';
import { bytesToBigInt, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP5ReceivedAssetsItem {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP5ReceivedAssetsItem({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    receivedAssetAddress: hexToBytes(dataValue as Hex).length === 20 ? dataValue : null,
    receivedAssetIndex: bytesToBigInt(hexToBytes(dataKey as Hex).slice(16)),
    rawValue: dataValue,
  });
}

export function populate({
  lsp5ReceivedAssetsItemEntities,
  validUniversalProfiles,
}: {
  lsp5ReceivedAssetsItemEntities: LSP5ReceivedAssetsItem[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp5ReceivedAssetsItemEntities.map(
    (entity) =>
      new LSP5ReceivedAssetsItem({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
