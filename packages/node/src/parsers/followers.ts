import type {
  Follower,
  FollowerInclude,
  FollowerResult,
  PartialFollower,
} from '@lsp-indexer/types';
import type { GetFollowersQuery } from '../graphql/graphql';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/** Omits `id` so sub-selections from other domains also satisfy this type. */
type RawFollower = Omit<GetFollowersQuery['follower'][number], 'id'>;

/** Parse a raw Hasura row into a clean `Follower`. */
export function parseFollower(raw: RawFollower): Follower;
export function parseFollower<const I extends FollowerInclude>(
  raw: RawFollower,
  include: I,
): FollowerResult<I>;
export function parseFollower(
  raw: RawFollower,
  include?: FollowerInclude,
): Follower | PartialFollower {
  const result: Follower = {
    followerAddress: raw.follower_address,
    followedAddress: raw.followed_address,
    timestamp: raw.timestamp ?? null,
    address: raw.address ?? null,
    blockNumber: raw.block_number ?? null,
    transactionIndex: raw.transaction_index ?? null,
    logIndex: raw.log_index ?? null,
    followerProfile: raw.followerUniversalProfile
      ? parseProfile(raw.followerUniversalProfile)
      : null,
    followedProfile: raw.followedUniversalProfile
      ? parseProfile(raw.followedUniversalProfile)
      : null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['followerAddress', 'followedAddress'], undefined, {
    followerProfile: { baseFields: ['address'] },
    followedProfile: { baseFields: ['address'] },
  });
}

/** Batch variant of parseFollower. */
export function parseFollowers(raw: RawFollower[]): Follower[];
export function parseFollowers<const I extends FollowerInclude>(
  raw: RawFollower[],
  include: I,
): FollowerResult<I>[];
export function parseFollowers(
  raw: RawFollower[],
  include?: FollowerInclude,
): (Follower | PartialFollower)[] {
  if (include) return raw.map((r) => parseFollower(r, include));
  return raw.map((r) => parseFollower(r));
}
