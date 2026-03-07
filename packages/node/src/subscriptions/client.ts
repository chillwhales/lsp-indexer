import type { SubscriptionHookOptions, SubscriptionInstance } from '@lsp-indexer/types';
import type { Client } from 'graphql-ws';
import { createClient } from 'graphql-ws';
import { getClientWsUrl } from '../client';
import { IndexerError } from '../errors';
import { TypedDocumentString } from '../graphql/graphql';
import {
  GenericSubscriptionInstance,
  type SubscriptionClientExecutor,
} from './subscription-instance';
import type { SubscriptionConfig } from './types';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

/**
 * WebSocket subscription client. Manages connection state, reconnection
 * detection, and multiple independent subscription instances.
 *
 * Subclasses (e.g. Next.js) can override `transformUrl()` and
 * `getConnectionParams()` to customise the WebSocket connection.
 */
export class SubscriptionClient implements SubscriptionClientExecutor {
  private wsClient: Client | null = null;
  protected readonly url: string;
  private state: ConnectionState = 'disconnected';
  private listeners = new Set<() => void>();
  private reconnectCallbacks = new Set<() => void>();
  private abruptlyClosed = false;
  private hasConnectedBefore = false;
  private subscriptions = new Set<{ dispose(): void }>();

  /** @param url - WebSocket URL. Defaults to `getClientWsUrl()`. */
  constructor(url?: string) {
    // Resolve URL eagerly — no virtual method call from the constructor.
    // Subclasses must pass their URL via super(url).
    this.url = url ?? getClientWsUrl();

    // Bind methods for stable references (useSyncExternalStore needs stable function refs)
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
    this.getServerSnapshot = this.getServerSnapshot.bind(this);
  }

  get isConnected(): boolean {
    return this.state === 'connected';
  }

  /** Subscribe to connection state changes (useSyncExternalStore). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Current connection state snapshot (useSyncExternalStore). */
  getSnapshot(): ConnectionState {
    return this.state;
  }

  /** Always 'disconnected' — SSR fallback for useSyncExternalStore. */
  getServerSnapshot(): ConnectionState {
    return 'disconnected';
  }

  /** Register a callback for reconnection events. Returns unregister function. */
  onReconnect(cb: () => void): () => void {
    this.reconnectCallbacks.add(cb);
    return () => {
      this.reconnectCallbacks.delete(cb);
    };
  }

  /**
   * Create and start a subscription. The execute closure captures the fully-typed
   * extract/parse pipeline; the returned instance only needs `<TParsed>`.
   */
  createSubscription<TResult, TVariables extends Record<string, unknown>, TRaw, TParsed>(
    config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>,
    options?: SubscriptionHookOptions<TParsed>,
  ): SubscriptionInstance<TParsed> {
    const documentString = config.document.toString();

    // Build the execute closure while all 4 generics are in scope.
    // extract + parse happen inside the closure; the instance only sees TParsed[].
    const execute = (sink: {
      next: (parsed: TParsed[]) => void;
      error: (error: unknown) => void;
      complete: () => void;
    }) =>
      this.executeSubscription(
        { query: config.document, variables: config.variables },
        {
          next: (result) => {
            if (!result.data) return;
            const rawData = config.extract(result.data);
            if (!Array.isArray(rawData) || rawData.length === 0) return;

            try {
              const parsed = config.parser(rawData);
              sink.next(parsed);
            } catch (parseError) {
              sink.error(
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
          error: sink.error,
          complete: sink.complete,
        },
      );

    const subscription = new GenericSubscriptionInstance<TParsed>({
      client: this,
      execute,
      documentString,
      options,
      onDispose: () => {
        this.subscriptions.delete(subscription);
      },
    });
    this.subscriptions.add(subscription);

    return subscription;
  }

  /**
   * Execute a GraphQL subscription via the WebSocket connection.
   * Lazily creates the graphql-ws client. `.toString()` is called here —
   * the last moment before the wire.
   * @internal
   */
  executeSubscription<TResult, TVariables extends Record<string, unknown>>(
    payload: { query: TypedDocumentString<TResult, TVariables>; variables?: TVariables },
    sink: {
      next: (result: { data?: TResult | null }) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): () => void {
    const client = this.getOrCreateClient();
    // graphql-ws Client.subscribe<Data>() is generic — TResult flows through.
    // .toString() is called here — the only place where the document becomes a string.
    return client.subscribe<TResult>(
      { query: payload.query.toString(), variables: payload.variables },
      sink,
    );
  }

  /** Dispose all subscriptions and close the WebSocket connection. */
  dispose(): void {
    // Collect into array first to avoid mutating the Set during iteration
    // (each subscription.dispose() calls onDispose which deletes from the Set).
    const subs = [...this.subscriptions];
    for (const subscription of subs) {
      subscription.dispose();
    }
    this.subscriptions.clear();

    // Then dispose the WebSocket client
    void this.wsClient?.dispose();
    this.wsClient = null;
    this.setState('disconnected');
    this.listeners.clear();
    this.reconnectCallbacks.clear();
    this.abruptlyClosed = false;
    this.hasConnectedBefore = false;
  }

  // ---------------------------------------------------------------------------
  // Protected methods for subclasses to override
  // ---------------------------------------------------------------------------

  /** Override to provide custom headers/auth for the WebSocket connection. */
  protected getConnectionParams(): Record<string, unknown> {
    return {};
  }

  /** Override to transform the URL (e.g. relative → absolute). Called lazily. */
  protected transformUrl(url: string): string {
    return url;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /** Extract close code — graphql-ws types the event as `unknown` to avoid DOM deps. */
  private static getCloseCode(event: unknown): number | undefined {
    if (typeof event !== 'object' || event === null || !('code' in event)) {
      return undefined;
    }
    return typeof event.code === 'number' ? event.code : undefined;
  }

  private getOrCreateClient(): Client {
    if (this.wsClient) return this.wsClient;

    const finalUrl = this.transformUrl(this.url);
    const connectionParams = this.getConnectionParams();

    this.wsClient = createClient({
      url: finalUrl,
      connectionParams,
      lazy: true,
      lazyCloseTimeout: 3000,
      retryAttempts: Infinity,
      shouldRetry: () => true,
      on: {
        connecting: () => {
          this.setState('connecting');
        },
        connected: (_socket, _payload, wasRetry) => {
          if (this.abruptlyClosed || (wasRetry && this.hasConnectedBefore)) {
            this.abruptlyClosed = false;
            this.fireReconnectCallbacks();
          }
          this.hasConnectedBefore = true;
          this.setState('connected');
        },
        closed: (event) => {
          const closeCode = SubscriptionClient.getCloseCode(event);
          if (closeCode !== undefined && closeCode !== 1000) {
            this.abruptlyClosed = true;
          }
          this.setState('disconnected');
        },
      },
    });

    return this.wsClient;
  }

  private setState(newState: ConnectionState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private fireReconnectCallbacks(): void {
    for (const cb of this.reconnectCallbacks) {
      cb();
    }
  }
}
