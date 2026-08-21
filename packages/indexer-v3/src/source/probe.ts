import type { RuntimeConfig } from '../config/index.js';
import { createRuntimeProbeQuery } from './query.js';
import { createNetworkStream, type NetworkStreamOptions } from './stream.js';

type RuntimeProbeOutputs = ReturnType<typeof createRuntimeProbeQuery>;

export interface RuntimeProbeOptions {
  runtime: RuntimeConfig;
  logger?: NetworkStreamOptions<RuntimeProbeOutputs>['logger'];
  metrics?: NetworkStreamOptions<RuntimeProbeOutputs>['metrics'];
}

export interface RuntimeProbeSummary {
  network: string;
  chainId: number;
  streamId: string;
  fromBlock: number;
  toBlock: number;
  firstBlock: number | null;
  lastBlock: number | null;
  batches: number;
  blocks: number;
  logs: number;
  complete: true;
}

/** Fail a bounded source diagnostic unless both requested block boundaries were observed. */
export function assertRuntimeProbeCompleteness(
  expectedFrom: number,
  expectedTo: number,
  firstBlock: number | null,
  lastBlock: number | null,
): void {
  if (firstBlock !== expectedFrom || lastBlock !== expectedTo) {
    throw new Error(
      `Pipes source returned an incomplete range: expected ${expectedFrom}-${expectedTo}, received ${firstBlock ?? 'none'}-${lastBlock ?? 'none'}`,
    );
  }
}

/** Consume a bounded raw-log range to exercise the real Pipes source path. */
export async function runRuntimeProbe(options: RuntimeProbeOptions): Promise<RuntimeProbeSummary> {
  const toBlock = options.runtime.range.to;
  if (toBlock == null) {
    throw new Error('The runtime probe requires INDEXER_TO_BLOCK to prevent an unbounded scan');
  }

  const stream = createNetworkStream({
    runtime: options.runtime,
    outputs: createRuntimeProbeQuery(options.runtime.range),
    ...(options.logger == null ? {} : { logger: options.logger }),
    ...(options.metrics == null ? {} : { metrics: options.metrics }),
  });

  let batches = 0;
  let blocks = 0;
  let logs = 0;
  let firstBlock: number | null = null;
  let lastBlock: number | null = null;
  let expectedBlock = options.runtime.range.from;

  for await (const { data } of stream) {
    batches += 1;
    blocks += data.length;

    for (const block of data) {
      if (block.header.number !== expectedBlock) {
        throw new Error(
          `Pipes source returned a non-contiguous range: expected block ${expectedBlock}, received ${block.header.number}`,
        );
      }

      firstBlock ??= block.header.number;
      lastBlock = block.header.number;
      logs += block.logs.length;
      expectedBlock += 1;
    }
  }

  assertRuntimeProbeCompleteness(options.runtime.range.from, toBlock, firstBlock, lastBlock);

  return {
    network: options.runtime.network.key,
    chainId: options.runtime.network.chainId,
    streamId: options.runtime.streamId,
    fromBlock: options.runtime.range.from,
    toBlock,
    firstBlock,
    lastBlock,
    batches,
    blocks,
    logs,
    complete: true,
  };
}
