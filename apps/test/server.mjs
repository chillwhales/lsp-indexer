/**
 * Custom Next.js server with integrated WebSocket proxy.
 *
 * Handles both HTTP requests (via Next.js) and WebSocket upgrades
 * (via @lsp-indexer/next WS proxy) on a single port.
 *
 * Browser connects to ws://host:3000/api/graphql for subscriptions
 * instead of needing a separate port 4000.
 */
import next from 'next';
import { createServer } from 'node:http';
import { parse } from 'node:url';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0');
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((req, res) => {
  handle(req, res, parse(req.url, true));
});

// Start WebSocket proxy on /api/graphql if WS env vars are available
const wsUrl = process.env.INDEXER_WS_URL || process.env.INDEXER_URL;
if (wsUrl) {
  const { createUpgradeHandler } = await import('@lsp-indexer/next/server');
  const { handleUpgrade } = createUpgradeHandler();

  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url);
    if (pathname === '/api/graphql') {
      handleUpgrade(req, socket, head);
    }
    // Don't destroy other upgrades — Next.js HMR uses WebSocket in dev
  });

  console.info(`[ws-proxy] WebSocket proxy enabled at /api/graphql`);
} else {
  console.info(`[ws-proxy] WebSocket proxy disabled (no INDEXER_WS_URL or INDEXER_URL)`);
}

httpServer.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
});
