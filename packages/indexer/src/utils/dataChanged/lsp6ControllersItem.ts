import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP6ControllersItem, UniversalProfile } from '@chillwhales/typeorm';
import { bytesToBigInt, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP6ControllersItem {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP6ControllersItem({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    controllerAddress: hexToBytes(dataValue as Hex).length === 20 ? dataValue : null,
    controllerIndex: bytesToBigInt(hexToBytes(dataKey as Hex).slice(16)),
    rawValue: dataValue,
  });
}

export function populate({
  lsp6ControllersItemEntities,
  validUniversalProfiles,
}: {
  lsp6ControllersItemEntities: LSP6ControllersItem[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp6ControllersItemEntities.map(
    (entity) =>
      new LSP6ControllersItem({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
