import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP29EncryptedAssetsMap, UniversalProfile } from '@chillwhales/typeorm';
import { bytesToBigInt, bytesToHex, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP29EncryptedAssetsMap {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  const dataKeyBytes = hexToBytes(dataKey as Hex);
  // Content ID hash is the last 20 bytes of the data key (bytes 12-32)
  const contentIdHash = bytesToHex(dataKeyBytes.slice(12));

  // The value is a uint128 array index
  const dataValueBytes = hexToBytes(dataValue as Hex);
  const arrayIndex =
    dataValueBytes.length === 16 ? bytesToBigInt(dataValueBytes) : null;

  return new LSP29EncryptedAssetsMap({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    contentIdHash,
    arrayIndex,
    rawValue: dataValue,
  });
}

export function populate({
  lsp29EncryptedAssetsMapEntities,
  validUniversalProfiles,
}: {
  lsp29EncryptedAssetsMapEntities: LSP29EncryptedAssetsMap[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp29EncryptedAssetsMapEntities.map(
    (entity) =>
      new LSP29EncryptedAssetsMap({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
