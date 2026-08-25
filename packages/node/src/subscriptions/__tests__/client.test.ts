import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock, disposeMock, subscribeMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  disposeMock: vi.fn(),
  subscribeMock: vi.fn(),
}));

vi.mock('graphql-ws', () => ({ createClient: createClientMock }));

import { IndexerError } from '../../errors';
import { TypedDocumentString } from '../../graphql/graphql';
import { SubscriptionClient } from '../client';

interface WireResult {
  items: Array<{ value: string }>;
}

beforeEach(() => {
  createClientMock.mockReset();
  disposeMock.mockReset();
  subscribeMock.mockReset();
  subscribeMock.mockReturnValue(vi.fn());
  createClientMock.mockReturnValue({ dispose: disposeMock, subscribe: subscribeMock });
});

describe('SubscriptionClient', () => {
  it('tracks connection state and reports reconnects after an abrupt close', () => {
    const client = new SubscriptionClient('wss://indexer.example/v1/graphql');
    const stateListener = vi.fn();
    const reconnect = vi.fn();
    client.subscribe(stateListener);
    client.onReconnect(reconnect);

    client.executeSubscription(
      { query: new TypedDocumentString<WireResult, Record<string, unknown>>('subscription Test') },
      { next: vi.fn(), error: vi.fn(), complete: vi.fn() },
    );

    const options = createClientMock.mock.calls[0]?.[0];
    expect(options).toMatchObject({
      url: 'wss://indexer.example/v1/graphql',
      lazy: true,
      retryAttempts: Infinity,
    });
    options.on.connecting();
    expect(client.getSnapshot()).toBe('connecting');
    options.on.connected({}, undefined, false);
    expect(client.isConnected).toBe(true);
    options.on.closed({ code: 1006 });
    expect(client.getSnapshot()).toBe('disconnected');
    options.on.connected({}, undefined, false);
    expect(reconnect).toHaveBeenCalledOnce();
    expect(stateListener).toHaveBeenCalledTimes(4);
    expect(client.getServerSnapshot()).toBe('disconnected');
  });

  it('delivers empty live-query snapshots and wraps parser failures', () => {
    const client = new SubscriptionClient('wss://indexer.example/v1/graphql');
    const onData = vi.fn();
    const instance = client.createSubscription(
      {
        document: new TypedDocumentString<WireResult, Record<string, unknown>>('subscription Test'),
        variables: {},
        extract: (result) => result.items,
        parser: (rows) => rows.map((row) => row.value),
      },
      { onData },
    );
    const sink = subscribeMock.mock.calls[0]?.[1];
    sink.next({ data: { items: [] } });
    expect(instance.data).toEqual([]);
    expect(onData).toHaveBeenCalledWith([]);

    const broken = client.createSubscription({
      document: new TypedDocumentString<WireResult, Record<string, unknown>>('subscription Broken'),
      variables: {},
      extract: (result) => result.items,
      parser() {
        throw new Error('invalid row');
      },
    });
    const brokenSink = subscribeMock.mock.calls[1]?.[1];
    brokenSink.next({ data: { items: [{ value: 'bad' }] } });
    expect(broken.error).toBeInstanceOf(IndexerError);
    expect(broken.error).toMatchObject({ category: 'PARSE', code: 'PARSE_FAILED' });
  });

  it('forwards wire errors and disposes subscriptions plus the shared socket', () => {
    const client = new SubscriptionClient('wss://indexer.example/v1/graphql');
    const wireError = vi.fn();
    const wireComplete = vi.fn();
    const unsubscribe = vi.fn();
    subscribeMock.mockReturnValueOnce(unsubscribe);
    client.executeSubscription(
      {
        query: new TypedDocumentString<WireResult, { limit: number }>('subscription Test'),
        variables: { limit: 1 },
      },
      { next: vi.fn(), error: wireError, complete: wireComplete },
    );
    const payload = subscribeMock.mock.calls[0]?.[0];
    expect(payload).toEqual({ query: 'subscription Test', variables: { limit: 1 } });

    const instance = client.createSubscription({
      document: new TypedDocumentString<WireResult, Record<string, unknown>>(
        'subscription Managed',
      ),
      variables: {},
      extract: (result) => result.items,
      parser: (rows) => rows,
    });
    expect(instance.isSubscribed).toBe(true);
    client.dispose();
    expect(disposeMock).toHaveBeenCalledOnce();
    expect(instance.isSubscribed).toBe(false);
    expect(client.getSnapshot()).toBe('disconnected');
  });
});
