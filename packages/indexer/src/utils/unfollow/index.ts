import { ExtractParams } from '@/types';
import { LSP26FollowerSystem } from '@chillwhales/sqd-abi';
import { Unfollow, UniversalProfile } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): Unfollow {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { addr, follower } = LSP26FollowerSystem.events.Follow.decode(log);

  return new Unfollow({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    followerAddress: follower,
    unfollowedAddress: addr,
  });
}

interface PopulateParams {
  unfollowEvents: Unfollow[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}

export function populate({ unfollowEvents, validUniversalProfiles }: PopulateParams) {
  return unfollowEvents.map(
    (entity) =>
      new Unfollow({
        ...entity,
        followerUniversalProfile: validUniversalProfiles.has(entity.followerAddress)
          ? new UniversalProfile({ id: entity.followerAddress })
          : null,
        unfollowedUniversalProfile: validUniversalProfiles.has(entity.unfollowedAddress)
          ? new UniversalProfile({ id: entity.unfollowedAddress })
          : null,
      }),
  );
}
