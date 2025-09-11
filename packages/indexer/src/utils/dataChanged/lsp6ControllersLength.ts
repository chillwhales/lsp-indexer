import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP6ControllersLength, UniversalProfile } from '@chillwhales/typeorm';
import { hexToBigInt, hexToBytes, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP6ControllersLength {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP6ControllersLength({
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
  lsp6ControllersLengthEntities,
  validUniversalProfiles,
}: {
  lsp6ControllersLengthEntities: LSP6ControllersLength[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp6ControllersLengthEntities.map(
    (entity) =>
      new LSP6ControllersLength({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
