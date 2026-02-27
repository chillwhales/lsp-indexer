import type {
  SubscriptionConfig,
  SubscriptionHookOptions,
  SubscriptionInstance,
} from '@lsp-indexer/types';
import { IndexerError } from '../errors';

/**
 * Internal interface for the client that subscription instances use.
 * This allows the instance to work with any client implementation (React, Next, etc.)
 * without importing the full SubscriptionClient interface.
 */
export interface SubscriptionClientExecutor {
  executeSubscription(
    payload: { query: string; variables?: Record<string, unknown> },
    sink: {
      next: (result: { data?: Record<string, unknown> }) => void;
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
 */
export class GenericSubscriptionInstance<T> implements SubscriptionInstance<T> {
  private _data: T[] | null = null;
  private _error: unknown = null;
  private _isSubscribed = false;
  private listeners = new Set<() => void>();
  private cleanup: (() => void) | null = null;
  private reconnectCleanup: (() => void) | null = null;

  constructor(
    private client: SubscriptionClientExecutor,
    private config: SubscriptionConfig<T>,
    private options: SubscriptionHookOptions<T> = {},
  ) {
    this.start();
  }

  get data(): T[] | null {
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
  }

  private start(): void {
    if (!this.options.enabled && this.options.enabled !== undefined) return;

    // Register reconnect callback
    this.reconnectCleanup = this.client.onReconnect(() => {
      this.options.onReconnect?.();
    });

    // Execute the subscription
    this.cleanup = this.client.executeSubscription(
      { query: this.config.document, variables: this.config.variables },
      {
        next: (result) => {
          const rawData = result.data?.[this.config.dataKey];
          if (!rawData || !Array.isArray(rawData)) return;

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
                message: `Failed to parse subscription data for "${this.config.dataKey}": ${
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
                this.config.document,
              ),
            );
          } else {
            this.setError(
              new IndexerError({
                category: 'NETWORK',
                code: 'NETWORK_UNKNOWN',
                message: `Subscription error for "${this.config.dataKey}": ${
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

    this.setSubscribed(true);
  }

  private stop(): void {
    this.cleanup?.();
    this.cleanup = null;
    this.reconnectCleanup?.();
    this.reconnectCleanup = null;
    this.setSubscribed(false);
  }

  private setData(newData: T[] | null): void {
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
