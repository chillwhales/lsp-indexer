import { getServerWsUrl } from '@lsp-indexer/node';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { createClient } from 'graphql-ws';
import { createServer } from 'http';
import { parse } from 'url';
import WebSocket, { WebSocketServer } from 'ws';

/**
 * Options for the WebSocket proxy handler.
 */
export interface ProxyHandlerOptions {
  /**
   * WebSocket URL for the Hasura GraphQL endpoint.
   * Defaults to `getServerWsUrl()` from `@lsp-indexer/node`.
   */
  wsUrl?: string;
  /**
   * Secret key for client authentication.
   * If not provided, a random key is generated (which means only this server instance can authenticate clients).
   */
  authSecret?: string;
}

/**
 * Client authentication utilities.
 * Generates tokens that prove the client is our official @lsp-indexer/next client.
 */
export class ClientAuth {
  private static readonly TOKEN_HEADER = 'x-lsp-indexer-auth';
  private static readonly NONCE_HEADER = 'x-lsp-indexer-nonce';

  constructor(private secret: string) {}

  /**
   * Generate client authentication token.
   * Client includes this in WebSocket connection headers.
   */
  generateClientToken(): { token: string; nonce: string } {
    const nonce = randomBytes(16).toString('hex');
    const token = createHash('sha256').update(`${this.secret}:${nonce}`).digest('hex');

    return { token, nonce };
  }

  /**
   * Verify client authentication token.
   * Returns true if the client is authorized to connect.
   */
  verifyClientToken(token: string, nonce: string): boolean {
    if (!token || !nonce) return false;

    const expectedToken = createHash('sha256').update(`${this.secret}:${nonce}`).digest('hex');

    const providedBuffer = Buffer.from(token, 'hex');
    const expectedBuffer = Buffer.from(expectedToken, 'hex');

    // Use timing-safe comparison to prevent timing attacks
    return (
      providedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(providedBuffer, expectedBuffer)
    );
  }

  static getHeaders() {
    return {
      TOKEN_HEADER: this.TOKEN_HEADER,
      NONCE_HEADER: this.NONCE_HEADER,
    };
  }
}

/**
 * Create a WebSocket proxy API route handler for Next.js.
 *
 * This creates a WebSocket server that:
 * 1. Accepts WebSocket connections from authenticated @lsp-indexer/next clients
 * 2. Proxies them to the configured Hasura GraphQL WebSocket endpoint
 * 3. Prevents external applications from accessing the GraphQL endpoint directly
 *
 * Usage in Next.js API route (`app/api/graphql/route.ts`):
 * ```ts
 * import { createProxyHandler } from '@lsp-indexer/next/subscriptions/proxy';
 *
 * const handler = createProxyHandler();
 *
 * export { handler as GET };
 * ```
 */
export function createProxyHandler(options: ProxyHandlerOptions = {}) {
  const wsUrl = options.wsUrl ?? getServerWsUrl();
  const authSecret = options.authSecret ?? randomBytes(32).toString('hex');
  const clientAuth = new ClientAuth(authSecret);

  return async function handler(request: Request) {
    const { pathname } = parse(request.url || '', true);

    if (pathname !== '/api/graphql') {
      return new Response('WebSocket proxy only available at /api/graphql', { status: 404 });
    }

    // Check if this is a WebSocket upgrade request
    const upgradeHeader = request.headers.get('upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('This endpoint only accepts WebSocket connections', {
        status: 426,
        headers: { Upgrade: 'websocket' },
      });
    }

    // Verify client authentication
    const token = request.headers.get(ClientAuth.getHeaders().TOKEN_HEADER) || '';
    const nonce = request.headers.get(ClientAuth.getHeaders().NONCE_HEADER) || '';

    if (!clientAuth.verifyClientToken(token, nonce)) {
      return new Response('Unauthorized: Invalid client authentication', { status: 401 });
    }

    // At this point, we need to upgrade the connection to WebSocket
    // Note: This is a simplified example - actual Next.js WebSocket upgrade handling
    // may require different implementation depending on the deployment environment

    return new Response('WebSocket upgrade would happen here', {
      status: 426,
      headers: { Upgrade: 'websocket' },
    });
  };
}

/**
 * Create a standalone WebSocket proxy server for development or custom deployments.
 * This is an alternative to the API route approach.
 */
export function createProxyServer(options: ProxyHandlerOptions = {}) {
  const wsUrl = options.wsUrl ?? getServerWsUrl();
  const authSecret = options.authSecret ?? randomBytes(32).toString('hex');
  const clientAuth = new ClientAuth(authSecret);

  const server = createServer();
  const wss = new WebSocketServer({
    server,
    verifyClient: (info) => {
      const url = new URL(info.req.url || '', `http://${info.req.headers.host}`);

      // Only allow connections to /api/graphql
      if (url.pathname !== '/api/graphql') {
        return false;
      }

      // Verify client authentication
      const token = (info.req.headers[ClientAuth.getHeaders().TOKEN_HEADER] as string) || '';
      const nonce = (info.req.headers[ClientAuth.getHeaders().NONCE_HEADER] as string) || '';

      return clientAuth.verifyClientToken(token, nonce);
    },
  });

  wss.on('connection', (clientWs, request) => {
    // Parse the GraphQL subscription from query params or initial message
    // For now, we'll wait for the client to send the subscription

    let hasuraClient: any = null;
    let hasuraCleanup: (() => void) | null = null;

    clientWs.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'connection_init') {
          // Initialize connection to Hasura
          hasuraClient = createClient({
            url: wsUrl,
            webSocketImpl: WebSocket,
            lazy: false,
            retryAttempts: 5,
            shouldRetry: () => true,
          });

          // Send connection ack back to client
          clientWs.send(JSON.stringify({ type: 'connection_ack' }));
        } else if (message.type === 'start' && hasuraClient) {
          // Start a subscription
          hasuraCleanup = hasuraClient.subscribe(
            { query: message.payload.query, variables: message.payload.variables },
            {
              next: (result: any) => {
                clientWs.send(
                  JSON.stringify({
                    id: message.id,
                    type: 'data',
                    payload: result,
                  }),
                );
              },
              error: (error: any) => {
                clientWs.send(
                  JSON.stringify({
                    id: message.id,
                    type: 'error',
                    payload: error,
                  }),
                );
              },
              complete: () => {
                clientWs.send(
                  JSON.stringify({
                    id: message.id,
                    type: 'complete',
                  }),
                );
              },
            },
          );
        } else if (message.type === 'stop') {
          // Stop the subscription
          hasuraCleanup?.();
          hasuraCleanup = null;
        }
      } catch (error) {
        console.error('WebSocket proxy error:', error);
        clientWs.close(1011, 'Internal server error');
      }
    });

    clientWs.on('close', () => {
      hasuraCleanup?.();
      hasuraClient?.dispose?.();
    });

    clientWs.on('error', (error) => {
      console.error('WebSocket client error:', error);
      hasuraCleanup?.();
      hasuraClient?.dispose?.();
    });
  });

  return { server, wss, clientAuth };
}

/**
 * Get the authentication secret for client connections.
 * In production, this should be a consistent secret (environment variable).
 * In development, it can be generated per server restart.
 */
export function getClientAuthSecret(): string {
  return process.env.LSP_INDEXER_CLIENT_SECRET || randomBytes(32).toString('hex');
}
