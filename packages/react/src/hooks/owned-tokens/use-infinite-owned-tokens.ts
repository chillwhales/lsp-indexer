import { fetchOwnedTokens, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteOwnedTokens } from '../factories';

/** Infinite scroll owned tokens. Separate cache key from useOwnedTokens. Returns { ownedTokens } instead of data. */
export const useInfiniteOwnedTokens = createUseInfiniteOwnedTokens((params) =>
  fetchOwnedTokens(getClientUrl(), params),
);
