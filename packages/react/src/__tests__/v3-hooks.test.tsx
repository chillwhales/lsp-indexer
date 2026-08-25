// @vitest-environment jsdom

import {
  buildV3SubscriptionConfig,
  type SubscriptionConfig,
  type V3DomainListParams,
} from '@lsp-indexer/node';
import type {
  SubscriptionHookOptions,
  SubscriptionInstance,
  V3Block,
  V3Domain,
  V3DomainResultMap,
  V3ListResult,
} from '@lsp-indexer/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createUseSubscription,
  createUseV3Infinite,
  createUseV3List,
  getV3NextPageOffset,
  type UseSubscriptionClient,
  type V3DomainQuery,
} from '../index';

const HASH = `0x${'11'.repeat(32)}`;
const TIMESTAMP = '2026-08-25T12:00:00.000Z';

function block(network: string, number: number): V3Block {
  return {
    id: `${network}:${number}`,
    network,
    chainId: network === 'lukso-mainnet' ? 42 : 1,
    blockNumber: number,
    blockHash: HASH,
    timestamp: TIMESTAMP,
    number,
    hash: HASH,
    parentHash: HASH,
  };
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

function queryWrapper(queryClient: QueryClient): (props: { children: ReactNode }) => ReactNode {
  return function QueryWrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

class FakeSubscriptionClient implements UseSubscriptionClient {
  emitData: () => void = () => undefined;
  emitReconnect: () => void = () => undefined;

  subscribe(_listener: () => void): () => void {
    return () => undefined;
  }

  getSnapshot(): 'connected' {
    return 'connected';
  }

  getServerSnapshot(): 'disconnected' {
    return 'disconnected';
  }

  createSubscription<TResult, TVariables extends Record<string, unknown>, TRaw, TParsed>(
    _config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>,
    options?: SubscriptionHookOptions<TParsed>,
  ): SubscriptionInstance<TParsed> {
    this.emitData = () => options?.onData?.([]);
    this.emitReconnect = () => options?.onReconnect?.();
    return {
      data: null,
      error: null,
      isSubscribed: true,
      subscribe() {
        return () => undefined;
      },
      dispose() {},
    };
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('uniform v3 React hooks', () => {
  it('keeps identical filters on two networks in separate query entries', async () => {
    const calls: Array<{ domain: V3Domain; network: string }> = [];
    const query: V3DomainQuery = <Domain extends V3Domain>(
      domain: Domain,
      params: V3DomainListParams<Domain>,
    ): Promise<V3ListResult<V3DomainResultMap[Domain]>> => {
      calls.push({ domain, network: params.network });
      return Promise.resolve({ items: [], totalCount: 0 });
    };
    const useList = createUseV3List(() => query);
    const queryClient = createQueryClient();
    const wrapper = queryWrapper(queryClient);
    const filter = { address: { eq: `0x${'22'.repeat(20)}` } };

    const lukso = renderHook(() => useList('profiles', { network: 'lukso-mainnet', filter }), {
      wrapper,
    });
    const ethereum = renderHook(
      () => useList('profiles', { network: 'ethereum-mainnet', filter }),
      { wrapper },
    );

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2);
    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .map((entry) => entry.queryKey),
    ).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['lukso-mainnet', 'profiles']),
        expect.arrayContaining(['ethereum-mainnet', 'profiles']),
      ]),
    );

    lukso.unmount();
    ethereum.unmount();
    queryClient.clear();
  });

  it('pages by returned row count and stops when totalCount is loaded', async () => {
    const offsets: number[] = [];
    const query: V3DomainQuery = <Domain extends V3Domain>(
      domain: Domain,
      params: V3DomainListParams<Domain>,
    ): Promise<V3ListResult<V3DomainResultMap[Domain]>> => {
      if (domain !== 'blocks') return Promise.resolve({ items: [], totalCount: 0 });
      const offset = params.offset ?? 0;
      offsets.push(offset);
      const result = {
        items:
          offset === 0
            ? [block(params.network, 3), block(params.network, 2)]
            : [block(params.network, 1)],
        totalCount: 3,
      };
      // The runtime domain guard proves the fixture correlation that TypeScript cannot narrow.
      return Promise.resolve(result as V3ListResult<V3DomainResultMap[Domain]>);
    };
    const useInfinite = createUseV3Infinite(() => query);
    const queryClient = createQueryClient();
    const rendered = renderHook(
      () => useInfinite('blocks', { network: 'lukso-mainnet', pageSize: 2 }),
      { wrapper: queryWrapper(queryClient) },
    );

    await waitFor(() => expect(rendered.result.current.items).toHaveLength(2));
    await act(async () => {
      await rendered.result.current.fetchNextPage();
    });
    await waitFor(() => expect(rendered.result.current.items).toHaveLength(3));

    expect(offsets).toEqual([0, 2]);
    expect(rendered.result.current.hasNextPage).toBe(false);
    expect(
      getV3NextPageOffset({ items: [1], totalCount: 4 }, [{ items: [1], totalCount: 4 }], 0),
    ).toBe(1);

    rendered.unmount();
    queryClient.clear();
  });

  it('invalidates configured caches on data and reconnect while keeping callbacks fresh', async () => {
    const subscriptionClient = new FakeSubscriptionClient();
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const firstData = vi.fn();
    const secondData = vi.fn();
    const reconnect = vi.fn();
    const useSubscription = createUseSubscription(() => subscriptionClient);
    const config = buildV3SubscriptionConfig('blocks', { network: 'lukso-mainnet' });

    const rendered = renderHook(
      ({ onData }) =>
        useSubscription(config, {
          invalidate: true,
          invalidateKeys: [['lsp-indexer', 'v3', 'lukso-mainnet', 'blocks']],
          queryClient,
          onData,
          onReconnect: reconnect,
        }),
      {
        initialProps: { onData: firstData },
      },
    );

    await waitFor(() => expect(rendered.result.current.isSubscribed).toBe(true));
    rendered.rerender({ onData: secondData });

    act(() => subscriptionClient.emitData());
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
    expect(firstData).not.toHaveBeenCalled();
    expect(secondData).toHaveBeenCalledWith([]);

    act(() => subscriptionClient.emitReconnect());
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
    expect(reconnect).toHaveBeenCalledTimes(1);

    rendered.unmount();
    queryClient.clear();
  });
});
