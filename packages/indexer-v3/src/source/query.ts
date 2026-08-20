import type { PortalRange } from '@subsquid/pipes';
import {
  evmQuery,
  type EvmFieldSelection,
  type EvmPortalData,
  type EvmQueryBuilder,
} from '@subsquid/pipes/evm';

export const RUNTIME_PROBE_FIELDS = {
  block: {
    number: true,
    hash: true,
    parentHash: true,
    timestamp: true,
  },
  log: {
    address: true,
    topics: true,
    data: true,
    transactionHash: true,
    transactionIndex: true,
    logIndex: true,
  },
} satisfies EvmFieldSelection;

export type RuntimeProbeFields = typeof RUNTIME_PROBE_FIELDS;
export type RuntimeProbeData = EvmPortalData<RuntimeProbeFields>;

function preserveZeroEndBlock(range: PortalRange): PortalRange {
  // Pipes beta.3 treats numeric zero as an absent `to` value. A string survives its parser.
  return range.to === 0 ? { ...range, to: '0' } : range;
}

/**
 * Build the bounded raw-log query used to verify source behavior before domain decoders land.
 * Production domain ingestion will replace this broad query in #383.
 */
export function createRuntimeProbeQuery(range: PortalRange): EvmQueryBuilder<RuntimeProbeFields> {
  return evmQuery()
    .addFields(RUNTIME_PROBE_FIELDS)
    .addLogRequest({ range: preserveZeroEndBlock(range), request: {} });
}
