import { ClientError, GraphQLClient } from 'graphql-request';
import { IndexerError } from '../errors';
import type { TypedDocumentString } from '../graphql/graphql';

/**
 * Execute a typed GraphQL query against a Hasura endpoint.
 * Uses graphql-request under the hood. All error cases throw `IndexerError`.
 */
export async function execute<TResult, TVariables>(
  url: string,
  document: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  const client = new GraphQLClient(url, {
    headers: { Accept: 'application/graphql-response+json' },
  });

  try {
    return await client.request(document.toString(), variables ?? undefined);
  } catch (error) {
    if (error instanceof ClientError) {
      // GraphQL-level errors (permission denied, validation, etc.)
      if (error.response.errors?.length) {
        throw IndexerError.fromGraphQLErrors(
          error.response.errors.map(IndexerError.narrowGraphQLError),
          document.toString(),
        );
      }

      // HTTP-level errors (4xx, 5xx)
      if (error.response.status && error.response.status >= 400) {
        throw new IndexerError({
          category: 'HTTP',
          code: error.response.status >= 500 ? 'HTTP_SERVER_ERROR' : 'HTTP_UNKNOWN',
          message: `HTTP ${error.response.status}: ${error.message}`,
          statusCode: error.response.status,
          query: document.toString(),
        });
      }

      // Fallback for other ClientError shapes
      throw new IndexerError({
        category: 'GRAPHQL',
        code: 'GRAPHQL_UNKNOWN',
        message: error.message,
        query: document.toString(),
      });
    }

    // Network errors (DNS failure, connection refused, timeout, etc.)
    throw IndexerError.fromNetworkError(error instanceof Error ? error : new Error(String(error)));
  }
}
