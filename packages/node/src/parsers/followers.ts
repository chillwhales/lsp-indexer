import type {
  Follower,
  FollowerInclude,
  FollowerResult,
  PartialFollower,
} from '@lsp-indexer/types';
import type { GetFollowersQuery } from '../graphql/graphql';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/**
 * Raw Hasura follower type from the codegen-generated query result.
 *
 * Uses `Omit<..., 'id'>` because the parser never reads `id` — it only needs
 * `follower_address`, `followed_address`, and relation fields. This allows the
 * same parser to accept both primary query results (which include `id`) and
 * sub-selections from other domains which may not select `id`.
 * TypeScript structural subtyping means types WITH `id` still satisfy this.
 */
type RawFollower = Omit<GetFollowersQuery['follower'][number], 'id'>;

/**
 * Transform a raw Hasura follower response into a clean `Follower` type.
 *
 * Handles all edge cases:
 * - `follower_address` → `followerAddress` (snake_case → camelCase)
 * - `followed_address` → `followedAddress`
 * - `timestamp`, `address` mapped directly
 * - `followerUniversalProfile` parsed via `parseProfile` with sub-include
 * - `followedUniversalProfile` parsed via `parseProfile` with sub-include
 * - `@include(if: false)` omitted fields won't be present — uses optional chaining
 *
 * **Conditional include narrowing:**
 * When `include` is provided, `stripExcluded` removes fields not in the include map.
 * Profile sub-includes are passed through to `parseProfile` for recursive nested stripping.
 *
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `Follower` (all fields guaranteed)
 * - With `include` → returns `FollowerResult<I>` (only base fields guaranteed, rest conditional)
 *
 * @param raw - A single follower from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `Follower` (full or partial depending on include)
 */
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

/**
 * Transform an array of raw Hasura follower responses into clean `Follower[]`.
 *
 * Convenience wrapper around `parseFollower` for batch results.
 *
 * @param raw - Array of follower from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseFollower` call
 * @returns Array of clean, camelCase `Follower` objects (full or partial depending on include)
 */
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
