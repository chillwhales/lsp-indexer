import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../../config/index.js';
import { createNetworkRpcClient } from '../../rpc/index.js';
import {
  createDevelopmentPipeDefinitions,
  createDevelopmentRunner,
  runNetworkProgram,
  type NetworkProgramContext,
} from '../runner.js';

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyProgram(): Promise<void> {
  return Promise.resolve();
}

describe('network runner', () => {
  it('validates dependencies and passes one network context to a program', async () => {
    const env = { INDEXER_NETWORK: 'ethereum-mainnet' };
    const runtime = loadRuntimeConfig(env);
    const rpc = createNetworkRpcClient(runtime);
    vi.spyOn(rpc, 'getChainId').mockResolvedValue(1);
    vi.spyOn(rpc, 'getCode').mockResolvedValue('0x01');
    const fetchImplementation = vi.fn(
      (): Promise<Response> =>
        Promise.resolve(
          createJsonResponse({
            dataset: 'ethereum-mainnet',
            aliases: [],
            real_time: true,
            start_block: 0,
          }),
        ),
    );
    let receivedContext: NetworkProgramContext | undefined;

    await runNetworkProgram(
      (context): Promise<void> => {
        receivedContext = context;
        return Promise.resolve();
      },
      { env, fetchImplementation, rpc },
    );

    expect(receivedContext?.runtime.network.key).toBe('ethereum-mainnet');
    expect(receivedContext?.readiness.rpcChainId).toBe(1);
    expect(receivedContext?.rpc).toBe(rpc);
  });

  it('builds unique local development definitions', () => {
    const definitions = createDevelopmentPipeDefinitions(
      ['ethereum-mainnet', 'ethereum-sepolia'],
      emptyProgram,
      {},
    );

    expect(definitions.map(({ id }) => id)).toEqual([
      'lsp-indexer:v3:eip155:1',
      'lsp-indexer:v3:eip155:11155111',
    ]);
    expect(definitions.map(({ params }) => params.network)).toEqual([
      'ethereum-mainnet',
      'ethereum-sepolia',
    ]);
  });

  it('rejects empty, duplicate, and invalid local network definitions', () => {
    expect(() => createDevelopmentPipeDefinitions([], emptyProgram)).toThrow('At least one');
    expect(() =>
      createDevelopmentPipeDefinitions(['ethereum-mainnet', 'ethereum-mainnet'], emptyProgram),
    ).toThrow('duplicates');
    expect(() => createDevelopmentPipeDefinitions(['unknown'], emptyProgram)).toThrow(
      'Unknown INDEXER_NETWORK',
    );
  });

  it('constructs a local runner with validated metrics configuration', () => {
    const runner = createDevelopmentRunner(['ethereum-mainnet'], emptyProgram, {
      INDEXER_METRICS_PORT: '9191',
    });

    expect(runner.start).toBeTypeOf('function');
    expect(() =>
      createDevelopmentRunner(['ethereum-mainnet'], emptyProgram, {
        INDEXER_METRICS_PORT: 'invalid',
      }),
    ).toThrow('INDEXER_METRICS_PORT must be a safe integer');
  });
});
