import { parsePortalRange, type PortalRange } from '@subsquid/pipes';
import { EvmQueryBuilder, type EvmFieldSelection, type EvmPortalData } from '@subsquid/pipes/evm';

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

class RuntimeProbeQueryBuilder extends EvmQueryBuilder<RuntimeProbeFields> {
  addAllBlockRequest(range: PortalRange): this {
    this.requests.push({
      range: parsePortalRange(preserveZeroEndBlock(range)),
      request: { includeAllBlocks: true },
    });
    return this;
  }
}

function preserveZeroEndBlock(range: PortalRange): PortalRange {
  // Pipes beta.3 treats numeric zero as an absent `to` value. A string survives its parser.
  return range.to === 0 ? { ...range, to: '0' } : range;
}

/**
 * Build the bounded raw-log query used to verify every block returned by a source range.
 */
export function createRuntimeProbeQuery(range: PortalRange): EvmQueryBuilder<RuntimeProbeFields> {
  const query = new RuntimeProbeQueryBuilder();
  query.addFields(RUNTIME_PROBE_FIELDS);
  query.addAllBlockRequest(range);
  query.addLogRequest({ range: preserveZeroEndBlock(range), request: {} });
  return query;
}
