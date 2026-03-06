import { fetchProfiles, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteProfiles } from '../factories';

/** Infinite scroll profiles. Separate cache key from useProfiles. Returns { profiles } instead of data. */
export const useInfiniteProfiles = createUseInfiniteProfiles((params) =>
  fetchProfiles(getClientUrl(), params),
);
