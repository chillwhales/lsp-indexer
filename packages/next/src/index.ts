// Server actions (browser → Next.js server → Hasura)
export { getProfile, getProfiles } from './actions/profiles';

// Hooks that use server actions as queryFn (identical API to @lsp-indexer/react)
export { useInfiniteProfiles, useProfile, useProfiles } from './hooks/profiles';

// Re-export from @lsp-indexer/node for convenience
export { IndexerError, profileKeys } from '@lsp-indexer/node';
export type {
  IndexerErrorCategory,
  IndexerErrorCode,
  IndexerErrorOptions,
} from '@lsp-indexer/node';
