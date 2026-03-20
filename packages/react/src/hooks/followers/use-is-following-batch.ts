import { fetchIsFollowingBatch, getClientUrl } from '@lsp-indexer/node';
import { createUseIsFollowingBatch } from '../factories';

/** Check if multiple follower→followed pairs exist. Returns { results: Map<string, boolean> }. Disabled when pairs is empty. */
export const useIsFollowingBatch = createUseIsFollowingBatch((pairs) =>
  fetchIsFollowingBatch(getClientUrl(), { pairs }),
);
