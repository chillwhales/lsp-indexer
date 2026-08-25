import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('graphql-request', () => {
  class ClientError extends Error {
    constructor(
      readonly response: {
        errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
        status: number;
      },
      readonly request: { query: string },
    ) {
      super(response.errors?.map((error) => error.message).join('; ') ?? `HTTP ${response.status}`);
    }
  }

  return {
    ClientError,
    GraphQLClient: class {
      async rawRequest(document: string, variables: unknown): Promise<{ data: unknown }> {
        return { data: await requestMock(document, variables) };
      }
    },
  };
});

import { GraphQLError } from 'graphql';
import { ClientError } from 'graphql-request';
import { TypedDocumentString } from '../../graphql/graphql';
import { execute } from '../execute';

const document = new TypedDocumentString<{ value: string }, { id: string }>('query Test');

function clientError(status: number, errors?: GraphQLError[]): ClientError {
  return new ClientError(
    { status, errors, headers: new Headers(), body: '' },
    { query: 'query Test' },
  );
}

beforeEach(() => requestMock.mockReset());

describe('execute', () => {
  it('returns successful data and forwards serialized variables', async () => {
    requestMock.mockResolvedValue({ value: 'ok' });
    await expect(
      execute('https://indexer.example/graphql', document, { id: '1' }),
    ).resolves.toEqual({ value: 'ok' });
    expect(requestMock).toHaveBeenCalledWith('query Test', { id: '1' });
  });

  it('normalizes GraphQL, HTTP, fallback ClientError, and network failures', async () => {
    requestMock.mockRejectedValueOnce(
      clientError(200, [
        new GraphQLError('not allowed', { extensions: { code: 'access-denied' } }),
      ]),
    );
    await expect(
      execute('https://indexer.example/graphql', document, { id: '1' }),
    ).rejects.toMatchObject({
      category: 'GRAPHQL',
      code: 'PERMISSION_DENIED',
      query: 'query Test',
    });

    requestMock.mockRejectedValueOnce(clientError(503));
    await expect(
      execute('https://indexer.example/graphql', document, { id: '1' }),
    ).rejects.toMatchObject({
      category: 'HTTP',
      code: 'HTTP_SERVER_ERROR',
      statusCode: 503,
    });

    requestMock.mockRejectedValueOnce(clientError(0));
    await expect(
      execute('https://indexer.example/graphql', document, { id: '1' }),
    ).rejects.toMatchObject({
      category: 'GRAPHQL',
      code: 'GRAPHQL_UNKNOWN',
    });

    requestMock.mockRejectedValueOnce(new Error('connection timeout'));
    await expect(
      execute('https://indexer.example/graphql', document, { id: '1' }),
    ).rejects.toMatchObject({
      category: 'NETWORK',
      code: 'NETWORK_TIMEOUT',
    });
  });
});
