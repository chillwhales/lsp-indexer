import { fetchFollowedByMyFollows, getClientUrl } from '@lsp-indexer/node';
import { createUseFollowedByMyFollows } from '../factories';

/** Paginated followed-by-my-follows — profiles followed by target that my follows also follow. Returns { profiles, totalCount }. */
export const useFollowedByMyFollows = createUseFollowedByMyFollows((params) =>
  fetchFollowedByMyFollows(getClientUrl(), params),
);
