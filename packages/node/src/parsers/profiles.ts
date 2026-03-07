import type { PartialProfile, Profile, ProfileInclude } from '@lsp-indexer/types';
import type { GetProfileQuery } from '../graphql/graphql';
import { stripExcluded } from './strip';
import { parseAsset, parseImage, parseLinks } from './utils';

/** Omits `id` so sub-selections from other domains also satisfy this type. */
type RawProfile = Omit<GetProfileQuery['universal_profile'][number], 'id'>;

/** Parse a raw Hasura row into a clean `Profile`. */
export function parseProfile(raw: RawProfile): Profile;
export function parseProfile(raw: RawProfile, include: ProfileInclude): PartialProfile;
export function parseProfile(raw: RawProfile, include?: ProfileInclude): Profile | PartialProfile {
  const lsp3 = raw.lsp3Profile;

  const profile: Profile = {
    address: raw.address,
    name: lsp3?.name?.value ?? null,
    description: lsp3?.description?.value ?? null,
    tags:
      lsp3?.tags != null
        ? lsp3.tags.map((t) => t.value).filter((v): v is string => v != null)
        : null,
    links: parseLinks(lsp3?.links),
    avatar: lsp3?.avatar != null ? lsp3.avatar.map(parseAsset) : null,
    profileImage: lsp3?.profileImage != null ? lsp3.profileImage.map(parseImage) : null,
    backgroundImage: lsp3?.backgroundImage != null ? lsp3.backgroundImage.map(parseImage) : null,
    followerCount: raw.followedBy_aggregate?.aggregate?.count ?? 0,
    followingCount: raw.followed_aggregate?.aggregate?.count ?? 0,
  };

  if (!include) return profile;
  return stripExcluded(profile, include, ['address']);
}

/** Batch variant of parseProfile. */
export function parseProfiles(raw: RawProfile[]): Profile[];
export function parseProfiles(raw: RawProfile[], include: ProfileInclude): PartialProfile[];
export function parseProfiles(
  raw: RawProfile[],
  include?: ProfileInclude,
): (Profile | PartialProfile)[] {
  if (!include) return raw.map((r) => parseProfile(r));
  return raw.map((r) => parseProfile(r, include));
}
