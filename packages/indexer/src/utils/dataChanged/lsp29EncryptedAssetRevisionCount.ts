import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP29EncryptedAssetRevisionCount, UniversalProfile } from '@chillwhales/typeorm';
import { bytesToBigInt, bytesToHex, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): LSP29EncryptedAssetRevisionCount {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  const dataKeyBytes = hexToBytes(dataKey as Hex);
  // Content ID hash is the last 20 bytes of the data key (bytes 12-32)
  const contentIdHash = bytesToHex(dataKeyBytes.slice(12));

  // The value is a uint128 revision count
  const dataValueBytes = hexToBytes(dataValue as Hex);
  const revisionCount = dataValueBytes.length === 16 ? bytesToBigInt(dataValueBytes) : null;

  return new LSP29EncryptedAssetRevisionCount({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    contentIdHash,
    revisionCount,
    rawValue: dataValue,
  });
}

export function populate({
  lsp29EncryptedAssetRevisionCountEntities,
  validUniversalProfiles,
}: {
  lsp29EncryptedAssetRevisionCountEntities: LSP29EncryptedAssetRevisionCount[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp29EncryptedAssetRevisionCountEntities.map(
    (entity) =>
      new LSP29EncryptedAssetRevisionCount({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
