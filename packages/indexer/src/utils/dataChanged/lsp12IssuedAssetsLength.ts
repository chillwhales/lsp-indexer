import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP12IssuedAssetsLength, UniversalProfile } from '@chillwhales/typeorm';
import { hexToBigInt, hexToBytes, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP12IssuedAssetsLength {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP12IssuedAssetsLength({
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
  lsp12IssuedAssetsLengthEntities,
  validUniversalProfiles,
}: {
  lsp12IssuedAssetsLengthEntities: LSP12IssuedAssetsLength[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp12IssuedAssetsLengthEntities.map(
    (entity) =>
      new LSP12IssuedAssetsLength({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
