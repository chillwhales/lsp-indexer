import { evmPortalStream } from '@subsquid/pipes/evm';
import { encodeEvent, mockBlock, mockEvmPortalStream } from '@subsquid/pipes/testing/evm';
import { toHex, type Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig, type RuntimeConfig } from '../../config/index.js';
import {
  ERC725X_EVENT_ABI,
  ERC725Y_EVENT_ABI,
  EVENT_DESCRIPTORS,
  GLOBAL_EVENT_TOPICS,
  LSP0_EVENT_ABI,
  LSP14_EVENT_ABI,
  LSP23_EVENT_ABI,
  LSP23_EVENT_TOPICS,
  LSP26_EVENT_ABI,
  LSP26_EVENT_TOPICS,
  LSP7_EVENT_ABI,
  LSP8_EVENT_ABI,
  createEventIngestionOutput,
  createEventIngestionQuery,
  decodeEventBatch,
} from '../index.js';

function addressFor(value: number): Hex {
  return toHex(BigInt(value), { size: 20 });
}

function hashFor(value: number): Hex {
  return toHex(BigInt(value), { size: 32 });
}

function runtimeFor(network: string, from = 0, to?: number): RuntimeConfig {
  return loadRuntimeConfig({
    INDEXER_NETWORK: network,
    INDEXER_FROM_BLOCK: String(from),
    ...(to == null ? {} : { INDEXER_TO_BLOCK: String(to) }),
  });
}

const emitter = addressFor(100);
const firstAddress = addressFor(101);
const secondAddress = addressFor(102);
const thirdAddress = addressFor(103);
const fourthAddress = addressFor(104);
const dataKey = hashFor(201);
const tokenId = hashFor(202);
const typeId = hashFor(203);
const portalTimestamp = 1_750_000_000_000;

function createParityBlock(runtime: RuntimeConfig, number: number): ReturnType<typeof mockBlock> {
  const lsp23 = runtime.network.contracts.lsp23Factory;
  const lsp26 = runtime.network.contracts.lsp26FollowerSystem;
  if (lsp23 == null || lsp26 == null) throw new Error('Parity fixture requires both singletons');

  return mockBlock({
    number,
    timestamp: portalTimestamp,
    hash: hashFor(301),
    parentHash: hashFor(300),
    transactions: [
      {
        logs: [
          encodeEvent({
            abi: ERC725Y_EVENT_ABI,
            eventName: 'DataChanged',
            address: emitter,
            args: { dataKey, dataValue: '0x1234' },
          }),
          encodeEvent({
            abi: ERC725X_EVENT_ABI,
            eventName: 'Executed',
            address: emitter,
            args: {
              operationType: 0n,
              target: firstAddress,
              value: 25n,
              selector: '0x12345678',
            },
          }),
          encodeEvent({
            abi: LSP0_EVENT_ABI,
            eventName: 'UniversalReceiver',
            address: emitter,
            args: {
              from: firstAddress,
              value: 30n,
              typeId,
              receivedData: '0xabcd',
              returnedValue: '0xef',
            },
          }),
          encodeEvent({
            abi: LSP7_EVENT_ABI,
            eventName: 'Transfer',
            address: emitter,
            args: {
              operator: firstAddress,
              from: secondAddress,
              to: thirdAddress,
              amount: 50n,
              force: true,
              data: '0x0102',
            },
          }),
          encodeEvent({
            abi: LSP8_EVENT_ABI,
            eventName: 'Transfer',
            address: emitter,
            args: {
              operator: firstAddress,
              from: secondAddress,
              to: thirdAddress,
              tokenId,
              force: false,
              data: '0x0304',
            },
          }),
          encodeEvent({
            abi: LSP14_EVENT_ABI,
            eventName: 'OwnershipTransferred',
            address: emitter,
            args: { previousOwner: firstAddress, newOwner: secondAddress },
          }),
          encodeEvent({
            abi: LSP8_EVENT_ABI,
            eventName: 'TokenIdDataChanged',
            address: emitter,
            args: { tokenId, dataKey, dataValue: '0x0506' },
          }),
          encodeEvent({
            abi: LSP26_EVENT_ABI,
            eventName: 'Follow',
            address: lsp26.address,
            args: { follower: firstAddress, addr: secondAddress },
          }),
          encodeEvent({
            abi: LSP26_EVENT_ABI,
            eventName: 'Unfollow',
            address: lsp26.address,
            args: { unfollower: firstAddress, addr: thirdAddress },
          }),
          encodeEvent({
            abi: LSP23_EVENT_ABI,
            eventName: 'DeployedContracts',
            address: lsp23.address,
            args: {
              primaryContract: firstAddress,
              secondaryContract: secondAddress,
              primaryContractDeployment: {
                salt: hashFor(401),
                fundingAmount: 60n,
                creationBytecode: '0x6001',
              },
              secondaryContractDeployment: {
                fundingAmount: 70n,
                creationBytecode: '0x6002',
                addPrimaryContractAddress: true,
                extraConstructorParams: '0x0708',
              },
              postDeploymentModule: thirdAddress,
              postDeploymentModuleCalldata: '0x090a',
            },
          }),
          encodeEvent({
            abi: LSP23_EVENT_ABI,
            eventName: 'DeployedERC1167Proxies',
            address: lsp23.address,
            args: {
              primaryContract: firstAddress,
              secondaryContract: secondAddress,
              primaryContractDeploymentInit: {
                salt: hashFor(402),
                fundingAmount: 80n,
                implementationContract: thirdAddress,
                initializationCalldata: '0x0b0c',
              },
              secondaryContractDeploymentInit: {
                fundingAmount: 90n,
                implementationContract: fourthAddress,
                initializationCalldata: '0x0d0e',
                addPrimaryContractAddress: false,
                extraInitializationParams: '0x0f10',
              },
              postDeploymentModule: thirdAddress,
              postDeploymentModuleCalldata: '0x1112',
            },
          }),
        ],
      },
    ],
  });
}

