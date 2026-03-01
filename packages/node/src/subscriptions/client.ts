import type {
  SubscriptionClient as ISubscriptionClient,
  SubscriptionHookOptions,
  SubscriptionInstance,
} from '@lsp-indexer/types';
import type { Client } from 'graphql-ws';
import { createClient } from 'graphql-ws';
import { getClientWsUrl } from '../client';
import {
  GenericSubscriptionInstance,
  type SubscriptionClientExecutor,
} from './subscription-instance';
import type { SubscriptionConfig } from './types';

/**
 * WebSocket connection state for subscription client.
 *
 * - `disconnected` — No active WebSocket connection
 * - `connecting` — WebSocket is establishing a connection
 * - `connected` — WebSocket connection is open and acknowledged
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

/**
 * Base WebSocket subscription client implementing the common SubscriptionClient interface.
 *
 * Features:
 * 1. **Connection state tracking** — `disconnected` | `connecting` | `connected`
 * 2. **useSyncExternalStore API** — `subscribe()` / `getSnapshot()` for React integration
 * 3. **Reconnection detection** — fires callbacks when WebSocket reconnects after drop
 * 4. **Lazy connection** — WebSocket only connects on first subscription
 * 5. **Multiple subscription management** — each createSubscription() returns an independent instance
 *
 * To customize the connection URL or parameters, pass the desired URL to the
 * constructor. For Next.js, the subclass provides `transformUrl()` to convert
 * relative proxy paths to absolute WebSocket URLs.
 *
 * @example
 * ```ts
 * const client = new SubscriptionClient('wss://indexer.example.com/v1/graphql');
 *
 * // Use with useSyncExternalStore for connection state
 * const connectionState = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getServerSnapshot);
 *
 * // Create individual subscriptions
 * const subscription = client.createSubscription(config, options);
 * ```
 */
export class SubscriptionClient implements ISubscriptionClient, SubscriptionClientExecutor {
  private wsClient: Client | null = null;
  protected readonly url: string;
  private state: ConnectionState = 'disconnected';
  private listeners = new Set<() => void>();
  private reconnectCallbacks = new Set<() => void>();
  private abruptlyClosed = false;
  private hasConnectedBefore = false;
  private subscriptions = new Set<GenericSubscriptionInstance<any, any, any, any>>();

  /**
   * @param url - WebSocket URL. Defaults to `getClientWsUrl()` which reads
   *              `NEXT_PUBLIC_INDEXER_WS_URL` or derives from `NEXT_PUBLIC_INDEXER_URL`.
   *              Subclasses should pass their desired URL to `super(url)` rather
   *              than relying on the default.
   */
  constructor(url?: string) {
    // Resolve URL eagerly — no virtual method call from the constructor.
    // Subclasses must pass their URL via super(url).
    this.url = url ?? getClientWsUrl();

    // Bind methods for stable references (useSyncExternalStore needs stable function refs)
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
    this.getServerSnapshot = this.getServerSnapshot.bind(this);
  }

  /** Whether the WebSocket is currently connected */
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
   * Create and start a subscription using this client's WebSocket transport.
   * Returns a subscription instance that manages the subscription's state.
   *
   * The instance is tracked internally and removed on dispose via the
   * `onDispose` callback — no method monkey-patching required.
   */
  createSubscription<TResult, TVariables extends Record<string, unknown>, TRaw, TParsed>(
    config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>,
    options?: SubscriptionHookOptions<TParsed>,
  ): SubscriptionInstance<TParsed> {
    const subscription = new GenericSubscriptionInstance<TResult, TVariables, TRaw, TParsed>({
      client: this,
      config,
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
   * Creates the graphql-ws client lazily on first call.
   *
   * The `TResult` generic threads through to `graphql-ws` `Client.subscribe<Data>()`
   * so the sink receives fully typed `ExecutionResult<TResult>` — no casts needed.
   *
   * @internal Used by GenericSubscriptionInstance via SubscriptionClientExecutor.
   */
  executeSubscription<TResult>(
    payload: { query: string; variables?: Record<string, unknown> },
    sink: {
      next: (result: { data?: TResult }) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): () => void {
    const client = this.getOrCreateClient();
    // graphql-ws Client.subscribe<Data>() is generic — TResult flows through
    return client.subscribe<TResult>(payload, sink);
  }

  /** Dispose of all subscriptions and close the WebSocket connection */
  dispose(): void {
    // Collect into array first to avoid mutating the Set during iteration
    // (each subscription.dispose() calls onDispose which deletes from the Set).
    const subs = [...this.subscriptions];
    for (const subscription of subs) {
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
  // Protected methods for subclasses to override
  // ---------------------------------------------------------------------------

  /**
   * Get the connection parameters for the WebSocket connection.
   * Subclasses can override this to provide custom headers/auth (e.g., Next.js auth).
   */
  protected getConnectionParams(): Record<string, unknown> {
    return {};
  }

  /**
   * Transform the URL before creating the WebSocket connection.
   * Subclasses can override this to convert relative URLs to absolute ones.
   *
   * Unlike `getConnectionUrl()` (removed), this is NOT called from the
   * constructor — it runs lazily when the first subscription is created.
   */
  protected transformUrl(url: string): string {
    return url;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Extract the close code from a WebSocket close event.
   * graphql-ws types `EventClosedListener` event as `unknown` to avoid DOM deps.
   */
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
