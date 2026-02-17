// Error handling
export { IndexerError } from './errors';
export type { IndexerErrorCategory, IndexerErrorCode, IndexerErrorOptions } from './errors';

// Client utilities
export { execute, getClientUrl, getClientWsUrl } from './client';

// Profile hooks
export { useInfiniteProfiles, useProfile, useProfiles } from './hooks/profiles';

// Query key factories
export { profileKeys } from './keys/profiles';

// Re-export generated types that consumers need
export type { TypedDocumentString } from './graphql/graphql';
