import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP29EncryptedAssetsLength, UniversalProfile } from '@chillwhales/typeorm';
import { hexToBigInt, hexToBytes, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP29EncryptedAssetsLength {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP29EncryptedAssetsLength({
    id: address,
    timestamp: new Date(timestamp),
    address,
    value: isHex(dataValue)
      ? hexToBytes(dataValue).length === 16
        ? hexToBigInt(dataValue)
        : null
      : null,
    rawValue: dataValue,
  });
}

export function populate({
  lsp29EncryptedAssetsLengthEntities,
  validUniversalProfiles,
}: {
  lsp29EncryptedAssetsLengthEntities: LSP29EncryptedAssetsLength[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp29EncryptedAssetsLengthEntities.map(
    (entity) =>
      new LSP29EncryptedAssetsLength({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
