import { describe, expect, it, vi } from 'vitest';
import { IndexerError } from '../../errors';
import {
  GenericSubscriptionInstance,
  type SubscriptionClientExecutor,
} from '../subscription-instance';

interface TestSink {
  next(data: string[]): void;
  error(error: unknown): void;
  complete(): void;
}

function createHarness(
  options: {
    enabled?: boolean;
    onData?: (data: string[]) => void;
    onReconnect?: () => void;
  } = {},
) {
  let sink: TestSink | undefined;
  let reconnect: (() => void) | undefined;
  const cleanup = vi.fn();
  const reconnectCleanup = vi.fn();
  const onDispose = vi.fn();
  const client: SubscriptionClientExecutor = {
    executeSubscription: vi.fn(),
    onReconnect(callback) {
      reconnect = callback;
      return reconnectCleanup;
    },
  };
  const execute = vi.fn((nextSink: TestSink) => {
    sink = nextSink;
    return cleanup;
  });
  const instance = new GenericSubscriptionInstance({
    client,
    execute,
    documentString: 'subscription Test { items }',
    options,
    onDispose,
  });
  return {
    cleanup,
    execute,
    instance,
    onDispose,
    reconnect: () => reconnect?.(),
    reconnectCleanup,
    sink: () => {
      if (!sink) throw new Error('subscription did not start');
      return sink;
    },
  };
}

describe('GenericSubscriptionInstance', () => {
  it('publishes data, clears prior errors, and invokes lifecycle callbacks', () => {
    const onData = vi.fn();
    const onReconnect = vi.fn();
    const harness = createHarness({ onData, onReconnect });
    const listener = vi.fn();
    const unsubscribe = harness.instance.subscribe(listener);

    expect(harness.instance.isSubscribed).toBe(true);
    harness.sink().next([]);
    expect(harness.instance.data).toEqual([]);
    expect(harness.instance.error).toBeNull();
    expect(onData).toHaveBeenCalledWith([]);
    expect(listener).toHaveBeenCalled();

    harness.reconnect();
    expect(onReconnect).toHaveBeenCalledOnce();
    unsubscribe();
    harness.sink().complete();
    expect(harness.instance.isSubscribed).toBe(false);
  });

  it('normalizes GraphQL arrays, network failures, and preserves IndexerError instances', () => {
    const graphql = createHarness();
    graphql.sink().error([{ message: 'permission denied', extensions: { code: 'access-denied' } }]);
    expect(graphql.instance.error).toMatchObject({
      category: 'GRAPHQL',
      code: 'PERMISSION_DENIED',
    });

    const network = createHarness();
    network.sink().error(new Error('socket failed'));
    expect(network.instance.error).toMatchObject({
      category: 'NETWORK',
      code: 'NETWORK_UNKNOWN',
    });

    const expected = new IndexerError({
      category: 'PARSE',
      code: 'PARSE_FAILED',
      message: 'bad row',
    });
    const parsed = createHarness();
    parsed.sink().error(expected);
    expect(parsed.instance.error).toBe(expected);
  });

  it('does not connect when disabled and disposes active resources exactly once', () => {
    const disabled = createHarness({ enabled: false });
    expect(disabled.execute).not.toHaveBeenCalled();
    expect(disabled.instance.isSubscribed).toBe(false);

    const active = createHarness();
    active.instance.dispose();
    expect(active.cleanup).toHaveBeenCalledOnce();
    expect(active.reconnectCleanup).toHaveBeenCalledOnce();
    expect(active.onDispose).toHaveBeenCalledOnce();
    expect(active.instance.isSubscribed).toBe(false);
  });
});
