import { IndexerError } from '../errors';
import type { TypedDocumentString } from '../graphql/graphql';

/**
 * Execute a typed GraphQL query against a Hasura endpoint.
 * All error cases throw `IndexerError` (NETWORK, HTTP, GRAPHQL, PARSE).
 */
export async function execute<TResult, TVariables>(
  url: string,
  document: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/graphql-response+json',
      },
      body: JSON.stringify({
        query: document.toString(),
        variables: variables ?? undefined,
      }),
    });
  } catch (error) {
    // Network errors (DNS failure, connection refused, timeout, etc.)
    throw IndexerError.fromNetworkError(error instanceof Error ? error : new Error(String(error)));
  }

  if (!response.ok) {
    throw IndexerError.fromHttpResponse(response);
  }

  // Check for empty response body before attempting JSON parse.
  // An empty body from Hasura typically indicates a misconfigured endpoint
  // or proxy issue — distinct from a body that contains non-JSON content.
  const text = await response.text();
  if (!text) {
    throw new IndexerError({
      category: 'PARSE',
      code: 'EMPTY_RESPONSE',
      message:
        'The server returned an empty response body. Check that the endpoint is a valid Hasura GraphQL endpoint and not a proxy or load balancer.',
      query: document.toString(),
    });
  }

  let json: {
    data?: TResult;
    errors?: Array<{
      message: string;
      extensions?: Record<string, unknown>;
    }>;
  };

  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new IndexerError({
      category: 'PARSE',
      code: 'RESPONSE_NOT_JSON',
      message:
        'The server response was not valid JSON. Check that the endpoint returns GraphQL responses.',
      query: document.toString(),
    });
  }

  if (json.errors?.length) {
    throw IndexerError.fromGraphQLErrors(json.errors, document.toString());
  }

  if (!json.data) {
    throw new IndexerError({
      category: 'PARSE',
      code: 'EMPTY_RESPONSE',
      message:
        'GraphQL response contained neither data nor errors. The server may be misconfigured.',
      query: document.toString(),
    });
  }

  return json.data;
}
