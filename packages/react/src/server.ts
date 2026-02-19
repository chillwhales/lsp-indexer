// Server-side utilities — re-exported from @lsp-indexer/node for backward compatibility.
// Prefer importing directly from @lsp-indexer/node.
export {
  IndexerError,
  execute,
  fetchProfile,
  fetchProfiles,
  getServerUrl,
  getServerWsUrl,
} from '@lsp-indexer/node';
export type {
  FetchProfilesResult,
  IndexerErrorCategory,
  IndexerErrorCode,
  IndexerErrorOptions,
} from '@lsp-indexer/node';
