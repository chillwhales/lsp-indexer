import type { FollowCount, Follower } from '@lsp-indexer/types';
import type { GetFollowCountQuery, GetFollowersQuery } from '../graphql/graphql';

/**
 * Raw Hasura follower row from the codegen-generated query result.
 */
type RawFollower = GetFollowersQuery['follower'][number];

/**
 * Transform a raw Hasura follower row into a clean `Follower` type.
 *
 * Maps snake_case Hasura fields to camelCase:
 * - `follower_address` → `followerAddress`
 * - `followed_address` → `followedAddress`
 */
export function parseFollower(raw: RawFollower): Follower {
  return {
    followerAddress: raw.follower_address,
    followedAddress: raw.followed_address,
  };
}

/**
 * Transform an array of raw Hasura follower rows into clean `Follower[]`.
 */
export function parseFollowers(raw: RawFollower[]): Follower[] {
  return raw.map(parseFollower);
}

/**
 * Transform a raw Hasura follow count response into a clean `FollowCount` type.
 *
 * The query uses GraphQL aliases (`followerCount`, `followingCount`) that each
 * resolve to `follower_aggregate`. Extracts the count from each alias.
 */
export function parseFollowCount(raw: GetFollowCountQuery): FollowCount {
  return {
    followerCount: raw.followerCount?.aggregate?.count ?? 0,
    followingCount: raw.followingCount?.aggregate?.count ?? 0,
  };
}
