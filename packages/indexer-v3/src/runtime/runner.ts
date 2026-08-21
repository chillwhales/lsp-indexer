import type { Logger, MetricsServer } from '@subsquid/pipes';
import { devRunner } from '@subsquid/pipes/runtime/node';
import { loadRuntimeConfig, type RuntimeConfig } from '../config/index.js';
import { createNetworkRpcClient, type NetworkRpcClient } from '../rpc/index.js';
import { verifyNetworkReadiness, type NetworkReadiness } from './readiness.js';

export interface NetworkProgramContext {
  runtime: RuntimeConfig;
  readiness: NetworkReadiness;
  rpc: NetworkRpcClient;
  logger?: Logger;
  metrics?: MetricsServer;
}

// Codacy's standalone ESLint profile applies the base rule to type-only parameter names.
// eslint-disable-next-line no-unused-vars
export type NetworkProgram = (context: NetworkProgramContext) => Promise<unknown>;

export interface RunNetworkProgramOptions {
  env?: NodeJS.ProcessEnv;
  logger?: Logger;
  metrics?: MetricsServer;
  fetchImplementation?: typeof fetch;
  rpc?: NetworkRpcClient;
}

export type DevelopmentPipeDefinition = Parameters<
  typeof devRunner<{ network: string }>
>[0][number];

/** Validate one production network and run its pipe program. */
export async function runNetworkProgram(
  program: NetworkProgram,
  options: RunNetworkProgramOptions = {},
): Promise<void> {
  const runtime = loadRuntimeConfig(options.env);
  const rpc = options.rpc ?? createNetworkRpcClient(runtime);
  const readiness = await verifyNetworkReadiness(runtime, {
    rpc,
    ...(options.fetchImplementation == null
      ? {}
      : { fetchImplementation: options.fetchImplementation }),
  });

  await program({
    runtime,
    readiness,
    rpc,
    ...(options.logger == null ? {} : { logger: options.logger }),
    ...(options.metrics == null ? {} : { metrics: options.metrics }),
  });
}

/** Build local-only Pipes runner definitions without sharing production process fate. */
export function createDevelopmentPipeDefinitions(
  networks: readonly string[],
  program: NetworkProgram,
  env: NodeJS.ProcessEnv = process.env,
): DevelopmentPipeDefinition[] {
  if (networks.length === 0) {
    throw new Error('At least one development network is required');
  }

  const uniqueNetworks = new Set(networks);
  if (uniqueNetworks.size !== networks.length) {
    throw new Error('Development network list contains duplicates');
  }

  return networks.map((network) => {
    const runtime = loadRuntimeConfig({ ...env, INDEXER_NETWORK: network });
    return {
      id: runtime.streamId,
      params: { network },
      handler({ logger, metrics }): Promise<unknown> {
        return runNetworkProgram(program, {
          env: { ...env, INDEXER_NETWORK: network },
          logger,
          metrics,
        });
      },
    };
  });
}

/** Create the local development runner supplied by Pipes. Never use this in production. */
export function createDevelopmentRunner(
  networks: readonly string[],
  program: NetworkProgram,
  env: NodeJS.ProcessEnv = process.env,
): ReturnType<typeof devRunner<{ network: string }>> {
  const firstNetwork = networks.at(0);
  if (firstNetwork == null) {
    throw new Error('At least one development network is required');
  }

  const definitions = createDevelopmentPipeDefinitions(networks, program, env);
  const runtime = loadRuntimeConfig({
    ...env,
    INDEXER_NETWORK: firstNetwork,
  });

  return devRunner(definitions, {
    retry: 5,
    metrics: {
      port: runtime.metricsPort,
    },
  });
}
