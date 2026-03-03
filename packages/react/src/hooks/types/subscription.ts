import { ConnectionState, SubscriptionConfig } from '@lsp-indexer/node';
import {
  SubscriptionHookOptions,
  SubscriptionInstance,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { QueryClient } from '@tanstack/react-query';

/**
 * Extended options for the hook (adds TanStack Query integration on top
 * of the base SubscriptionHookOptions).
 */
export interface UseSubscriptionOptions<T> extends SubscriptionHookOptions<T> {
  /** TanStack QueryClient for cache invalidation */
  queryClient?: QueryClient;
}

/**
 * Minimal interface for the subscription client expected by the hook.
 * Avoids coupling to the concrete SubscriptionClient class so any
 * implementation (React direct-WS, Next.js proxy) can be used.
 */
export interface UseSubscriptionClient {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ConnectionState;
  getServerSnapshot: () => ConnectionState;
  createSubscription: <TResult, TVariables extends Record<string, unknown>, TRaw, TParsed>(
    config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>,
    options?: SubscriptionHookOptions<TParsed>,
  ) => SubscriptionInstance<TParsed>;
}

/**
 * The `useSubscription` function signature that domain factories depend on.
 * Both `@lsp-indexer/react` and `@lsp-indexer/next` produce a function with
 * this shape via `createUseSubscription`.
 */
export type UseSubscriptionFn = <
  TResult,
  TVariables extends Record<string, unknown>,
  TRaw,
  TParsed,
>(
  config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>,
  options?: UseSubscriptionOptions<TParsed>,
) => UseSubscriptionReturn<TParsed>;
