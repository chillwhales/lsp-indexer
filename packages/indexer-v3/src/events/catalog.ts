import { normalizeAddress, normalizeBytes32, normalizeTokenId } from '../db/identity.js';
import {
  ERC725X_EVENTS,
  ERC725Y_EVENTS,
  LSP0_EVENTS,
  LSP14_EVENTS,
  LSP23_EVENTS,
  LSP26_EVENTS,
  LSP7_EVENTS,
  LSP8_EVENTS,
} from './abi.js';

const HEX_BYTES_PATTERN = /^0x([0-9a-f]{2})*$/i;
const BYTES4_PATTERN = /^0x[0-9a-f]{8}$/i;

export type EventScope = 'global' | 'lsp23Factory' | 'lsp26FollowerSystem';

export type EventName =
  | 'DataChanged'
  | 'Executed'
  | 'UniversalReceiver'
  | 'Follow'
  | 'Unfollow'
  | 'Transfer'
  | 'OwnershipTransferred'
  | 'TokenIdDataChanged'
  | 'DeployedContracts'
  | 'DeployedERC1167Proxies';

export type EventDomain =
  | 'erc725x'
  | 'erc725y'
  | 'lsp0'
  | 'lsp7'
  | 'lsp8'
  | 'lsp14'
  | 'lsp23'
  | 'lsp26';

export interface EventDecodeInput {
  topics: string[];
  data: string;
}

export interface EventDescriptor {
  readonly eventName: EventName;
  readonly eventDomain: EventDomain;
  readonly scope: EventScope;
  readonly topic0: string;
  readonly decode: (log: EventDecodeInput) => Record<string, unknown>;
}

/** Expected ABI payload failure for an otherwise valid known-topic raw log. */
export class MalformedEventPayloadError extends Error {
  constructor(cause: unknown) {
    super('Known event payload does not match its ABI', { cause });
    this.name = 'MalformedEventPayloadError';
  }
}

function decodeAbiEvent<T>(decode: () => T): T {
  try {
    return decode();
  } catch (error) {
    throw new MalformedEventPayloadError(error);
  }
}

/** Normalize arbitrary-length ABI bytes to lowercase without changing their representation. */
export function normalizeHexBytes(value: string, name = 'hex bytes'): string {
  if (!HEX_BYTES_PATTERN.test(value)) {
    throw new Error(`${name} must be an even-length 0x-prefixed hexadecimal value`);
  }
  return value.toLowerCase();
}

function normalizeBytes4(value: string, name: string): string {
  if (!BYTES4_PATTERN.test(value)) {
    throw new Error(`${name} must be a 0x-prefixed 4-byte hexadecimal value`);
  }
  return value.toLowerCase();
}

