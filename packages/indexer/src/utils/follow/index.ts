import { ExtractParams } from '@/types';
import { LSP26FollowerSystem } from '@chillwhales/abi';
import { Follow, UniversalProfile } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log, context }: ExtractParams): Follow {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { addr, follower } = LSP26FollowerSystem.events.Follow.decode(log);

  return new Follow({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    followerAddress: follower,
    followedAddress: addr,
  });
}

interface PopulateParams {
  followEntities: Follow[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}

export function populate({ followEntities, validUniversalProfiles }: PopulateParams) {
  return followEntities.map(
    (entity) =>
      new Follow({
        ...entity,
        followerUniversalProfile: validUniversalProfiles.has(entity.followerAddress)
          ? new UniversalProfile({ id: entity.followerAddress })
          : null,
        followedUniversalProfile: validUniversalProfiles.has(entity.followedAddress)
          ? new UniversalProfile({ id: entity.followedAddress })
          : null,
      }),
  );
}
