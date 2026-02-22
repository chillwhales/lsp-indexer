import type {
  Follower,
  FollowerInclude,
  FollowerResult,
  PartialFollower,
} from '@lsp-indexer/types';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseFollower(raw: any): Follower;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseFollower<const I extends FollowerInclude>(
  raw: any,
  include: I,
): FollowerResult<I>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseFollower(raw: any, include?: FollowerInclude): Follower | PartialFollower {
  // Parse nested profiles with sub-include for recursive nested stripping.
  // When sub-include is provided, parseProfile returns a narrowed PartialProfile.
  // When undefined (or no include at all), parseProfile returns full Profile.
  const followerProfile = raw.followerUniversalProfile
    ? include?.followerProfile
      ? parseProfile(raw.followerUniversalProfile, include.followerProfile)
      : parseProfile(raw.followerUniversalProfile)
    : null;

  const followedProfile = raw.followedUniversalProfile
    ? include?.followedProfile
      ? parseProfile(raw.followedUniversalProfile, include.followedProfile)
      : parseProfile(raw.followedUniversalProfile)
    : null;

  const result = {
    followerAddress: raw.follower_address,
    followedAddress: raw.followed_address,
    timestamp: raw.timestamp,
    address: raw.address,
    followerProfile,
    followedProfile,
  } as Follower;

  if (include) {
    return stripExcluded(result, include, ['followerAddress', 'followedAddress']) as FollowerResult<
      typeof include
    >;
  }
  return result;
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseFollowers(raw: any[]): Follower[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseFollowers<const I extends FollowerInclude>(
  raw: any[],
  include: I,
): FollowerResult<I>[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseFollowers(
  raw: any[],
  include?: FollowerInclude,
): (Follower | PartialFollower)[] {
  if (include) return raw.map((r) => parseFollower(r, include));
  return raw.map((r) => parseFollower(r));
}
