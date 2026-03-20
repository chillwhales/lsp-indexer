import { fetchMutualFollows, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteMutualFollows } from '../factories';

/** Infinite scroll mutual follows — profiles that both addressA and addressB follow. Returns { profiles }. */
export const useInfiniteMutualFollows = createUseInfiniteMutualFollows((params) =>
  fetchMutualFollows(getClientUrl(), params),
);
