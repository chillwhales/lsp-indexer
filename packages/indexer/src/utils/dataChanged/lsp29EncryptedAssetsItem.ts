import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP29EncryptedAssetsItem, UniversalProfile } from '@chillwhales/typeorm';
import { bytesToBigInt, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP29EncryptedAssetsItem {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  // The item index is stored in the last 16 bytes of the data key
  const dataKeyBytes = hexToBytes(dataKey as Hex);
  const itemIndex = dataKeyBytes.length >= 32 ? bytesToBigInt(dataKeyBytes.slice(16)) : 0n;

  return new LSP29EncryptedAssetsItem({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    itemIndex,
    rawValue: dataValue,
  });
}

export function populate({
  lsp29EncryptedAssetsItemEntities,
  validUniversalProfiles,
}: {
  lsp29EncryptedAssetsItemEntities: LSP29EncryptedAssetsItem[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp29EncryptedAssetsItemEntities.map(
    (entity) =>
      new LSP29EncryptedAssetsItem({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
