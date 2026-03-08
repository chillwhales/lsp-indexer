import { fetchIsFollowing, getClientUrl } from '@lsp-indexer/node';
import { createUseIsFollowing } from '../factories';

/** Check if one address follows another. Returns { isFollowing } boolean. Disabled when either address is falsy. */
export const useIsFollowing = createUseIsFollowing((followerAddress, followedAddress) =>
  fetchIsFollowing(getClientUrl(), { followerAddress, followedAddress }),
);
