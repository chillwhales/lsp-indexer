import { fetchMutualFollowers, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteMutualFollowers } from '../factories';

/** Infinite scroll mutual followers — profiles that follow both addressA and addressB. Returns { profiles }. */
export const useInfiniteMutualFollowers = createUseInfiniteMutualFollowers((params) =>
  fetchMutualFollowers(getClientUrl(), params),
);
