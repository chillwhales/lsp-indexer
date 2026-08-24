import type { RuntimeConfig } from '../config/index.js';
import {
  createBlockId,
  createEventId,
  normalizeAddress,
  normalizeBytes32,
} from '../db/identity.js';
import {
  getEventDescriptor,
  MalformedEventPayloadError,
  normalizeHexBytes,
  type EventDescriptor,
  type EventDomain,
  type EventName,
} from './catalog.js';
import type { EventIngestionBlock, EventIngestionLog } from './query.js';

export interface EventSourceBlock {
  header: EventIngestionBlock['header'];
  logs: EventIngestionLog[];
}

export interface EventBlockRecord {
  id: string;
  network: string;
  chainId: number;
  number: number;
  hash: string;
  parentHash: string;
  timestamp: Date;
}

export interface EventFactRecord {
  id: string;
  network: string;
  chainId: number;
  blockNumber: number;
  blockHash: string;
  parentHash: string;
  blockTimestamp: Date;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  address: string;
  topic0: string;
  topics: string[];
  data: string;
  eventName: EventName;
  eventDomain: EventDomain;
  decoded: Record<string, unknown> | null;
}

export interface EventIngestionBatch {
  blocks: EventBlockRecord[];
  events: EventFactRecord[];
  decodedEvents: number;
  malformedEvents: number;
}

function assertNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}

function createBlockTimestamp(value: number): Date {
  assertNonNegativeSafeInteger(value, 'block timestamp');
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error('block timestamp must be representable as a JavaScript date');
  }
  return timestamp;
}

function createBlockRecord(runtime: RuntimeConfig, block: EventSourceBlock): EventBlockRecord {
  const { number, hash, parentHash, timestamp } = block.header;
  assertNonNegativeSafeInteger(number, 'block number');

  return {
    id: createBlockId(runtime.network.chainId, number),
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    number,
    hash: normalizeBytes32(hash, 'block hash'),
    parentHash: normalizeBytes32(parentHash, 'parent block hash'),
    timestamp: createBlockTimestamp(timestamp),
  };
}

function isDescriptorEnabled(
  runtime: RuntimeConfig,
  descriptor: EventDescriptor,
  blockNumber: number,
  address: string,
): boolean {
  if (descriptor.scope === 'global') return true;

  const deployment =
    descriptor.scope === 'lsp23Factory'
      ? runtime.network.contracts.lsp23Factory
      : runtime.network.contracts.lsp26FollowerSystem;
  if (deployment == null || blockNumber < deployment.fromBlock) return false;

  return address === normalizeAddress(deployment.address);
}

/** Convert one supported Portal log into a deterministic raw fact, retaining ABI failures. */
export function decodeEventFact(
  runtime: RuntimeConfig,
  block: EventSourceBlock,
  log: EventIngestionLog,
): EventFactRecord | null {
  const rawTopic0 = log.topics.at(0);
  if (rawTopic0 == null) return null;
  const descriptor = getEventDescriptor(rawTopic0);
  if (descriptor == null) return null;

  const address = normalizeAddress(log.address);
  if (!isDescriptorEnabled(runtime, descriptor, block.header.number, address)) return null;

  assertNonNegativeSafeInteger(block.header.number, 'block number');
  assertNonNegativeSafeInteger(log.transactionIndex, 'transaction index');
  assertNonNegativeSafeInteger(log.logIndex, 'log index');

  const blockHash = normalizeBytes32(block.header.hash, 'block hash');
  const parentHash = normalizeBytes32(block.header.parentHash, 'parent block hash');
  const transactionHash = normalizeBytes32(log.transactionHash, 'transaction hash');
  const topics = log.topics.map((topic, index) => normalizeBytes32(topic, `topic ${index}`));
  const data = normalizeHexBytes(log.data, 'event data');
  const blockTimestamp = createBlockTimestamp(block.header.timestamp);

  let decoded: Record<string, unknown> | null = null;
  try {
    decoded = descriptor.decode({ topics, data });
  } catch (error) {
    if (!(error instanceof MalformedEventPayloadError)) throw error;
    // A known, syntactically valid raw log remains auditable even when its ABI payload is invalid.
  }

  return {
    id: createEventId(
      runtime.network.chainId,
      block.header.number,
      log.transactionIndex,
      log.logIndex,
    ),
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    blockNumber: block.header.number,
    blockHash,
    parentHash,
    blockTimestamp,
    transactionHash,
    transactionIndex: log.transactionIndex,
    logIndex: log.logIndex,
    address,
    topic0: topics[0] ?? normalizeBytes32(rawTopic0, 'topic 0'),
    topics,
    data,
    eventName: descriptor.eventName,
    eventDomain: descriptor.eventDomain,
    decoded,
  };
}

function compareFacts(left: EventFactRecord, right: EventFactRecord): number {
  return (
    left.blockNumber - right.blockNumber ||
    left.transactionIndex - right.transactionIndex ||
    left.logIndex - right.logIndex
  );
}

function assertEquivalentDuplicate<T>(current: T, next: T, id: string, kind: string): void {
  if (JSON.stringify(current) !== JSON.stringify(next)) {
    throw new Error(`Conflicting ${kind} records share deterministic ID ${id}`);
  }
}

/** Normalize an unordered Portal batch into canonical block/log order with duplicate protection. */
export function decodeEventBatch(
  runtime: RuntimeConfig,
  data: readonly EventSourceBlock[],
): EventIngestionBatch {
  const blockRecords = new Map<string, EventBlockRecord>();
  const eventRecords = new Map<string, EventFactRecord>();

  for (const block of data) {
    const blockRecord = createBlockRecord(runtime, block);
    const existingBlock = blockRecords.get(blockRecord.id);
    if (existingBlock == null) {
      blockRecords.set(blockRecord.id, blockRecord);
    } else {
      assertEquivalentDuplicate(existingBlock, blockRecord, blockRecord.id, 'block');
    }

    for (const log of block.logs) {
      const event = decodeEventFact(runtime, block, log);
      if (event == null) continue;

      const existingEvent = eventRecords.get(event.id);
      if (existingEvent == null) {
        eventRecords.set(event.id, event);
      } else {
        assertEquivalentDuplicate(existingEvent, event, event.id, 'event');
      }
    }
  }

  const blocks = [...blockRecords.values()].sort((left, right) => left.number - right.number);
  const events = [...eventRecords.values()].sort(compareFacts);

  return {
    blocks,
    events,
    decodedEvents: events.filter(({ decoded }) => decoded != null).length,
    malformedEvents: events.filter(({ decoded }) => decoded == null).length,
  };
}
