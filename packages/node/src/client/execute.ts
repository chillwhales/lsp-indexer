import { ClientError, GraphQLClient } from 'graphql-request';
import { IndexerError } from '../errors';
import type { TypedDocumentString } from '../graphql/graphql';

/**
 * Execute a typed GraphQL query against a Hasura endpoint.
 * Uses graphql-request under the hood. All error cases throw `IndexerError`.
 */
export function execute<TResult, TVariables extends Record<string, unknown>>(
  url: string,
  document: TypedDocumentString<TResult, TVariables>,
  variables: TVariables,
): Promise<TResult>;
export function execute<TResult>(
  url: string,
  document: TypedDocumentString<TResult, Record<string, never>>,
): Promise<TResult>;
export async function execute<TResult, TVariables extends Record<string, unknown>>(
  url: string,
  document: TypedDocumentString<TResult, TVariables>,
  variables?: TVariables,
): Promise<TResult> {
  const client = new GraphQLClient(url, {
    headers: { Accept: 'application/graphql-response+json' },
  });

  try {
    const response = await client.rawRequest<TResult, TVariables>(document.toString(), variables);
    return response.data;
  } catch (error) {
    if (error instanceof ClientError) {
      // GraphQL-level errors (permission denied, validation, etc.)
      if (error.response.errors?.length) {
        throw IndexerError.fromGraphQLErrors(
          error.response.errors.map((e) => IndexerError.narrowGraphQLError(e)),
          document.toString(),
        );
      }

      // HTTP-level errors (4xx, 5xx) — delegate to shared fromStatusCode.
      if (error.response.status && error.response.status >= 400) {
        throw IndexerError.fromStatusCode(error.response.status, document.toString());
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
