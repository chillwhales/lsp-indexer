import {
  evmStream,
  type EvmOutputs,
  type EvmStreamOptions,
  type EvmStreamSource,
} from '@subsquid/pipes/evm';
import type { RuntimeConfig } from '../config/index.js';

export interface NetworkStreamOptions<Out extends EvmOutputs> {
  runtime: RuntimeConfig;
  outputs: Out;
  logger?: EvmStreamOptions<Out>['logger'];
  metrics?: EvmStreamOptions<Out>['metrics'];
  profiler?: EvmStreamOptions<Out>['profiler'];
  progress?: EvmStreamOptions<Out>['progress'];
}

/** Build the official Pipes source declaration for one production network. */
export function createNetworkSource(runtime: RuntimeConfig): EvmStreamSource {
  const rpc = {
    type: 'rpc' as const,
    name: `${runtime.network.key}:rpc`,
    url: runtime.rpcUrl,
    rateLimit: runtime.sourceFallback.rpcRateLimit,
    requestTimeout: 30_000,
    retryInternalServerErrors: true,
  };

  if (runtime.sourceMode === 'rpc') return [rpc];
  if (runtime.sourceMode === 'portal') return runtime.portalUrl;

  return [
    {
      type: 'portal',
      name: `${runtime.network.key}:portal`,
      url: runtime.portalUrl,
      finalized: !runtime.network.portal.expectedRealtime,
    },
    rpc,
  ];
}

/** Create an EVM stream with a stable, network-specific cursor identity and source fallback. */
export function createNetworkStream<Out extends EvmOutputs>(
  options: NetworkStreamOptions<Out>,
): ReturnType<typeof evmStream<Out>> {
  return evmStream({
    id: options.runtime.streamId,
    source: createNetworkSource(options.runtime),
    outputs: options.outputs,
    ...(options.runtime.sourceMode === 'fallback'
      ? {
          fallback: {
            sourceRetries: options.runtime.sourceFallback.sourceRetries,
            detection: {
              maxStalenessMs: options.runtime.sourceFallback.maxStalenessMs,
              maxLagBlocks: options.runtime.sourceFallback.maxLagBlocks,
            },
            strategy: {
              preferPrimary: 'eager' as const,
              allDownTimeoutMs: options.runtime.sourceFallback.allDownTimeoutMs,
            },
          },
        }
      : {}),
    ...(options.logger == null ? {} : { logger: options.logger }),
    ...(options.metrics == null ? {} : { metrics: options.metrics }),
    ...(options.profiler == null ? {} : { profiler: options.profiler }),
    ...(options.progress == null ? {} : { progress: options.progress }),
  });
}