describe('v3 event ABI catalog', () => {
  it('pins every legacy plugin topic with no collisions', () => {
    expect(EVENT_DESCRIPTORS.map(({ topic0 }) => topic0)).toEqual([
      '0xece574603820d07bc9b91f2a932baadf4628aabcb8afba49776529c14a6104b2',
      '0x4810874456b8e6487bd861375cf6abd8e1c8bb5858c8ce36a86a04dabfac199e',
      '0x9c3ba68eb5742b8e3961aea0afc7371a71bf433c8a67a831803b64c064a178c2',
      '0x3997e418d2cef0b3b0e907b1e39605c3f7d32dbd061e82ea5b4a770d46a160a6',
      '0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf',
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0',
      '0xa6e4251f855f750545fe414f120db91c76b88def14d120969e5bb2d3f05debbb',
      '0xbccc71dc7842b86291138666aa18e133ee6d41aa71e6d7c650debad1a0576635',
      '0x083700fd0d85112c9d8c5823585c7542e8fadb693c9902e5bc590ab367f7a15e',
      '0x0e20ea3d6273aab49a7dabafc15cc94971c12dd63a07185ca810e497e4e87aa6',
      '0xe20570ed9bda3b93eea277b4e5d975c8933fd5f85f2c824d0845ae96c55a54fe',
    ]);
    expect(new Set(EVENT_DESCRIPTORS.map(({ topic0 }) => topic0)).size).toBe(11);
    expect(GLOBAL_EVENT_TOPICS).toHaveLength(7);
    expect(LSP23_EVENT_TOPICS).toHaveLength(2);
    expect(LSP26_EVENT_TOPICS).toHaveLength(2);
    expect(Object.isFrozen(EVENT_DESCRIPTORS)).toBe(true);
    expect(EVENT_DESCRIPTORS.every((descriptor) => Object.isFrozen(descriptor))).toBe(true);
  });
});

