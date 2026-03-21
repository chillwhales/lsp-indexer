import { fetchMutualFollows, getClientUrl } from '@lsp-indexer/node';
import { createUseMutualFollows } from '../factories';

/** Paginated mutual follows — profiles that both addressA and addressB follow. Returns { profiles, totalCount }. */
export const useMutualFollows = createUseMutualFollows((params) =>
  fetchMutualFollows(getClientUrl(), params),
);
