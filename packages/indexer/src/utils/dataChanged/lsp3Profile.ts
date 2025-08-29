import { ExtractParams } from '@/types';
import { decodeVerifiableUri } from '@/utils';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { LSP3Profile, UniversalProfile } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): LSP3Profile {
  const timestamp = new Date(block.header.timestamp);
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);
  const { value: url, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP3Profile({
    id: uuidv4(),
    timestamp,
    address,
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
    isRetryable: false,
    retryCount: 0,
  });
}

export function populate({
  lsp3Profiles,
  validUniversalProfiles,
}: {
  lsp3Profiles: LSP3Profile[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp3Profiles.map(
    (entity) =>
      new LSP3Profile({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