describe('Pipes-native event query', () => {
  it.each([
    ['lukso-mainnet', 1_143_651, 3_179_471],
    ['ethereum-mainnet', 20_217_894, 25_505_856],
  ])(
    'uses configured singleton addresses and deployment heights on %s',
    (network, lsp23, lsp26) => {
      const runtime = runtimeFor(network);
      const requests = createEventIngestionQuery(runtime).getRequests();

      expect(requests).toHaveLength(4);
      expect(requests[0]).toMatchObject({
        range: { from: 0 },
        request: { includeAllBlocks: true },
      });
      expect(requests[1]).toMatchObject({
        range: { from: 0 },
        request: { logs: [{ topic0: GLOBAL_EVENT_TOPICS }] },
      });
      expect(requests[2]).toMatchObject({
        range: { from: lsp23 },
        request: {
          logs: [
            {
              address: [runtime.network.contracts.lsp23Factory?.address.toLowerCase()],
              topic0: LSP23_EVENT_TOPICS,
            },
          ],
        },
      });
      expect(requests[3]).toMatchObject({
        range: { from: lsp26 },
        request: {
          logs: [
            {
              address: [runtime.network.contracts.lsp26FollowerSystem?.address.toLowerCase()],
              topic0: LSP26_EVENT_TOPICS,
            },
          ],
        },
      });
    },
  );

  it('omits an unavailable LSP26 capability and preserves a block-zero bound', () => {
    const runtime = runtimeFor('ethereum-sepolia', 0, 0);
    const requests = createEventIngestionQuery(runtime).getRequests();

    expect(requests).toHaveLength(3);
    expect(requests.every(({ range }) => range.from === 0 && range.to === 0)).toBe(true);
    expect(requests[0]?.request).toEqual({ includeAllBlocks: true });
    expect(requests[2]?.request).toMatchObject({
      logs: [
        {
          address: [runtime.network.contracts.lsp23Factory?.address.toLowerCase()],
          topic0: LSP23_EVENT_TOPICS,
        },
      ],
    });
  });

  it('clips scoped requests to a bounded runtime range', () => {
    const beforeDeployments = runtimeFor('lukso-mainnet', 0, 100);
    expect(createEventIngestionQuery(beforeDeployments).getRequests()).toHaveLength(2);

    const afterDeployments = runtimeFor('lukso-mainnet', 4_000_000, 4_000_010);
    const requests = createEventIngestionQuery(afterDeployments).getRequests();
    expect(requests.map(({ range }) => range)).toEqual([
      { from: 4_000_000, to: 4_000_010 },
      { from: 4_000_000, to: 4_000_010 },
      { from: 4_000_000, to: 4_000_010 },
      { from: 4_000_000, to: 4_000_010 },
    ]);
  });
});

