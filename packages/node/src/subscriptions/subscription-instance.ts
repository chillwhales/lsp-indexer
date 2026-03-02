import type { SubscriptionHookOptions, SubscriptionInstance } from '@lsp-indexer/types';
import { IndexerError } from '../errors';
import { TypedDocumentString } from '../graphql/graphql';

/**
 * Internal interface for the client that subscription instances use.
 * This allows the instance to work with any client implementation (React, Next, etc.)
 * without importing the full SubscriptionClient interface.
 *
 * Uses plain types — no `graphql-ws` types leak through this boundary.
 * The `TResult` generic on `executeSubscription` threads the result type
 * through to the sink so `config.extract(result.data)` is fully typed.
 *
 * `query` is `{ toString(): string }` — accepts `TypedDocumentString` without
 * importing it. The `.toString()` call happens inside the client implementation,
 * at the last moment before handing to graphql-ws.
 */
export interface SubscriptionClientExecutor {
  executeSubscription<TResult, TVariables extends Record<string, unknown>>(
    payload: { query: TypedDocumentString<TResult, TVariables>; variables?: TVariables },
    sink: {
      next: (result: { data?: TResult | null }) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): () => void;

  onReconnect(callback: () => void): () => void;
}

/**
 * Generic subscription instance that manages state for a single subscription.
 *
 * This class is used by both React and Next.js SubscriptionClient implementations
 * to avoid code duplication. It handles:
 * - Subscription lifecycle (start/stop)
 * - Data parsing and error handling
 * - State change notifications
 * - User callback invocation
 *
 * The constructor takes an `execute` closure and a `documentString`. The closure
 * delivers `TParsed[]` directly — no intermediate types or casts needed.
 */
export class GenericSubscriptionInstance<TParsed> implements SubscriptionInstance<TParsed> {
  private _data: TParsed[] | null = null;
  private _error: unknown = null;
  private _isSubscribed = false;
  private listeners = new Set<() => void>();
  private cleanup: (() => void) | null = null;
  private reconnectCleanup: (() => void) | null = null;
  private readonly onDisposeCallback: (() => void) | undefined;

  private readonly client: SubscriptionClientExecutor;
  private readonly execute: (sink: {
    next: (parsed: TParsed[]) => void;
    error: (error: unknown) => void;
    complete: () => void;
  }) => () => void;
  private readonly documentString: string;
  private readonly options: SubscriptionHookOptions<TParsed>;

  constructor(init: {
    client: SubscriptionClientExecutor;
    execute: (sink: {
      next: (parsed: TParsed[]) => void;
      error: (error: unknown) => void;
      complete: () => void;
    }) => () => void;
    documentString: string;
    options?: SubscriptionHookOptions<TParsed>;
    onDispose?: () => void;
  }) {
    this.client = init.client;
    this.execute = init.execute;
    this.documentString = init.documentString;
    this.options = init.options ?? {};
    this.onDisposeCallback = init.onDispose;
    this.start();
  }

  get data(): TParsed[] | null {
    return this._data;
  }

  get error(): unknown {
    return this._error;
  }

  get isSubscribed(): boolean {
    return this._isSubscribed;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.stop();
    this.listeners.clear();
    this.onDisposeCallback?.();
  }

  private start(): void {
    if (this.options.enabled === false) return;

    // Register reconnect callback
    this.reconnectCleanup = this.client.onReconnect(() => {
      this.options.onReconnect?.();
    });

    // Mark as subscribed BEFORE executing so that synchronous error/complete
    // callbacks from graphql-ws don't get overwritten. If executeSubscription
    // fires error() or complete() synchronously (e.g. validation errors),
    // their setSubscribed(false) will correctly take precedence.
    this.setSubscribed(true);

    // Execute the subscription — the closure delivers TParsed[] directly;
    // extract + parse already happened inside the closure.
    this.cleanup = this.execute({
      next: (parsed) => {
        this.setData(parsed);
        this.setError(null);
        this.options.onData?.(parsed);
      },
      error: (rawError: unknown) => {
        if (rawError instanceof IndexerError) {
          this.setError(rawError);
        } else if (Array.isArray(rawError)) {
          // GraphQL errors array
          this.setError(
            IndexerError.fromGraphQLErrors(
              rawError.map(IndexerError.narrowGraphQLError),
              this.documentString,
            ),
          );
        } else {
          this.setError(
            new IndexerError({
              category: 'NETWORK',
              code: 'NETWORK_UNKNOWN',
              message: `Subscription error: ${
                rawError instanceof Error ? rawError.message : String(rawError)
              }`,
              originalError: rawError instanceof Error ? rawError : undefined,
            }),
          );
        }
        this.setSubscribed(false);
      },
      complete: () => {
        this.setSubscribed(false);
      },
    });
  }

  private stop(): void {
    this.cleanup?.();
    this.cleanup = null;
    this.reconnectCleanup?.();
    this.reconnectCleanup = null;
    this.setSubscribed(false);
  }

  private setData(newData: TParsed[] | null): void {
    if (this._data !== newData) {
      this._data = newData;
      this.notifyListeners();
    }
  }

  private setError(newError: unknown): void {
    if (this._error !== newError) {
      this._error = newError;
      this.notifyListeners();
    }
  }

  private setSubscribed(subscribed: boolean): void {
    if (this._isSubscribed !== subscribed) {
      this._isSubscribed = subscribed;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
