import { getServerWsUrl } from '@lsp-indexer/node';
import { type IncomingMessage, createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum pending messages before dropping (during upstream handshake). */
const MAX_PENDING_MESSAGES = 10;

/** Default max payload per WebSocket frame (64 KB — generous for GraphQL). */
const DEFAULT_MAX_PAYLOAD = 64 * 1024;

/** Default maximum concurrent client connections. */
const DEFAULT_MAX_CONNECTIONS = 100;

/** Upstream WebSocket connection timeout (ms). */
const UPSTREAM_CONNECT_TIMEOUT_MS = 10_000;

/**
 * WebSocket close codes reserved per RFC 6455 §7.4.1.
 * These MUST NOT appear in an application-sent Close frame.
 */
const RESERVED_CLOSE_CODES = new Set([1005, 1006, 1015]);

/**
 * Application-level close code for upstream errors.
 * Uses the private-use range (4000–4999) to avoid colliding with
 * protocol-reserved codes.
 */
const CLOSE_UPSTREAM_ERROR = 4502;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

  /**
   * Maximum payload size per WebSocket frame in bytes.
   * Protects against oversized messages exhausting server memory.
   * @default 65536 (64 KB)
   */
  maxPayload?: number;

  /**
   * Maximum concurrent client connections.
   * New connections beyond this limit are rejected with HTTP 503 (Service Unavailable).
   * @default 100
   */
  maxConnections?: number;

  /**
   * Optional structured logger. Falls back to `console` if not provided.
   * Use this to integrate with your application's logging framework and
   * avoid leaking upstream URLs or error details to stdout.
   */
  logger?: ProxyLogger;
}

/** Logger interface accepted by the proxy. */
export interface ProxyLogger {
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
 * Sanitize a WebSocket close code so it is safe to send in a Close frame.
 *
 * Per RFC 6455 §7.4.1, codes 1005 (No Status), 1006 (Abnormal Closure),
 * and 1015 (TLS Handshake Failure) are internal-only and must never be
 * transmitted. Codes below 1000 are also invalid.
 *
 * Returns 1000 (Normal Closure) for any reserved/invalid code.
 */
function sanitizeCloseCode(code: number | undefined): number {
  if (!code || code < 1000 || RESERVED_CLOSE_CODES.has(code)) return 1000;
  return code;
}

// ---------------------------------------------------------------------------
// Proxy Server
// ---------------------------------------------------------------------------

/**
 * Create a standalone WebSocket proxy server that forwards connections
 * to the upstream GraphQL endpoint.
 *
 * The proxy:
 * 1. Validates the `Origin` header against `INDEXER_ALLOWED_ORIGINS`
 * 2. Enforces connection and payload limits to prevent abuse
 * 3. Negotiates the `graphql-transport-ws` subprotocol
 * 4. Forwards all WebSocket frames bidirectionally (protocol-agnostic)
 * 5. Buffers client messages until the upstream connection is ready (bounded)
 * 6. Propagates close and error events in both directions
 *
 * **Security model:** Origin-based access control. The proxy validates the
 * `Origin` header to prevent cross-origin connections from unauthorized
 * domains. This protects against browser-based abuse but does NOT prevent
 * programmatic clients from forging headers. For production deployments
 * facing the public internet, add application-level authentication upstream.
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
  const maxPayload = options.maxPayload ?? DEFAULT_MAX_PAYLOAD;
  const maxConnections = options.maxConnections ?? DEFAULT_MAX_CONNECTIONS;
  const log: ProxyLogger = options.logger ?? console;

  /** Track live client sockets in a Set so the count is always correct by
   *  construction — no manual increment/decrement that can drift on error paths. */
  const activeClients = new Set<WebSocket>();

