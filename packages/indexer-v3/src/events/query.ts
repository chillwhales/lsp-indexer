import { parsePortalRange, type PortalRange } from '@subsquid/pipes';
import {
  type EvmFieldSelection,
  type EvmPortalData,
  type EvmQueryBuilder,
  EvmQueryBuilder as PipesEvmQueryBuilder,
} from '@subsquid/pipes/evm';
import type { BlockRange, ContractDeployment, RuntimeConfig } from '../config/index.js';
import { normalizeAddress } from '../db/identity.js';
import { GLOBAL_EVENT_TOPICS, LSP23_EVENT_TOPICS, LSP26_EVENT_TOPICS } from './catalog.js';

export const EVENT_INGESTION_FIELDS = {
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

export type EventIngestionFields = typeof EVENT_INGESTION_FIELDS;
export type EventIngestionData = EvmPortalData<EventIngestionFields>;
export type EventIngestionBlock = EventIngestionData[number];
export type EventIngestionLog = EventIngestionBlock['logs'][number];

class EventIngestionQueryBuilder extends PipesEvmQueryBuilder<EventIngestionFields> {
  addAllBlockRequest(range: PortalRange): this {
    this.requests.push({
      range: parsePortalRange(preserveZeroEndBlock(range)),
      request: { includeAllBlocks: true },
    });
    return this;
  }
}

function preserveZeroEndBlock(range: PortalRange): PortalRange {
  // Pipes alpha.22 treats numeric zero as an absent `to` value. A string survives its parser.
  return range.to === 0 ? { ...range, to: '0' } : range;
}

function deploymentRange(
  runtimeRange: BlockRange,
  deployment: ContractDeployment,
): PortalRange | undefined {
  const from = Math.max(runtimeRange.from, deployment.fromBlock);
  if (runtimeRange.to != null && from > runtimeRange.to) return undefined;
  return preserveZeroEndBlock(runtimeRange.to == null ? { from } : { from, to: runtimeRange.to });
}

function addScopedRequest(
  query: EvmQueryBuilder<EventIngestionFields>,
  runtimeRange: BlockRange,
  deployment: ContractDeployment | undefined,
  topic0: readonly string[],
): void {
  if (deployment == null) return;
  const range = deploymentRange(runtimeRange, deployment);
  if (range == null) return;

  query.addLogRequest({
    range,
    request: {
      address: [normalizeAddress(deployment.address)],
      topic0: [...topic0],
    },
  });
}

/** Build the narrow Pipes query for every v2-parity event supported by one configured network. */
export function createEventIngestionQuery(
  runtime: RuntimeConfig,
): EvmQueryBuilder<EventIngestionFields> {
  const query = new EventIngestionQueryBuilder();
  query.addFields(EVENT_INGESTION_FIELDS);
  query.addAllBlockRequest(runtime.range);
  query.addLogRequest({
    range: preserveZeroEndBlock(runtime.range),
    request: { topic0: [...GLOBAL_EVENT_TOPICS] },
  });

  addScopedRequest(
    query,
    runtime.range,
    runtime.network.contracts.lsp23Factory,
    LSP23_EVENT_TOPICS,
  );
  addScopedRequest(
    query,
    runtime.range,
    runtime.network.contracts.lsp26FollowerSystem,
    LSP26_EVENT_TOPICS,
  );

  return query;
}
