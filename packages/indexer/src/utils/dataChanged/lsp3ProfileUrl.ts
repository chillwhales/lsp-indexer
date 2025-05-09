import { ExtractParams } from '@/types';
import { decodeVerifiableUri } from '@/utils';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { LSP3ProfileUrl, UniversalProfile } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): LSP3ProfileUrl {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);
  const { value, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP3ProfileUrl({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    rawBytes: dataValue,
    value,
    decodeError,
  });
}

export function populate({
  lsp3ProfileUrls,
  validUniversalProfiles,
}: {
  lsp3ProfileUrls: LSP3ProfileUrl[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp3ProfileUrls.map(
    (entity) =>
      new LSP3ProfileUrl({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