  const server = createServer((req, res) => {
    // Health check endpoint for load balancers / monitoring
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', connections: activeClients.size }));
      return;
    }

    res.writeHead(426, { 'Content-Type': 'text/plain', Upgrade: 'websocket' });
    res.end('This endpoint only accepts WebSocket connections.');
  });

  const wss = new WebSocketServer({
    server,
    maxPayload,

    // Negotiate the graphql-transport-ws subprotocol so graphql-ws
    // clients don't reject the connection with code 4406.
    handleProtocols: (protocols) => {
      if (protocols.has('graphql-transport-ws')) return 'graphql-transport-ws';
      return false;
    },

    // Origin-based access control: reject requests from unknown origins
    // and requests without an Origin header (non-browser clients).
    // Also enforces the maximum connection limit.
    verifyClient: (
      info: { origin: string; secure: boolean; req: IncomingMessage },
      callback: (res: boolean, code?: number, message?: string) => void,
    ) => {
      if (!isOriginAllowed(info.origin, allowedOrigins)) {
        callback(false, 403, 'Origin not allowed');
        return;
      }
      if (activeClients.size >= maxConnections) {
        callback(false, 503, 'Too many connections');
        return;
      }
      callback(true);
    },
  });

  wss.on('connection', (clientWs) => {
    activeClients.add(clientWs);

    // Open upstream connection with the same subprotocol the client negotiated.
    const upstream = new WebSocket(wsUrl, clientWs.protocol || undefined, {
      maxPayload,
    });

    // Buffer client messages until upstream is ready to prevent
    // dropping the initial connection_init frame.
    // Bounded to MAX_PENDING_MESSAGES to prevent memory exhaustion.
    const pending: (Buffer | ArrayBuffer | Buffer[])[] = [];
    let upstreamReady = false;

    // Timeout for upstream connection — close client if upstream never connects
    const connectTimeout = setTimeout(() => {
      if (!upstreamReady) {
        log.error('[ws-proxy] Upstream connection timeout');
        clientWs.close(CLOSE_UPSTREAM_ERROR, 'Upstream connection timeout');
        upstream.close();
      }
    }, UPSTREAM_CONNECT_TIMEOUT_MS);

    upstream.on('open', () => {
      upstreamReady = true;
      clearTimeout(connectTimeout);
      for (const msg of pending) {
        upstream.send(msg);
      }
      pending.length = 0;
    });

    // Forward: client → upstream
    clientWs.on('message', (data, isBinary) => {
      if (upstreamReady && upstream.readyState === WebSocket.OPEN) {
        upstream.send(data, { binary: isBinary });
      } else if (!upstreamReady && pending.length < MAX_PENDING_MESSAGES) {
        pending.push(data);
      }
      // Messages beyond MAX_PENDING_MESSAGES are silently dropped.
      // The graphql-ws client will retry the connection_init if needed.
    });

    // Forward: upstream → client
    upstream.on('message', (data, isBinary) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: isBinary });
      }
    });

    // Close propagation — sanitize codes to avoid sending reserved values.
    // Set.delete() is idempotent, so the count stays correct regardless of
    // how many times close fires or which side triggers it.
    clientWs.on('close', (code, reason) => {
      clearTimeout(connectTimeout);
      activeClients.delete(clientWs);
      upstream.close(sanitizeCloseCode(code), reason);
    });

    upstream.on('close', (code) => {
      clearTimeout(connectTimeout);
      activeClients.delete(clientWs);
      // Redact upstream close reason — it may contain internal details
      // (table names, connection strings) from the upstream service.
      clientWs.close(sanitizeCloseCode(code), 'Upstream closed');
    });

    // Error handling: close the other side with a private-use code
    // so graphql-ws client-side retry logic kicks in.
    clientWs.on('error', (err) => {
      log.error('[ws-proxy] Client WebSocket error', err.message);
      upstream.close();
    });

    upstream.on('error', (err) => {
      log.error('[ws-proxy] Upstream WebSocket error', err.message);
      clientWs.close(CLOSE_UPSTREAM_ERROR, 'Upstream connection error');
    });
  });

  return { server, wss };
}