describe('raw event decoding', () => {
  it('preserves the shared v2 fields for all 11 plugin domains', () => {
    const runtime = runtimeFor('lukso-mainnet');
    const block = createParityBlock(runtime, 3_200_000);
    const batch = decodeEventBatch(runtime, [block]);

    expect(batch).toMatchObject({ decodedEvents: 11, malformedEvents: 0 });
    expect(batch.blocks).toHaveLength(1);
    expect(batch.blocks[0]?.timestamp).toEqual(new Date(portalTimestamp));
    expect(batch.events).toHaveLength(11);
    expect(batch.events[0]).toMatchObject({
      id: 'eip155:42:log:3200000:0:0',
      network: 'lukso-mainnet',
      chainId: 42,
      blockNumber: 3_200_000,
      blockHash: hashFor(301),
      parentHash: hashFor(300),
      transactionIndex: 0,
      logIndex: 0,
      address: emitter,
      eventName: 'DataChanged',
      eventDomain: 'erc725y',
      decoded: { dataKey, dataValue: '0x1234' },
    });
    expect(batch.events[1]?.decoded).toEqual({
      decodedOperationType: 'CALL',
      operationType: '0',
      value: '25',
      target: firstAddress,
      selector: '0x12345678',
    });
    expect(batch.events[2]?.decoded).toEqual({
      from: firstAddress,
      value: '30',
      typeId,
      receivedData: '0xabcd',
      returnedValue: '0xef',
    });
    expect(batch.events[3]?.decoded).toEqual({
      operator: firstAddress,
      from: secondAddress,
      to: thirdAddress,
      amount: '50',
      tokenId: null,
      force: true,
      data: '0x0102',
    });
    expect(batch.events[4]?.decoded).toEqual({
      operator: firstAddress,
      from: secondAddress,
      to: thirdAddress,
      amount: '1',
      tokenId,
      force: false,
      data: '0x0304',
    });
    expect(batch.events[5]?.decoded).toEqual({
      previousOwner: firstAddress,
      newOwner: secondAddress,
    });
    expect(batch.events[6]?.decoded).toEqual({ tokenId, dataKey, dataValue: '0x0506' });
    expect(batch.events[7]?.decoded).toEqual({
      followerAddress: firstAddress,
      followedAddress: secondAddress,
    });
    expect(batch.events[8]?.decoded).toEqual({
      followerAddress: firstAddress,
      unfollowedAddress: thirdAddress,
    });
    expect(batch.events[9]?.decoded).toEqual({
      primaryContract: firstAddress,
      secondaryContract: secondAddress,
      primaryContractDeployment: {
        salt: hashFor(401),
        fundingAmount: '60',
        creationBytecode: '0x6001',
      },
      secondaryContractDeployment: {
        fundingAmount: '70',
        creationBytecode: '0x6002',
        addPrimaryContractAddress: true,
        extraConstructorParams: '0x0708',
      },
      postDeploymentModule: thirdAddress,
      postDeploymentModuleCalldata: '0x090a',
    });
    expect(batch.events[10]?.decoded).toEqual({
      primaryContract: firstAddress,
      secondaryContract: secondAddress,
      primaryContractDeploymentInit: {
        salt: hashFor(402),
        fundingAmount: '80',
        implementationContract: thirdAddress,
        initializationCalldata: '0x0b0c',
      },
      secondaryContractDeploymentInit: {
        fundingAmount: '90',
        implementationContract: fourthAddress,
        initializationCalldata: '0x0d0e',
        addPrimaryContractAddress: false,
        extraInitializationParams: '0x0f10',
      },
      postDeploymentModule: thirdAddress,
      postDeploymentModuleCalldata: '0x1112',
    });
  });

  it.each(['lukso-mainnet', 'ethereum-mainnet', 'ethereum-sepolia'])(
    'uses a chain-scoped deterministic identity on %s',
    (network) => {
      const runtime = runtimeFor(network);
      const log = encodeEvent({
        abi: ERC725Y_EVENT_ABI,
        eventName: 'DataChanged',
        address: emitter,
        args: { dataKey, dataValue: '0x12' },
      });
      const block = mockBlock({
        number: 10,
        timestamp: portalTimestamp,
        hash: hashFor(501),
        parentHash: hashFor(500),
        transactions: [{ logs: [log] }],
      });
      const first = decodeEventBatch(runtime, [block]);
      const replay = decodeEventBatch(runtime, [block]);

      expect(replay).toEqual(first);
      expect(first.events[0]?.id).toBe(`eip155:${runtime.network.chainId}:log:10:0:0`);
    },
  );

  it.each(['lukso-mainnet', 'ethereum-mainnet', 'ethereum-sepolia'])(
    'decodes the configured LSP23 boundary on %s',
    (network) => {
      const runtime = runtimeFor(network);
      const deployment = runtime.network.contracts.lsp23Factory;
      if (deployment == null) throw new Error('Expected LSP23 deployment');
      const log = encodeEvent({
        abi: LSP23_EVENT_ABI,
        eventName: 'DeployedContracts',
        address: deployment.address,
        args: {
          primaryContract: firstAddress,
          secondaryContract: secondAddress,
          primaryContractDeployment: {
            salt: hashFor(510),
            fundingAmount: 1n,
            creationBytecode: '0x6001',
          },
          secondaryContractDeployment: {
            fundingAmount: 2n,
            creationBytecode: '0x6002',
            addPrimaryContractAddress: true,
            extraConstructorParams: '0x',
          },
          postDeploymentModule: thirdAddress,
          postDeploymentModuleCalldata: '0x',
        },
      });
      const block = mockBlock({
        number: deployment.fromBlock,
        timestamp: portalTimestamp,
        hash: hashFor(511),
        parentHash: hashFor(510),
        transactions: [{ logs: [log] }],
      });
      const batch = decodeEventBatch(runtime, [block]);

      expect(batch.events[0]).toMatchObject({
        id: `eip155:${runtime.network.chainId}:log:${deployment.fromBlock}:0:0`,
        eventName: 'DeployedContracts',
        eventDomain: 'lsp23',
      });
    },
  );

  it.each(['lukso-mainnet', 'ethereum-mainnet'])(
    'decodes the configured LSP26 boundary on %s',
    (network) => {
      const runtime = runtimeFor(network);
      const deployment = runtime.network.contracts.lsp26FollowerSystem;
      if (deployment == null) throw new Error('Expected LSP26 deployment');
      const log = encodeEvent({
        abi: LSP26_EVENT_ABI,
        eventName: 'Follow',
        address: deployment.address,
        args: { follower: firstAddress, addr: secondAddress },
      });
      const block = mockBlock({
        number: deployment.fromBlock,
        timestamp: portalTimestamp,
        hash: hashFor(513),
        parentHash: hashFor(512),
        transactions: [{ logs: [log] }],
      });

      expect(decodeEventBatch(runtime, [block]).events[0]).toMatchObject({
        id: `eip155:${runtime.network.chainId}:log:${deployment.fromBlock}:0:0`,
        eventName: 'Follow',
        eventDomain: 'lsp26',
      });
    },
  );

  it('retains a known topic with malformed ABI data and excludes unknown topics', () => {
    const runtime = runtimeFor('lukso-mainnet');
    const valid = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: emitter,
      args: { dataKey, dataValue: '0x12' },
    });
    const block = mockBlock({
      number: 20,
      timestamp: portalTimestamp,
      hash: hashFor(601),
      parentHash: hashFor(600),
      transactions: [
        {
          logs: [
            { ...valid, data: '0x00' },
            { address: emitter, topics: [hashFor(999)], data: '0x' },
          ],
        },
      ],
    });
    const batch = decodeEventBatch(runtime, [block]);

    expect(batch).toMatchObject({ decodedEvents: 0, malformedEvents: 1 });
    expect(batch.events).toHaveLength(1);
    expect(batch.events[0]).toMatchObject({
      eventName: 'DataChanged',
      eventDomain: 'erc725y',
      decoded: null,
      data: '0x00',
    });
  });

  it('fails a batch with invalid fundamental provenance', () => {
    const runtime = runtimeFor('lukso-mainnet');
    const log = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: emitter,
      args: { dataKey, dataValue: '0x12' },
    });
    const block = mockBlock({
      number: 22,
      timestamp: portalTimestamp,
      hash: hashFor(605),
      parentHash: hashFor(604),
      transactions: [{ logs: [log] }],
    });

    const invalidDate = {
      ...block,
      header: { ...block.header, timestamp: Number.MAX_SAFE_INTEGER },
    };
    expect(() => decodeEventBatch(runtime, [invalidDate])).toThrow(
      'block timestamp must be representable as a JavaScript date',
    );

    const invalidIndex = {
      ...block,
      logs: block.logs.map((event) => ({ ...event, transactionIndex: -1 })),
    };
    expect(() => decodeEventBatch(runtime, [invalidIndex])).toThrow(
      'transaction index must be a non-negative safe integer',
    );
  });

  it('rejects scoped signatures from the wrong address, pre-deployment blocks, or absent networks', () => {
    const lukso = runtimeFor('lukso-mainnet');
    const deployment = lukso.network.contracts.lsp26FollowerSystem;
    if (deployment == null) throw new Error('Expected LSP26 deployment');
    const valid = encodeEvent({
      abi: LSP26_EVENT_ABI,
      eventName: 'Follow',
      address: deployment.address,
      args: { follower: firstAddress, addr: secondAddress },
    });
    const wrongAddress = { ...valid, address: emitter };
    const before = mockBlock({
      number: deployment.fromBlock - 1,
      hash: hashFor(701),
      parentHash: hashFor(700),
      transactions: [{ logs: [valid] }],
    });
    const after = mockBlock({
      number: deployment.fromBlock,
      hash: hashFor(702),
      parentHash: hashFor(701),
      transactions: [{ logs: [wrongAddress] }],
    });

    expect(decodeEventBatch(lukso, [before, after]).events).toHaveLength(0);
    expect(decodeEventBatch(runtimeFor('ethereum-sepolia'), [after]).events).toHaveLength(0);
  });

  it('deduplicates identical delivery and rejects a conflicting deterministic position', () => {
    const runtime = runtimeFor('lukso-mainnet');
    const log = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: emitter,
      args: { dataKey, dataValue: '0x12' },
    });
    const block = mockBlock({
      number: 30,
      timestamp: portalTimestamp,
      hash: hashFor(801),
      parentHash: hashFor(800),
      transactions: [{ logs: [log] }],
    });
    expect(decodeEventBatch(runtime, [block, block]).events).toHaveLength(1);

    const conflictingBlock = { ...block, header: { ...block.header, hash: hashFor(802) } };
    expect(() => decodeEventBatch(runtime, [block, conflictingBlock])).toThrow(
      'Conflicting block records share deterministic ID eip155:42:block:30',
    );

    const conflictingEvent = {
      ...block,
      logs: block.logs.map((event) => ({ ...event, data: '0x00' })),
    };
    expect(() => decodeEventBatch(runtime, [block, conflictingEvent])).toThrow(
      'Conflicting event records share deterministic ID eip155:42:log:30:0:0',
    );
  });
});

