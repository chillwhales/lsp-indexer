import { getServerWsUrl } from '@lsp-indexer/node';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

/**
 * Options for the WebSocket proxy server.
 */
export interface ProxyOptions {
  /**
   * WebSocket URL for the upstream GraphQL endpoint (e.g. Hasura).
   * Defaults to `getServerWsUrl()` from `@lsp-indexer/node`
   * (reads `INDEXER_WS_URL` or derives from `INDEXER_URL`).
   */
  wsUrl?: string;

  /**
   * Allowed origins for WebSocket connections.
   * Only browser requests whose `Origin` header matches one of these
   * values will be accepted. Connections with a missing `Origin` header
   * are always rejected (non-browser clients should connect to the
   * upstream GraphQL endpoint directly).
   *
   * Defaults to `INDEXER_ALLOWED_ORIGINS` env var (comma-separated).
   * If neither this option nor the env var is set, the server will
   * throw at startup to prevent running without origin restrictions.
   *
   * @example ['https://myapp.com', 'https://staging.myapp.com']
   */
  allowedOrigins?: string[];
}

/**
 * Normalize an origin string: trim whitespace, strip trailing slashes,
 * and lowercase the scheme + host portion.
 */
function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '').toLowerCase();
}

/**
 * Parse allowed origins from the options or environment variable.
 * Throws if no origins are configured.
 */
function resolveAllowedOrigins(options: ProxyOptions): string[] {
  const raw = options.allowedOrigins ?? process.env.INDEXER_ALLOWED_ORIGINS?.split(',');

  if (!raw || raw.length === 0) {
    throw new Error(
      'WebSocket proxy requires allowed origins to be configured. ' +
        'Set the INDEXER_ALLOWED_ORIGINS environment variable (comma-separated) ' +
        'or pass allowedOrigins in ProxyOptions.',
    );
  }

  return raw.map(normalizeOrigin).filter(Boolean);
}

/**
 * Check whether a request's Origin header matches the allowed origins.
 * Rejects requests with no Origin header (non-browser clients).
 */
function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(normalizeOrigin(origin));
}

/**
 * Create a standalone WebSocket proxy server that forwards connections
 * to the upstream GraphQL endpoint.
 *
 * The proxy:
 * 1. Validates the `Origin` header against `INDEXER_ALLOWED_ORIGINS`
 * 2. Negotiates the `graphql-transport-ws` subprotocol
 * 3. Forwards all WebSocket frames bidirectionally (protocol-agnostic)
 * 4. Buffers client messages until the upstream connection is ready
 * 5. Propagates close and error events in both directions
 *
 * @example
 * ```ts
 * import { createProxyServer } from '@lsp-indexer/next/server';
 *
 * const { server } = createProxyServer();
 * server.listen(4000, () => console.log('WS proxy on :4000'));
 * ```
 */
export function createProxyServer(options: ProxyOptions = {}) {
  const wsUrl = options.wsUrl ?? getServerWsUrl();
  const allowedOrigins = resolveAllowedOrigins(options);

  const server = createServer((_req, res) => {
    res.writeHead(426, { 'Content-Type': 'text/plain', Upgrade: 'websocket' });
    res.end('This endpoint only accepts WebSocket connections.');
  });

  const wss = new WebSocketServer({
    server,

    // Negotiate the graphql-transport-ws subprotocol so graphql-ws
    // clients don't reject the connection with code 4406.
    handleProtocols: (protocols) => {
      if (protocols.has('graphql-transport-ws')) return 'graphql-transport-ws';
      return false;
    },

    // Origin-based access control: reject requests from unknown origins
    // and requests without an Origin header (non-browser clients).
    verifyClient: (info: { origin: string; secure: boolean; req: unknown }) =>
      isOriginAllowed(info.origin, allowedOrigins),
  });

  wss.on('connection', (clientWs) => {
    // Open upstream connection with the same subprotocol the client negotiated.
    const upstream = new WebSocket(wsUrl, clientWs.protocol || undefined);

    // Buffer client messages until upstream is ready to prevent
    // dropping the initial connection_init frame.
    const pending: (Buffer | ArrayBuffer | Buffer[])[] = [];
    let upstreamReady = false;

    upstream.on('open', () => {
      upstreamReady = true;
      for (const msg of pending) {
        upstream.send(msg);
      }
      pending.length = 0;
    });

    // Forward: client → upstream
    clientWs.on('message', (data, isBinary) => {
      if (upstreamReady && upstream.readyState === WebSocket.OPEN) {
        upstream.send(data, { binary: isBinary });
      } else if (!upstreamReady) {
        pending.push(data);
      }
    });

    // Forward: upstream → client
    upstream.on('message', (data, isBinary) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: isBinary });
      }
    });

    // Close propagation
    clientWs.on('close', (code, reason) => {
      upstream.close(code, reason);
    });

    upstream.on('close', (code, reason) => {
      clientWs.close(code, reason);
    });

    // Error handling: close the other side with 1014 (Bad Gateway)
    // so graphql-ws client-side retry logic kicks in.
    clientWs.on('error', (err) => {
      console.error('[ws-proxy] Client error:', err.message);
      upstream.close();
    });

    upstream.on('error', (err) => {
      console.error('[ws-proxy] Upstream error:', err.message);
      clientWs.close(1014, 'Upstream connection error');
    });
  });

  return { server, wss };
}
