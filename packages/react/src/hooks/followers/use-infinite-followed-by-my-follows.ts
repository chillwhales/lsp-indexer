import { fetchFollowedByMyFollows, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteFollowedByMyFollows } from '../factories';

/** Infinite scroll followed-by-my-follows — profiles followed by target that my follows also follow. Returns { profiles }. */
export const useInfiniteFollowedByMyFollows = createUseInfiniteFollowedByMyFollows((params) =>
  fetchFollowedByMyFollows(getClientUrl(), params),
);
