import { ExtractParams } from '@/types';
import { decodeOperationType } from '@/utils';
import { ERC725X } from '@chillwhales/sqd-abi';
import { Executed, UniversalProfile } from '@chillwhales/sqd-typeorm';

export function extract({ block, log }: ExtractParams): Executed {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;
  const { operationType, value, target, selector } = ERC725X.events.Executed.decode(log);

  return new Executed({
    id: log.id,
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    address,
    decodedOperationType: decodeOperationType(operationType),
    operationType,
    value,
    target,
    selector,
  });
}

export function populate({
  entities,
  unverifiedUniversalProfiles,
}: {
  entities: Executed[];
  unverifiedUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return entities.map(
    (entity) =>
      new Executed({
        ...entity,
        universalProfile: !unverifiedUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
