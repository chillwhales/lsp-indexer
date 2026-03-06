import { fetchFollowCount, getClientUrl } from '@lsp-indexer/node';
import { createUseFollowCount } from '../factories';

/** Follower + following counts for an address. Returns { followerCount, followingCount }. Disabled when address is falsy. */
export const useFollowCount = createUseFollowCount((address) =>
  fetchFollowCount(getClientUrl(), { address }),
);
