import { defineAbi, type DefinedAbi } from '@subsquid/pipes/evm';

/** ERC725Y event surface retained by the v3 raw fact layer. */
export const ERC725Y_EVENT_ABI = [
  {
    type: 'event',
    name: 'DataChanged',
    anonymous: false,
    inputs: [
      { name: 'dataKey', type: 'bytes32', indexed: true },
      { name: 'dataValue', type: 'bytes', indexed: false },
    ],
  },
] as const;

/** ERC725X event surface retained by the v3 raw fact layer. */
export const ERC725X_EVENT_ABI = [
  {
    type: 'event',
    name: 'Executed',
    anonymous: false,
    inputs: [
      { name: 'operationType', type: 'uint256', indexed: true },
      { name: 'target', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
      { name: 'selector', type: 'bytes4', indexed: true },
    ],
  },
] as const;

/** LSP0 event surface retained by the v3 raw fact layer. */
export const LSP0_EVENT_ABI = [
  {
    type: 'event',
    name: 'UniversalReceiver',
    anonymous: false,
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: true },
      { name: 'typeId', type: 'bytes32', indexed: true },
      { name: 'receivedData', type: 'bytes', indexed: false },
      { name: 'returnedValue', type: 'bytes', indexed: false },
    ],
  },
] as const;

/** LSP7 event surface retained by the v3 raw fact layer. */
export const LSP7_EVENT_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    anonymous: false,
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'force', type: 'bool', indexed: false },
      { name: 'data', type: 'bytes', indexed: false },
    ],
  },
] as const;

/** LSP8 event surface retained by the v3 raw fact layer. */
export const LSP8_EVENT_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    anonymous: false,
    inputs: [
      { name: 'operator', type: 'address', indexed: false },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'bytes32', indexed: true },
      { name: 'force', type: 'bool', indexed: false },
      { name: 'data', type: 'bytes', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TokenIdDataChanged',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'bytes32', indexed: true },
      { name: 'dataKey', type: 'bytes32', indexed: true },
      { name: 'dataValue', type: 'bytes', indexed: false },
    ],
  },
] as const;

/** LSP14 event surface retained by the v3 raw fact layer. */
export const LSP14_EVENT_ABI = [
  {
    type: 'event',
    name: 'OwnershipTransferred',
    anonymous: false,
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true },
      { name: 'newOwner', type: 'address', indexed: true },
    ],
  },
] as const;

/** LSP26 singleton event surface retained by the v3 raw fact layer. */
export const LSP26_EVENT_ABI = [
  {
    type: 'event',
    name: 'Follow',
    anonymous: false,
    inputs: [
      { name: 'follower', type: 'address', indexed: false },
      { name: 'addr', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Unfollow',
    anonymous: false,
    inputs: [
      { name: 'unfollower', type: 'address', indexed: false },
      { name: 'addr', type: 'address', indexed: false },
    ],
  },
] as const;

/** LSP23 singleton event surface retained by the v3 raw fact layer. */
export const LSP23_EVENT_ABI = [
  {
    type: 'event',
    name: 'DeployedContracts',
    anonymous: false,
    inputs: [
      { name: 'primaryContract', type: 'address', indexed: true },
      { name: 'secondaryContract', type: 'address', indexed: true },
      {
        name: 'primaryContractDeployment',
        type: 'tuple',
        indexed: false,
        components: [
          { name: 'salt', type: 'bytes32' },
          { name: 'fundingAmount', type: 'uint256' },
          { name: 'creationBytecode', type: 'bytes' },
        ],
      },
      {
        name: 'secondaryContractDeployment',
        type: 'tuple',
        indexed: false,
        components: [
          { name: 'fundingAmount', type: 'uint256' },
          { name: 'creationBytecode', type: 'bytes' },
          { name: 'addPrimaryContractAddress', type: 'bool' },
          { name: 'extraConstructorParams', type: 'bytes' },
        ],
      },
      { name: 'postDeploymentModule', type: 'address', indexed: false },
      { name: 'postDeploymentModuleCalldata', type: 'bytes', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DeployedERC1167Proxies',
    anonymous: false,
    inputs: [
      { name: 'primaryContract', type: 'address', indexed: true },
      { name: 'secondaryContract', type: 'address', indexed: true },
      {
        name: 'primaryContractDeploymentInit',
        type: 'tuple',
        indexed: false,
        components: [
          { name: 'salt', type: 'bytes32' },
          { name: 'fundingAmount', type: 'uint256' },
          { name: 'implementationContract', type: 'address' },
          { name: 'initializationCalldata', type: 'bytes' },
        ],
      },
      {
        name: 'secondaryContractDeploymentInit',
        type: 'tuple',
        indexed: false,
        components: [
          { name: 'fundingAmount', type: 'uint256' },
          { name: 'implementationContract', type: 'address' },
          { name: 'initializationCalldata', type: 'bytes' },
          { name: 'addPrimaryContractAddress', type: 'bool' },
          { name: 'extraInitializationParams', type: 'bytes' },
        ],
      },
      { name: 'postDeploymentModule', type: 'address', indexed: false },
      { name: 'postDeploymentModuleCalldata', type: 'bytes', indexed: false },
    ],
  },
] as const;

export const ERC725Y_EVENTS: DefinedAbi<typeof ERC725Y_EVENT_ABI>['events'] =
  defineAbi(ERC725Y_EVENT_ABI).events;
export const ERC725X_EVENTS: DefinedAbi<typeof ERC725X_EVENT_ABI>['events'] =
  defineAbi(ERC725X_EVENT_ABI).events;
export const LSP0_EVENTS: DefinedAbi<typeof LSP0_EVENT_ABI>['events'] =
  defineAbi(LSP0_EVENT_ABI).events;
export const LSP7_EVENTS: DefinedAbi<typeof LSP7_EVENT_ABI>['events'] =
  defineAbi(LSP7_EVENT_ABI).events;
export const LSP8_EVENTS: DefinedAbi<typeof LSP8_EVENT_ABI>['events'] =
  defineAbi(LSP8_EVENT_ABI).events;
export const LSP14_EVENTS: DefinedAbi<typeof LSP14_EVENT_ABI>['events'] =
  defineAbi(LSP14_EVENT_ABI).events;
export const LSP26_EVENTS: DefinedAbi<typeof LSP26_EVENT_ABI>['events'] =
  defineAbi(LSP26_EVENT_ABI).events;
export const LSP23_EVENTS: DefinedAbi<typeof LSP23_EVENT_ABI>['events'] =
  defineAbi(LSP23_EVENT_ABI).events;
