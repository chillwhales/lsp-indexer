import { evmPortalStream, type EvmOutputs } from '@subsquid/pipes/evm';
import type { RuntimeConfig } from '../config/index.js';

type EvmPortalStreamOptions<Out extends EvmOutputs> = Parameters<typeof evmPortalStream<Out>>[0];

export interface NetworkStreamOptions<Out extends EvmOutputs> {
  runtime: RuntimeConfig;
  outputs: Out;
  logger?: EvmPortalStreamOptions<Out>['logger'];
  metrics?: EvmPortalStreamOptions<Out>['metrics'];
  profiler?: EvmPortalStreamOptions<Out>['profiler'];
  progress?: EvmPortalStreamOptions<Out>['progress'];
}

/** Create an EVM Portal stream with a stable, network-specific cursor identity. */
export function createNetworkStream<Out extends EvmOutputs>(
  options: NetworkStreamOptions<Out>,
): ReturnType<typeof evmPortalStream<Out>> {
  return evmPortalStream({
    id: options.runtime.streamId,
    portal: options.runtime.portalUrl,
    outputs: options.outputs,
    ...(options.logger == null ? {} : { logger: options.logger }),
    ...(options.metrics == null ? {} : { metrics: options.metrics }),
    ...(options.profiler == null ? {} : { profiler: options.profiler }),
    ...(options.progress == null ? {} : { progress: options.progress }),
  });
}
