import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import WebSocket, { type RawData, WebSocketServer } from 'ws';
import { createProxyServer } from '../subscriptions/proxy';

const ORIGIN = 'https://app.example';

async function listen(server: Server): Promise<number> {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return (server.address() as AddressInfo).port;
}

async function closeServer(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function closeWebSocketServer(server: WebSocketServer): Promise<void> {
  for (const client of server.clients) client.terminate();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

function rawDataText(data: RawData): string {
  if (Array.isArray(data)) return Buffer.concat(data).toString();
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString();
  return data.toString();
}

describe('v3 WebSocket proxy', () => {
  it('preserves the GraphQL protocol and explicit network variables bidirectionally', async () => {
    const upstream = new WebSocketServer({ port: 0 });
    await once(upstream, 'listening');
    const upstreamPort = (upstream.address() as AddressInfo).port;
    upstream.on('connection', (socket) => {
      socket.on('message', (data, isBinary) => socket.send(data, { binary: isBinary }));
    });

    const proxy = createProxyServer({
      wsUrl: `ws://127.0.0.1:${upstreamPort}`,
      allowedOrigins: [ORIGIN],
    });
    const proxyPort = await listen(proxy.server);
    const client = new WebSocket(`ws://127.0.0.1:${proxyPort}`, 'graphql-transport-ws', {
      origin: ORIGIN,
    });

    try {
      await once(client, 'open');
      expect(client.protocol).toBe('graphql-transport-ws');

      const payload = {
        id: 'network-subscription',
        type: 'subscribe',
        payload: {
          query: 'subscription V3Blocks($where: block_bool_exp) { items: block { id } }',
          variables: {
            where: { _and: [{ network: { _eq: 'ethereum-mainnet' } }] },
          },
        },
      };
      const message = new Promise<RawData>((resolve) => client.once('message', resolve));
      client.send(JSON.stringify(payload));
      const data = await message;

      expect(JSON.parse(rawDataText(data))).toEqual(payload);
    } finally {
      client.terminate();
      await closeWebSocketServer(proxy.wss);
      await closeServer(proxy.server);
      await closeWebSocketServer(upstream);
    }
  });

  it('rejects missing or unapproved browser origins before opening upstream', async () => {
    const proxy = createProxyServer({
      wsUrl: 'ws://127.0.0.1:9',
      allowedOrigins: [ORIGIN],
    });
    const proxyPort = await listen(proxy.server);
    const client = new WebSocket(`ws://127.0.0.1:${proxyPort}`, 'graphql-transport-ws', {
      origin: 'https://attacker.example',
    });

    try {
      const status = await new Promise<number>((resolve, reject) => {
        client.once('unexpected-response', (_request, response) =>
          resolve(response.statusCode ?? 0),
        );
        client.once('open', () => reject(new Error('proxy accepted an unapproved origin')));
        client.once('error', () => undefined);
      });
      expect(status).toBe(403);
    } finally {
      client.terminate();
      await closeWebSocketServer(proxy.wss);
      await closeServer(proxy.server);
    }
  });

  it('reports live connection capacity through the health endpoint', async () => {
    const proxy = createProxyServer({
      wsUrl: 'ws://127.0.0.1:9',
      allowedOrigins: [ORIGIN],
    });
    const proxyPort = await listen(proxy.server);

    try {
      await expect(
        fetch(`http://127.0.0.1:${proxyPort}/health`).then((response) => response.json()),
      ).resolves.toEqual({ status: 'ok', connections: 0 });
    } finally {
      await closeWebSocketServer(proxy.wss);
      await closeServer(proxy.server);
    }
  });
});
