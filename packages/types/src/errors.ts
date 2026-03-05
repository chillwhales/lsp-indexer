/**
 * Error categories organized by origin — following Apollo Client v4's
 * "categorize by where errors originate" pattern, adapted for Hasura.
 */
export type IndexerErrorCategory =
  | 'NETWORK' // Fetch failed (timeout, unreachable, DNS)
  | 'HTTP' // Non-2xx HTTP response
  | 'GRAPHQL' // GraphQL-level errors in response
  | 'CONFIGURATION' // Missing/invalid env vars, bad setup
  | 'PARSE' // Response JSON parse failure
  | 'VALIDATION'; // Input validation failure

/**
 * Fine-grained error codes grouped by category.
 * Each code maps to a specific failure mode with a recovery hint.
 */
export type IndexerErrorCode =
  // Network errors
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_UNREACHABLE'
  | 'NETWORK_ABORTED'
  | 'NETWORK_UNKNOWN'
  // HTTP errors
  | 'HTTP_UNAUTHORIZED' // 401
  | 'HTTP_FORBIDDEN' // 403
  | 'HTTP_NOT_FOUND' // 404
  | 'HTTP_TOO_MANY_REQUESTS' // 429
  | 'HTTP_SERVER_ERROR' // 5xx
  | 'HTTP_UNKNOWN' // Other non-2xx
  // GraphQL errors
  | 'GRAPHQL_VALIDATION' // Schema validation error
  | 'GRAPHQL_EXECUTION' // Execution error
  | 'PERMISSION_DENIED' // Hasura permission error
  | 'GRAPHQL_UNKNOWN' // Unknown GraphQL error
  // Configuration errors
  | 'MISSING_ENV_VAR'
  | 'INVALID_URL'
  // Parse errors
  | 'RESPONSE_NOT_JSON'
  | 'EMPTY_RESPONSE'
  | 'PARSE_FAILED'
  // Validation errors
  | 'VALIDATION_FAILED';

/**
 * Options for constructing an IndexerError.
 */
export interface IndexerErrorOptions {
  category: IndexerErrorCategory;
  code: IndexerErrorCode;
  message: string;
  statusCode?: number;
  originalError?: Error;
  query?: string;
  graphqlErrors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
  /** Zod validation error details — field paths and messages */
  validationErrors?: Array<{ path: string; message: string }>;
}