describe('query-aware event output', () => {
  it('runs the real Pipes query transform against a Portal fixture', async () => {
    const runtime = runtimeFor('lukso-mainnet', 39, 40);
    const log = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: emitter,
      args: { dataKey, dataValue: '0x1234' },
    });
    const block = mockBlock({
      number: 40,
      timestamp: portalTimestamp,
      hash: hashFor(901),
      parentHash: hashFor(900),
      transactions: [{ logs: [log] }],
    });
    const emptyBlock = mockBlock({
      number: 39,
      timestamp: portalTimestamp - 1_000,
      hash: hashFor(900),
      parentHash: hashFor(899),
    });
    const portal = await mockEvmPortalStream({ blocks: [emptyBlock, block] });
    try {
      const stream = evmPortalStream({
        id: `${runtime.streamId}:event-output-test`,
        portal: portal.url,
        outputs: createEventIngestionOutput(runtime),
        logger: 'error',
        profiler: false,
      });
      const batches = [];
      for await (const { data } of stream) batches.push(data);

      expect(batches).toHaveLength(1);
      expect(batches[0]).toMatchObject({
        blocks: [{ number: 39 }, { number: 40 }],
        decodedEvents: 1,
        malformedEvents: 0,
        events: [{ eventName: 'DataChanged', decoded: { dataKey, dataValue: '0x1234' } }],
      });
    } finally {
      await portal.close();
    }
  });
});
