import { getClientWsUrlOrDerive } from '@lsp-indexer/node';
import type { Client, FormattedExecutionResult, Sink, SubscribePayload } from 'graphql-ws';
import { createClient } from 'graphql-ws';

/**
 * WebSocket connection state for subscription client.
 *
 * - `disconnected` — No active WebSocket connection
 * - `connecting` — WebSocket is establishing a connection
 * - `connected` — WebSocket connection is open and acknowledged
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

/**
 * Wrapper around `graphql-ws` `createClient` that adds:
 *
 * 1. **Connection state tracking** — `disconnected` | `connecting` | `connected`
 * 2. **useSyncExternalStore API** — `subscribe()` / `getSnapshot()` for React integration
 * 3. **Reconnection detection** — fires callbacks when WebSocket reconnects after drop
 * 4. **Lazy connection** — WebSocket only connects on first subscription
 *
 * @example
 * ```ts
 * const client = new SubscriptionClient('wss://indexer.example.com/v1/graphql');
 *
 * // Use with useSyncExternalStore
 * const state = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getServerSnapshot);
 * ```
 */
export class SubscriptionClient {
  private wsClient: Client | null = null;
  private readonly url: string;
  private state: ConnectionState = 'disconnected';
  private listeners = new Set<() => void>();
  private reconnectCallbacks = new Set<() => void>();
  private abruptlyClosed = false;
  private hasConnectedBefore = false;

  constructor(url?: string) {
    this.url = url ?? getClientWsUrlOrDerive();

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
   * Execute a GraphQL subscription via the WebSocket connection.
   * Creates the graphql-ws client lazily on first call.
   *
   * @param payload - GraphQL subscription payload (query + variables)
   * @param sink - Sink to receive next/error/complete events (FormattedExecutionResult from graphql-ws)
   * @returns Cleanup function to unsubscribe
   */
  executeSubscription<Data = Record<string, unknown>, Extensions = unknown>(
    payload: SubscribePayload,
    sink: Sink<FormattedExecutionResult<Data, Extensions>>,
  ): () => void {
    const client = this.getOrCreateClient();
    return client.subscribe(payload, sink);
  }

  /** Dispose of the WebSocket client and reset state */
  dispose(): void {
    this.wsClient?.dispose();
    this.wsClient = null;
    this.setState('disconnected');
    this.abruptlyClosed = false;
    this.hasConnectedBefore = false;
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

    this.wsClient = createClient({
      url: this.url,
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
