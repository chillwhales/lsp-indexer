import type { SubscriptionHookOptions, SubscriptionInstance } from '@lsp-indexer/types';
import { IndexerError } from '../errors';
import type { SubscriptionConfig } from './types';

/**
 * Internal interface for the client that subscription instances use.
 * This allows the instance to work with any client implementation (React, Next, etc.)
 * without importing the full SubscriptionClient interface.
 *
 * Uses plain types — no `graphql-ws` types leak through this boundary.
 * The `TResult` generic on `executeSubscription` threads the result type
 * through to the sink so `config.extract(result.data)` is fully typed.
 */
export interface SubscriptionClientExecutor {
  executeSubscription<TResult>(
    payload: { query: string; variables?: Record<string, unknown> },
    sink: {
      next: (result: { data?: TResult }) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): () => void;

  onReconnect(callback: () => void): () => void;
}

/**
 * Options for constructing a GenericSubscriptionInstance.
 */
export interface SubscriptionInstanceInit<
  TResult,
  TVariables extends Record<string, unknown>,
  TRaw,
  TParsed,
> {
  /** The client executor for running subscriptions */
  client: SubscriptionClientExecutor;
  /** Domain configuration (document, variables, extract, parser) */
  config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>;
  /** Hook-level options (enabled, callbacks) */
  options?: SubscriptionHookOptions<TParsed>;
  /**
   * Called when this instance is disposed.
   * Used by SubscriptionClient to track active subscriptions without
   * monkey-patching the dispose method.
   */
  onDispose?: () => void;
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
 */
export class GenericSubscriptionInstance<
  TResult,
  TVariables extends Record<string, unknown>,
  TRaw,
  TParsed,
> implements SubscriptionInstance<TParsed>
{
  private _data: TParsed[] | null = null;
  private _error: unknown = null;
  private _isSubscribed = false;
  private listeners = new Set<() => void>();
  private cleanup: (() => void) | null = null;
  private reconnectCleanup: (() => void) | null = null;
  private readonly onDisposeCallback: (() => void) | undefined;

  private readonly client: SubscriptionClientExecutor;
  private readonly config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>;
  private readonly options: SubscriptionHookOptions<TParsed>;

  constructor(init: SubscriptionInstanceInit<TResult, TVariables, TRaw, TParsed>) {
    this.client = init.client;
    this.config = init.config;
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

    // Execute the subscription — TResult threads through executeSubscription
    // so that result.data is typed as TResult (no casts needed).
    this.cleanup = this.client.executeSubscription<TResult>(
      { query: this.config.document.toString(), variables: this.config.variables },
      {
        next: (result) => {
          if (!result.data) return;
          const rawData = this.config.extract(result.data);
          if (!Array.isArray(rawData) || rawData.length === 0) return;

          try {
            const parsed = this.config.parser(rawData);
            this.setData(parsed);
            this.setError(null);
            this.options.onData?.(parsed);
          } catch (parseError) {
            this.setError(
              new IndexerError({
                category: 'PARSE',
                code: 'PARSE_FAILED',
                message: `Failed to parse subscription data: ${
                  parseError instanceof Error ? parseError.message : String(parseError)
                }`,
                originalError: parseError instanceof Error ? parseError : undefined,
              }),
            );
          }
        },
        error: (rawError: unknown) => {
          if (rawError instanceof IndexerError) {
            this.setError(rawError);
          } else if (Array.isArray(rawError)) {
            // GraphQL errors array
            this.setError(
              IndexerError.fromGraphQLErrors(
                rawError.map(IndexerError.narrowGraphQLError),
                this.config.document.toString(),
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
      },
    );
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
