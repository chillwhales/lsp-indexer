/**
 * Next.js instrumentation hook — runs once at server startup.
 *
 * Starts the WebSocket proxy server so the Next.js subscription provider
 * can connect through the proxy to the upstream Hasura WS.
 *
 * Only runs in the Node.js runtime (not Edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { createProxyServer } = await import('@lsp-indexer/next/server');

    const port = Number(process.env.WS_PROXY_PORT) || 4000;

    const { server } = createProxyServer({
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        `http://localhost:${port}`,
      ],
    });

    server.listen(port, () => {
      console.info(`[ws-proxy] WebSocket proxy listening on :${port}`);
    });
  }
}
