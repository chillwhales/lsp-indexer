// Error handling
export { IndexerError } from './errors';
export type { IndexerErrorCategory, IndexerErrorCode, IndexerErrorOptions } from './errors';

// Client utilities
export { execute, getClientUrl, getClientWsUrl } from './client';

// Re-export generated types that consumers need
export type { TypedDocumentString } from './graphql/graphql';
