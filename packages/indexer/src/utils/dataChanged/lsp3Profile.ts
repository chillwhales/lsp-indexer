import { ExtractParams } from '@/types';
import { decodeVerifiableUri } from '@/utils';
import { ERC725Y } from '@chillwhales/abi';
import { LSP3Profile, UniversalProfile } from '@chillwhales/typeorm';

export function extract({ block, log }: ExtractParams): LSP3Profile {
  const timestamp = new Date(block.header.timestamp);
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);
  const { value: url, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP3Profile({
    id: address,
    address,
    timestamp,
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
    retryCount: 0,
  });
}

export function populate({
  lsp3ProfileEntities,
  validUniversalProfiles,
}: {
  lsp3ProfileEntities: LSP3Profile[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp3ProfileEntities.map(
    (entity) =>
      new LSP3Profile({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
