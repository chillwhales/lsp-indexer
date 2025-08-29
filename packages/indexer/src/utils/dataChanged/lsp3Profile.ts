import { ExtractParams } from '@/types';
import { decodeVerifiableUri } from '@/utils';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { LSP3Profile, UniversalProfile } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): LSP3Profile {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);
  const { value, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP3Profile({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    url: value,
    rawValue: dataValue,
    decodeError,
    dataFetched: false,
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
