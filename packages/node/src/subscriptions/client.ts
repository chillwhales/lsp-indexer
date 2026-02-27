import type {
  SubscriptionClient as ISubscriptionClient,
  SubscriptionConfig,
  SubscriptionHookOptions,
  SubscriptionInstance,
} from '@lsp-indexer/types';
import type { Client, FormattedExecutionResult, Sink, SubscribePayload } from 'graphql-ws';
import { createClient } from 'graphql-ws';
import { getClientWsUrl } from '../client';
import { GenericSubscriptionInstance, SubscriptionClientExecutor } from './subscription-instance';

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
 * This class is designed to be extended by React and Next.js specific implementations
 * that can override URL and header generation.
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
  private subscriptions = new Set<GenericSubscriptionInstance<any>>();

  constructor(url?: string) {
    this.url = url ?? this.getConnectionUrl();

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
   */
  createSubscription<T>(
    config: SubscriptionConfig<T>,
    options?: SubscriptionHookOptions<T>,
  ): SubscriptionInstance<T> {
    const subscription = new GenericSubscriptionInstance(this, config, options);
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
   * Execute a GraphQL subscription via the WebSocket connection.
   * Creates the graphql-ws client lazily on first call.
   *
   * @internal Used by GenericSubscriptionInstance
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
  // Protected methods for subclasses to override
  // ---------------------------------------------------------------------------

  /**
   * Get the WebSocket URL for connections.
   * Subclasses can override this to provide custom URLs (e.g., proxy URLs for Next.js).
   */
  protected getConnectionUrl(): string {
    return getClientWsUrl();
  }

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

    const baseUrl = this.url;
    const finalUrl = this.transformUrl(baseUrl);
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
