import type {
  IndexerErrorCategory,
  IndexerErrorCode,
  IndexerErrorOptions,
} from '@lsp-indexer/types';

/** Typed error for all indexer failures — categorized with recovery hints. */
export class IndexerError extends Error {
  readonly category: IndexerErrorCategory;
  readonly code: IndexerErrorCode;
  readonly statusCode: number | undefined;
  readonly originalError: Error | undefined;
  readonly query: string | undefined;
  readonly graphqlErrors:
    | Array<{ message: string; extensions?: Record<string, unknown> }>
    | undefined;
  readonly validationErrors: Array<{ path: string; message: string }> | undefined;

  constructor(options: IndexerErrorOptions) {
    super(options.message);
    this.name = 'IndexerError';
    this.category = options.category;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
    this.query = options.query;
    this.graphqlErrors = options.graphqlErrors;
    this.validationErrors = options.validationErrors;
  }

  /** Serializable representation — excludes non-serializable `originalError`. */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      category: this.category,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      query: this.query,
      graphqlErrors: this.graphqlErrors,
      validationErrors: this.validationErrors,
    };
  }

  /** Create from an HTTP status code. Maps known codes to specific errors with recovery hints. */
  static fromStatusCode(status: number, query?: string): IndexerError {
    const codeMap: Record<number, IndexerErrorCode> = {
      401: 'HTTP_UNAUTHORIZED',
      403: 'HTTP_FORBIDDEN',
      404: 'HTTP_NOT_FOUND',
      429: 'HTTP_TOO_MANY_REQUESTS',
    };

    const code = codeMap[status] ?? (status >= 500 ? 'HTTP_SERVER_ERROR' : 'HTTP_UNKNOWN');

    const hints: Record<string, string> = {
      HTTP_UNAUTHORIZED:
        'Check your authentication headers (x-hasura-admin-secret or Authorization).',
      HTTP_FORBIDDEN:
        'Check your Hasura role permissions. You may need to add x-hasura-role header.',
      HTTP_NOT_FOUND:
        'Check that NEXT_PUBLIC_INDEXER_URL points to a valid Hasura GraphQL endpoint.',
      HTTP_TOO_MANY_REQUESTS: 'Rate limited by the server. Wait and retry.',
      HTTP_SERVER_ERROR: 'The Hasura server returned an internal error. Check server logs.',
    };

    return new IndexerError({
      category: 'HTTP',
      code,
      message: `${code}: HTTP ${status}. ${hints[code] ?? ''}`.trim(),
      statusCode: status,
      query,
    });
  }

  /** Create from a GraphQL errors array. Detects Hasura permission/validation patterns. */
  static fromGraphQLErrors(
    errors: Array<{
      message: string;
      extensions?: Record<string, unknown>;
    }>,
    query?: string,
  ): IndexerError {
    // Check for Hasura permission errors
    const isPermission = errors.some(
      (e) =>
        e.extensions?.code === 'access-denied' ||
        e.message.includes('not allowed') ||
        e.message.includes('permission'),
    );

    const isValidation = errors.some(
      (e) =>
        e.extensions?.code === 'validation-failed' ||
        (e.message.includes('field') && e.message.includes('not found')),
    );

    const code: IndexerErrorCode = isPermission
      ? 'PERMISSION_DENIED'
      : isValidation
        ? 'GRAPHQL_VALIDATION'
        : 'GRAPHQL_UNKNOWN';

    const hints: Record<string, string> = {
      PERMISSION_DENIED: 'Check that your Hasura role has SELECT permission on the queried table.',
      GRAPHQL_VALIDATION:
        "The query references fields that don't exist in the schema. Run codegen to update types.",
    };

    return new IndexerError({
      category: 'GRAPHQL',
      code,
      message: `${code}: ${errors.map((e) => e.message).join('; ')}. ${hints[code] ?? ''}`.trim(),
      graphqlErrors: errors,
      query,
    });
  }

  /** Narrow an unknown error payload into the shape expected by `fromGraphQLErrors`. */
  static narrowGraphQLError(e: unknown): {
    message: string;
    extensions: Record<string, unknown> | undefined;
  } {
    if (typeof e !== 'object' || e === null) {
      return { message: typeof e === 'string' ? e : 'Unknown error', extensions: undefined };
    }
    const message = 'message' in e && typeof e.message === 'string' ? e.message : 'Unknown error';
    let extensions: Record<string, unknown> | undefined;
    if (
      'extensions' in e &&
      typeof e.extensions === 'object' &&
      e.extensions !== null &&
      !Array.isArray(e.extensions)
    ) {
      extensions = Object.fromEntries(Object.entries(e.extensions));
    }
    return { message, extensions };
  }

  /** Create from a network fetch error. Detects timeout/abort vs generic failures. */
  static fromNetworkError(error: Error): IndexerError {
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');

    const code: IndexerErrorCode = isTimeout ? 'NETWORK_TIMEOUT' : 'NETWORK_UNKNOWN';

    return new IndexerError({
      category: 'NETWORK',
      code,
      message: `${code}: ${error.message}. Check your network connection and that the Hasura endpoint is reachable.`,
      originalError: error,
    });
  }

  /** Create from Zod validation issues with field-level error details. */
  static fromValidationError(
    issues: Array<{ path: PropertyKey[]; message: string }>,
    actionName: string,
  ): IndexerError {
    const validationErrors = issues.map((issue) => ({
      path: issue.path.map(String).join('.') || '(root)',
      message: issue.message,
    }));

    const details = validationErrors.map((e) => `  ${e.path}: ${e.message}`).join('\n');

    return new IndexerError({
      category: 'VALIDATION',
      code: 'VALIDATION_FAILED',
      message: `VALIDATION_FAILED: Invalid input for ${actionName}.\n${details}`,
      validationErrors,
    });
  }
}
