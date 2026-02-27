import type {
  IndexerErrorCategory,
  IndexerErrorCode,
  IndexerErrorOptions,
} from '@lsp-indexer/types';

/**
 * Typed error class for all indexer-related failures.
 *
 * Errors are categorized by origin (network, HTTP, GraphQL, configuration, parse)
 * with fine-grained codes for each failure mode. Each error includes a recovery
 * hint in its message to help developers fix the issue.
 *
 * @example
 * ```ts
 * try {
 *   const data = await execute(url, SomeDocument, { id: '123' });
 * } catch (error) {
 *   if (error instanceof IndexerError) {
 *     console.log(error.category); // 'GRAPHQL'
 *     console.log(error.code);     // 'PERMISSION_DENIED'
 *     console.log(error.toJSON()); // serializable for logging
 *   }
 * }
 * ```
 */
export class IndexerError extends Error {
  readonly category: IndexerErrorCategory;
  readonly code: IndexerErrorCode;
  readonly statusCode: number | undefined;
  readonly originalError: Error | undefined;
  readonly query: string | undefined;
  readonly graphqlErrors:
    | Array<{ message: string; extensions?: Record<string, unknown> }>
    | undefined;

  constructor(options: IndexerErrorOptions) {
    super(options.message);
    this.name = 'IndexerError';
    this.category = options.category;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
    this.query = options.query;
    this.graphqlErrors = options.graphqlErrors;
  }

  /**
   * Returns a serializable representation for server-side logging.
   * Excludes `originalError` since Error instances are not JSON-serializable.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      category: this.category,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      query: this.query,
      graphqlErrors: this.graphqlErrors,
    };
  }

  /**
   * Factory: create an IndexerError from an HTTP response with a non-2xx status.
   *
   * Maps common HTTP status codes to specific error codes with recovery hints:
   * - 401 → HTTP_UNAUTHORIZED (check auth headers)
   * - 403 → HTTP_FORBIDDEN (check Hasura role permissions)
   * - 404 → HTTP_NOT_FOUND (check endpoint URL)
   * - 429 → HTTP_TOO_MANY_REQUESTS (rate limited)
   * - 5xx → HTTP_SERVER_ERROR (server issue)
   */
  static fromHttpResponse(response: Response): IndexerError {
    const codeMap: Record<number, IndexerErrorCode> = {
      401: 'HTTP_UNAUTHORIZED',
      403: 'HTTP_FORBIDDEN',
      404: 'HTTP_NOT_FOUND',
      429: 'HTTP_TOO_MANY_REQUESTS',
    };

    const code =
      codeMap[response.status] ?? (response.status >= 500 ? 'HTTP_SERVER_ERROR' : 'HTTP_UNKNOWN');

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
      message:
        `${code}: HTTP ${response.status} ${response.statusText}. ${hints[code] ?? ''}`.trim(),
      statusCode: response.status,
    });
  }

  /**
   * Factory: create an IndexerError from a GraphQL errors array.
   *
   * Detects Hasura-specific error patterns:
   * - `extensions.code === 'access-denied'` → PERMISSION_DENIED
   * - `extensions.code === 'validation-failed'` → GRAPHQL_VALIDATION
   * - Messages containing 'not allowed' or 'permission' → PERMISSION_DENIED
   * - Messages referencing missing fields → GRAPHQL_VALIDATION
   */
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

  /**
   * Narrow an unknown value into the shape expected by `fromGraphQLErrors`.
   *
   * graphql-ws and SSE error payloads type errors as `unknown` to avoid DOM deps.
   * This method safely extracts `message` and `extensions` using runtime checks
   * without type assertions.
   */
  static narrowGraphQLError(e: unknown): {
    message: string;
    extensions: Record<string, unknown> | undefined;
  } {
    if (typeof e !== 'object' || e === null) {
      return { message: String(e), extensions: undefined };
    }
    const message = 'message' in e && typeof e.message === 'string' ? e.message : String(e);
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

  /**
   * Factory: create an IndexerError from a network fetch error.
   *
   * Detects timeout/abort errors vs generic network failures.
   * Provides a recovery hint about checking network connectivity and endpoint.
   */
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
}
