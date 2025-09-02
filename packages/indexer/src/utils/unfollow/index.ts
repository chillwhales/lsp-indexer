import { ExtractParams } from '@/types';
import { LSP26FollowerSystem } from '@chillwhales/abi';
import { Unfollow, UniversalProfile } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): Unfollow {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { addr, unfollower } = LSP26FollowerSystem.events.Unfollow.decode(log);

  return new Unfollow({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    followerAddress: unfollower,
    unfollowedAddress: addr,
  });
}

interface PopulateParams {
  unfollowEntities: Unfollow[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}

export function populate({ unfollowEntities, validUniversalProfiles }: PopulateParams) {
  return unfollowEntities.map(
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
