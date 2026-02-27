import { IndexerError } from '@lsp-indexer/node';
import type {
  SubscriptionClient as ISubscriptionClient,
  SubscriptionConfig,
  SubscriptionHookOptions,
  SubscriptionInstance,
} from '@lsp-indexer/types';
import type { Client, FormattedExecutionResult, Sink, SubscribePayload } from 'graphql-ws';
import { createClient } from 'graphql-ws';
import { ClientAuth } from './proxy';

/**
 * Individual subscription instance within the Next.js SubscriptionClient.
 * Identical to React implementation but connects through the proxy.
 */
class NextSubscriptionInstance<T> implements SubscriptionInstance<T> {
  private _data: T[] | null = null;
  private _error: unknown = null;
  private _isSubscribed = false;
  private listeners = new Set<() => void>();
  private cleanup: (() => void) | null = null;
  private reconnectCleanup: (() => void) | null = null;

  constructor(
    private client: SubscriptionClient,
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

/**
 * Connection state for Next.js WebSocket proxy client.
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

/**
 * Next.js WebSocket subscription client that connects through the proxy at /api/graphql.
 *
 * This client:
 * 1. Connects to /api/graphql instead of direct GraphQL endpoint (URL hidden)
 * 2. Includes client authentication headers to prevent external abuse
 * 3. Uses the same interface as React client for consistency
 * 4. Manages multiple subscriptions over a single WebSocket connection
 */
export class SubscriptionClient implements ISubscriptionClient {
  private wsClient: Client | null = null;
  private readonly url: string;
  private readonly clientAuth: ClientAuth;
  private state: ConnectionState = 'disconnected';
  private listeners = new Set<() => void>();
  private reconnectCallbacks = new Set<() => void>();
  private abruptlyClosed = false;
  private hasConnectedBefore = false;
  private subscriptions = new Set<NextSubscriptionInstance<any>>();

  constructor(url = '/api/graphql', authSecret?: string) {
    this.url = url;
    this.clientAuth = new ClientAuth(authSecret || this.getDefaultAuthSecret());

    // Bind methods for stable references
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
    this.getServerSnapshot = this.getServerSnapshot.bind(this);
  }

  /** Whether the WebSocket proxy connection is currently connected */
  get isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Subscribe to connection state changes (useSyncExternalStore pattern).
   * Returns an unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Get current connection state snapshot (useSyncExternalStore pattern) */
  getSnapshot(): ConnectionState {
    return this.state;
  }

  /** Server-side snapshot — always disconnected (SSR fallback) */
  getServerSnapshot(): ConnectionState {
    return 'disconnected';
  }

  /**
   * Create and start a subscription using the WebSocket proxy.
   * Returns a subscription instance that manages the subscription's state.
   */
  createSubscription<T>(
    config: SubscriptionConfig<T>,
    options?: SubscriptionHookOptions<T>,
  ): SubscriptionInstance<T> {
    const subscription = new NextSubscriptionInstance(this, config, options);
    this.subscriptions.add(subscription);

    // Remove from set when disposed
    const originalDispose = subscription.dispose.bind(subscription);
    subscription.dispose = () => {
      originalDispose();
      this.subscriptions.delete(subscription);
    };

    return subscription;
  }

  /**
   * Register a callback to fire when the WebSocket reconnects after a disconnect.
   * Returns an unregister function.
   */
  onReconnect(cb: () => void): () => void {
    this.reconnectCallbacks.add(cb);
    return () => {
      this.reconnectCallbacks.delete(cb);
    };
  }

  /**
   * Execute a GraphQL subscription via the WebSocket proxy.
   * Creates the graphql-ws client lazily on first call.
   *
   * @internal Used by NextSubscriptionInstance
   */
  executeSubscription<Data = Record<string, unknown>, Extensions = unknown>(
    payload: SubscribePayload,
    sink: Sink<FormattedExecutionResult<Data, Extensions>>,
  ): () => void {
    const client = this.getOrCreateClient();
    return client.subscribe(payload, sink);
  }

  /** Dispose of all subscriptions and close the WebSocket connection */
  dispose(): void {
    // Dispose all active subscriptions first
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }
    this.subscriptions.clear();

    // Then dispose the WebSocket client
    this.wsClient?.dispose();
    this.wsClient = null;
    this.setState('disconnected');
    this.listeners.clear();
    this.reconnectCallbacks.clear();
    this.abruptlyClosed = false;
    this.hasConnectedBefore = false;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private getDefaultAuthSecret(): string {
    // In client-side Next.js, we need to get the auth secret somehow.
    // This could be from a public env var or fetched from an API endpoint.
    // For now, we'll use a placeholder that indicates this needs configuration.
    return process.env.NEXT_PUBLIC_LSP_INDEXER_CLIENT_SECRET || 'need-to-configure-auth-secret';
  }

  private getOrCreateClient(): Client {
    if (this.wsClient) return this.wsClient;

    // Generate client authentication
    const { token, nonce } = this.clientAuth.generateClientToken();
    const headers = ClientAuth.getHeaders();

    // Convert HTTP/HTTPS URL to WebSocket URL
    const wsUrl = this.url.startsWith('/')
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${this.url}`
      : this.url;

    this.wsClient = createClient({
      url: wsUrl,
      connectionParams: {
        // Include authentication in connection params
        [headers.TOKEN_HEADER]: token,
        [headers.NONCE_HEADER]: nonce,
      },
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
          const closeCode = this.getCloseCode(event);
          if (closeCode !== undefined && closeCode !== 1000) {
            this.abruptlyClosed = true;
          }
          this.setState('disconnected');
        },
      },
    });

    return this.wsClient;
  }

  private getCloseCode(event: unknown): number | undefined {
    if (typeof event !== 'object' || event === null || !('code' in event)) {
      return undefined;
    }
    return typeof event.code === 'number' ? event.code : undefined;
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
