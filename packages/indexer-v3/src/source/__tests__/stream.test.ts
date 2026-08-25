import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import { createNetworkSource } from '../stream.js';

describe('network source selection', () => {
  it('uses the historical LUKSO Portal followed by the official RPC source', () => {
    const runtime = loadRuntimeConfig({
      INDEXER_NETWORK: 'lukso-mainnet',
      RPC_URL_LUKSO_MAINNET: 'https://rpc.example.test',
    });

    expect(createNetworkSource(runtime)).toEqual([
      {
        type: 'portal',
        name: 'lukso-mainnet:portal',
        url: 'https://portal.sqd.dev/datasets/lukso-mainnet',
        finalized: true,
      },
      {
        type: 'rpc',
        name: 'lukso-mainnet:rpc',
        url: 'https://rpc.example.test',
        rateLimit: 10,
        requestTimeout: 30_000,
        retryInternalServerErrors: true,
      },
    ]);
  });

  it('supports explicit single-source Portal and RPC operation', () => {
    const portal = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_SOURCE_MODE: 'portal',
    });
    const rpc = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_SOURCE_MODE: 'rpc',
    });

    expect(createNetworkSource(portal)).toBe(portal.portalUrl);
    expect(createNetworkSource(rpc)).toEqual([
      expect.objectContaining({ type: 'rpc', url: rpc.rpcUrl }),
    ]);
  });
});
