import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP5ReceivedAssetsLength, UniversalProfile } from '@chillwhales/typeorm';
import { hexToBigInt, hexToBytes, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP5ReceivedAssetsLength {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP5ReceivedAssetsLength({
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
  lsp5ReceivedAssetsLengthEntities,
  validUniversalProfiles,
}: {
  lsp5ReceivedAssetsLengthEntities: LSP5ReceivedAssetsLength[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp5ReceivedAssetsLengthEntities.map(
    (entity) =>
      new LSP5ReceivedAssetsLength({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