function decodeOperationType(value: bigint): string | null {
  switch (value) {
    case 0n:
      return 'CALL';
    case 1n:
      return 'CREATE';
    case 2n:
      return 'CREATE2';
    case 3n:
      return 'DELEGATECALL';
    case 4n:
      return 'STATICCALL';
    default:
      return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${name} must decode to an object`);
  return value;
}

function readString(record: Record<string, unknown>, key: string, name: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new Error(`${name}.${key} must decode to a string`);
  return value;
}

function readBigInt(record: Record<string, unknown>, key: string, name: string): bigint {
  const value = record[key];
  if (typeof value !== 'bigint') throw new Error(`${name}.${key} must decode to a bigint`);
  return value;
}

function readBoolean(record: Record<string, unknown>, key: string, name: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') throw new Error(`${name}.${key} must decode to a boolean`);
  return value;
}

function decodeDataChanged(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => ERC725Y_EVENTS.DataChanged.decode(log));
  return {
    dataKey: normalizeBytes32(event.dataKey, 'DataChanged data key'),
    dataValue: normalizeHexBytes(event.dataValue, 'DataChanged data value'),
  };
}

function decodeExecuted(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => ERC725X_EVENTS.Executed.decode(log));
  return {
    decodedOperationType: decodeOperationType(event.operationType),
    operationType: event.operationType.toString(),
    value: event.value.toString(),
    target: normalizeAddress(event.target),
    selector: normalizeBytes4(event.selector, 'Executed selector'),
  };
}

function decodeUniversalReceiver(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP0_EVENTS.UniversalReceiver.decode(log));
  return {
    from: normalizeAddress(event.from),
    value: event.value.toString(),
    typeId: normalizeBytes32(event.typeId, 'UniversalReceiver type ID'),
    receivedData: normalizeHexBytes(event.receivedData, 'UniversalReceiver received data'),
    returnedValue: normalizeHexBytes(event.returnedValue, 'UniversalReceiver returned value'),
  };
}

function decodeLsp7Transfer(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP7_EVENTS.Transfer.decode(log));
  return {
    operator: normalizeAddress(event.operator),
    from: normalizeAddress(event.from),
    to: normalizeAddress(event.to),
    amount: event.amount.toString(),
    tokenId: null,
    force: event.force,
    data: normalizeHexBytes(event.data, 'LSP7 Transfer data'),
  };
}

function decodeLsp8Transfer(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP8_EVENTS.Transfer.decode(log));
  return {
    operator: normalizeAddress(event.operator),
    from: normalizeAddress(event.from),
    to: normalizeAddress(event.to),
    amount: '1',
    tokenId: normalizeTokenId(event.tokenId),
    force: event.force,
    data: normalizeHexBytes(event.data, 'LSP8 Transfer data'),
  };
}

function decodeOwnershipTransferred(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP14_EVENTS.OwnershipTransferred.decode(log));
  return {
    previousOwner: normalizeAddress(event.previousOwner),
    newOwner: normalizeAddress(event.newOwner),
  };
}

function decodeTokenIdDataChanged(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP8_EVENTS.TokenIdDataChanged.decode(log));
  return {
    tokenId: normalizeTokenId(event.tokenId),
    dataKey: normalizeBytes32(event.dataKey, 'TokenIdDataChanged data key'),
    dataValue: normalizeHexBytes(event.dataValue, 'TokenIdDataChanged data value'),
  };
}

function decodeFollow(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP26_EVENTS.Follow.decode(log));
  return {
    followerAddress: normalizeAddress(event.follower),
    followedAddress: normalizeAddress(event.addr),
  };
}

function decodeUnfollow(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP26_EVENTS.Unfollow.decode(log));
  return {
    followerAddress: normalizeAddress(event.unfollower),
    unfollowedAddress: normalizeAddress(event.addr),
  };
}

function decodePrimaryContractDeployment(value: unknown): Record<string, unknown> {
  const deployment = readRecord(value, 'primaryContractDeployment');
  return {
    salt: normalizeBytes32(
      readString(deployment, 'salt', 'primaryContractDeployment'),
      'primary deployment salt',
    ),
    fundingAmount: readBigInt(deployment, 'fundingAmount', 'primaryContractDeployment').toString(),
    creationBytecode: normalizeHexBytes(
      readString(deployment, 'creationBytecode', 'primaryContractDeployment'),
      'primary deployment creation bytecode',
    ),
  };
}

function decodeSecondaryContractDeployment(value: unknown): Record<string, unknown> {
  const deployment = readRecord(value, 'secondaryContractDeployment');
  return {
    fundingAmount: readBigInt(
      deployment,
      'fundingAmount',
      'secondaryContractDeployment',
    ).toString(),
    creationBytecode: normalizeHexBytes(
      readString(deployment, 'creationBytecode', 'secondaryContractDeployment'),
      'secondary deployment creation bytecode',
    ),
    addPrimaryContractAddress: readBoolean(
      deployment,
      'addPrimaryContractAddress',
      'secondaryContractDeployment',
    ),
    extraConstructorParams: normalizeHexBytes(
      readString(deployment, 'extraConstructorParams', 'secondaryContractDeployment'),
      'secondary deployment constructor params',
    ),
  };
}

function decodeDeployedContracts(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP23_EVENTS.DeployedContracts.decode(log));
  return {
    primaryContract: normalizeAddress(event.primaryContract),
    secondaryContract: normalizeAddress(event.secondaryContract),
    primaryContractDeployment: decodePrimaryContractDeployment(event.primaryContractDeployment),
    secondaryContractDeployment: decodeSecondaryContractDeployment(
      event.secondaryContractDeployment,
    ),
    postDeploymentModule: normalizeAddress(event.postDeploymentModule),
    postDeploymentModuleCalldata: normalizeHexBytes(
      event.postDeploymentModuleCalldata,
      'post-deployment module calldata',
    ),
  };
}

function decodePrimaryContractDeploymentInit(value: unknown): Record<string, unknown> {
  const deployment = readRecord(value, 'primaryContractDeploymentInit');
  return {
    salt: normalizeBytes32(
      readString(deployment, 'salt', 'primaryContractDeploymentInit'),
      'primary proxy salt',
    ),
    fundingAmount: readBigInt(
      deployment,
      'fundingAmount',
      'primaryContractDeploymentInit',
    ).toString(),
    implementationContract: normalizeAddress(
      readString(deployment, 'implementationContract', 'primaryContractDeploymentInit'),
    ),
    initializationCalldata: normalizeHexBytes(
      readString(deployment, 'initializationCalldata', 'primaryContractDeploymentInit'),
      'primary proxy initialization calldata',
    ),
  };
}

function decodeSecondaryContractDeploymentInit(value: unknown): Record<string, unknown> {
  const deployment = readRecord(value, 'secondaryContractDeploymentInit');
  return {
    fundingAmount: readBigInt(
      deployment,
      'fundingAmount',
      'secondaryContractDeploymentInit',
    ).toString(),
    implementationContract: normalizeAddress(
      readString(deployment, 'implementationContract', 'secondaryContractDeploymentInit'),
    ),
    initializationCalldata: normalizeHexBytes(
      readString(deployment, 'initializationCalldata', 'secondaryContractDeploymentInit'),
      'secondary proxy initialization calldata',
    ),
    addPrimaryContractAddress: readBoolean(
      deployment,
      'addPrimaryContractAddress',
      'secondaryContractDeploymentInit',
    ),
    extraInitializationParams: normalizeHexBytes(
      readString(deployment, 'extraInitializationParams', 'secondaryContractDeploymentInit'),
      'secondary proxy extra initialization params',
    ),
  };
}

function decodeDeployedProxies(log: EventDecodeInput): Record<string, unknown> {
  const event = decodeAbiEvent(() => LSP23_EVENTS.DeployedERC1167Proxies.decode(log));
  return {
    primaryContract: normalizeAddress(event.primaryContract),
    secondaryContract: normalizeAddress(event.secondaryContract),
    primaryContractDeploymentInit: decodePrimaryContractDeploymentInit(
      event.primaryContractDeploymentInit,
    ),
    secondaryContractDeploymentInit: decodeSecondaryContractDeploymentInit(
      event.secondaryContractDeploymentInit,
    ),
    postDeploymentModule: normalizeAddress(event.postDeploymentModule),
    postDeploymentModuleCalldata: normalizeHexBytes(
      event.postDeploymentModuleCalldata,
      'post-deployment module calldata',
    ),
  };
}

const EVENT_DESCRIPTOR_DEFINITIONS = [
  {
    eventName: 'DataChanged',
    eventDomain: 'erc725y',
    scope: 'global',
    topic0: ERC725Y_EVENTS.DataChanged.topic,
    decode: decodeDataChanged,
  },
  {
    eventName: 'Executed',
    eventDomain: 'erc725x',
    scope: 'global',
    topic0: ERC725X_EVENTS.Executed.topic,
    decode: decodeExecuted,
  },
  {
    eventName: 'UniversalReceiver',
    eventDomain: 'lsp0',
    scope: 'global',
    topic0: LSP0_EVENTS.UniversalReceiver.topic,
    decode: decodeUniversalReceiver,
  },
  {
    eventName: 'Transfer',
    eventDomain: 'lsp7',
    scope: 'global',
    topic0: LSP7_EVENTS.Transfer.topic,
    decode: decodeLsp7Transfer,
  },
  {
    eventName: 'Transfer',
    eventDomain: 'lsp8',
    scope: 'global',
    topic0: LSP8_EVENTS.Transfer.topic,
    decode: decodeLsp8Transfer,
  },
  {
    eventName: 'OwnershipTransferred',
    eventDomain: 'lsp14',
    scope: 'global',
    topic0: LSP14_EVENTS.OwnershipTransferred.topic,
    decode: decodeOwnershipTransferred,
  },
  {
    eventName: 'TokenIdDataChanged',
    eventDomain: 'lsp8',
    scope: 'global',
    topic0: LSP8_EVENTS.TokenIdDataChanged.topic,
    decode: decodeTokenIdDataChanged,
  },
  {
    eventName: 'Follow',
    eventDomain: 'lsp26',
    scope: 'lsp26FollowerSystem',
    topic0: LSP26_EVENTS.Follow.topic,
    decode: decodeFollow,
  },
  {
    eventName: 'Unfollow',
    eventDomain: 'lsp26',
    scope: 'lsp26FollowerSystem',
    topic0: LSP26_EVENTS.Unfollow.topic,
    decode: decodeUnfollow,
  },
  {
    eventName: 'DeployedContracts',
    eventDomain: 'lsp23',
    scope: 'lsp23Factory',
    topic0: LSP23_EVENTS.DeployedContracts.topic,
    decode: decodeDeployedContracts,
  },
  {
    eventName: 'DeployedERC1167Proxies',
    eventDomain: 'lsp23',
    scope: 'lsp23Factory',
    topic0: LSP23_EVENTS.DeployedERC1167Proxies.topic,
    decode: decodeDeployedProxies,
  },
] satisfies EventDescriptor[];

export const EVENT_DESCRIPTORS: readonly EventDescriptor[] = Object.freeze(
  EVENT_DESCRIPTOR_DEFINITIONS.map((descriptor) => Object.freeze(descriptor)),
);

const EVENT_DESCRIPTOR_BY_TOPIC = new Map<string, EventDescriptor>();
for (const descriptor of EVENT_DESCRIPTORS) {
  const topic0 = descriptor.topic0.toLowerCase();
  if (EVENT_DESCRIPTOR_BY_TOPIC.has(topic0)) {
    throw new Error(`Duplicate v3 event topic: ${topic0}`);
  }
  EVENT_DESCRIPTOR_BY_TOPIC.set(topic0, descriptor);
}

export const GLOBAL_EVENT_TOPICS = Object.freeze(
  EVENT_DESCRIPTORS.filter(({ scope }) => scope === 'global').map(({ topic0 }) => topic0),
);

export const LSP23_EVENT_TOPICS = Object.freeze(
  EVENT_DESCRIPTORS.filter(({ scope }) => scope === 'lsp23Factory').map(({ topic0 }) => topic0),
);

export const LSP26_EVENT_TOPICS = Object.freeze(
  EVENT_DESCRIPTORS.filter(({ scope }) => scope === 'lsp26FollowerSystem').map(
    ({ topic0 }) => topic0,
  ),
);

/** Resolve a supported event signature without accepting partial topic matches. */
export function getEventDescriptor(topic0: string): EventDescriptor | undefined {
  return EVENT_DESCRIPTOR_BY_TOPIC.get(topic0.toLowerCase());
}
