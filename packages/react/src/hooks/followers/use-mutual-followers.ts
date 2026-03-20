import { fetchMutualFollowers, getClientUrl } from '@lsp-indexer/node';
import { createUseMutualFollowers } from '../factories';

/** Paginated mutual followers — profiles that follow both addressA and addressB. Returns { profiles, totalCount }. */
export const useMutualFollowers = createUseMutualFollowers((params) =>
  fetchMutualFollowers(getClientUrl(), params),
);
