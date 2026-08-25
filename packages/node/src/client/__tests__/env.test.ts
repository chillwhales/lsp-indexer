import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IndexerError } from '../../errors';
import {
  getClientNetwork,
  getClientUrl,
  getClientWsUrl,
  getServerNetwork,
  getServerUrl,
  getServerWsUrl,
} from '../env';

const ENV_NAMES = [
  'INDEXER_NETWORK',
  'INDEXER_URL',
  'INDEXER_WS_URL',
  'NEXT_PUBLIC_INDEXER_NETWORK',
  'NEXT_PUBLIC_INDEXER_URL',
  'NEXT_PUBLIC_INDEXER_WS_URL',
] as const;
const originalEnv = Object.fromEntries(ENV_NAMES.map((name) => [name, process.env[name]]));

beforeEach(() => {
  for (const name of ENV_NAMES) delete process.env[name];
});

afterEach(() => {
  for (const name of ENV_NAMES) {
    const value = originalEnv[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe('v3 environment configuration', () => {
  it('requires an explicit valid network on both client and server', () => {
    expect(() => getClientNetwork()).toThrow(IndexerError);
    process.env.NEXT_PUBLIC_INDEXER_NETWORK = 'Invalid Network';
    expect(() => getClientNetwork()).toThrowError(/lowercase network slug/);
    process.env.NEXT_PUBLIC_INDEXER_NETWORK = 'lukso-mainnet';
    expect(getClientNetwork()).toBe('lukso-mainnet');
    expect(getServerNetwork()).toBe('lukso-mainnet');
    process.env.INDEXER_NETWORK = 'lukso-testnet';
    expect(getServerNetwork()).toBe('lukso-testnet');
  });

  it('selects explicit server endpoints and otherwise uses public endpoints', () => {
    process.env.NEXT_PUBLIC_INDEXER_URL = 'https://public.example/v1/graphql';
    expect(getClientUrl()).toBe('https://public.example/v1/graphql');
    expect(getServerUrl()).toBe('https://public.example/v1/graphql');
    process.env.INDEXER_URL = 'http://private.example/v1/graphql';
    expect(getServerUrl()).toBe('http://private.example/v1/graphql');
  });

  it('rejects missing, malformed, and non-HTTP query endpoints', () => {
    expect(() => getClientUrl()).toThrowError(/NEXT_PUBLIC_INDEXER_URL is not set/);
    expect(() => getServerUrl()).toThrowError(/Neither INDEXER_URL/);
    process.env.NEXT_PUBLIC_INDEXER_URL = 'not a url';
    expect(() => getClientUrl()).toThrow(IndexerError);
    process.env.NEXT_PUBLIC_INDEXER_URL = 'ftp://indexer.example/graphql';
    expect(() => getClientUrl()).toThrow(IndexerError);
    process.env.INDEXER_URL = 'file:///tmp/graphql';
    expect(() => getServerUrl()).toThrow(IndexerError);
  });

  it('validates explicit WebSocket endpoints or derives them from HTTP', () => {
    process.env.NEXT_PUBLIC_INDEXER_URL = 'https://public.example/v1/graphql';
    process.env.INDEXER_URL = 'http://private.example/v1/graphql';
    expect(getClientWsUrl()).toBe('wss://public.example/v1/graphql');
    expect(getServerWsUrl()).toBe('ws://private.example/v1/graphql');

    process.env.NEXT_PUBLIC_INDEXER_WS_URL = 'ws://public.example/subscriptions';
    process.env.INDEXER_WS_URL = 'wss://private.example/subscriptions';
    expect(getClientWsUrl()).toBe('ws://public.example/subscriptions');
    expect(getServerWsUrl()).toBe('wss://private.example/subscriptions');

    process.env.NEXT_PUBLIC_INDEXER_WS_URL = 'https://public.example/subscriptions';
    process.env.INDEXER_WS_URL = 'ftp://private.example/subscriptions';
    expect(() => getClientWsUrl()).toThrow(IndexerError);
    expect(() => getServerWsUrl()).toThrow(IndexerError);
  });
});
