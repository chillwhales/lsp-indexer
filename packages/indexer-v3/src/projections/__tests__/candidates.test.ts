import { toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import type { EventFactRecord, EventIngestionBatch } from '../../events/decode.js';
import { collectProjectionCandidates } from '../candidates.js';
import { DATA_KEYS, ZERO_ADDRESS } from '../standards.js';

const asset = '0x0000000000000000000000000000000000000010';
const profile = '0x0000000000000000000000000000000000000020';
const blockHash = toHex(10n, { size: 32 });

function event(
  position: number,
  values: Pick<EventFactRecord, 'address' | 'eventName' | 'eventDomain' | 'decoded'>,
): EventFactRecord {
  const transactionHash = toHex(BigInt(position + 1), { size: 32 });
  return {
    id: `eip155:42:log:10:0:${position}`,
    network: 'lukso-mainnet',
    chainId: 42,
    blockNumber: 10,
    blockHash,
    parentHash: toHex(0n, { size: 32 }),
    blockTimestamp: new Date('2026-01-01T00:00:00Z'),
    transactionHash,
    transactionIndex: 0,
    logIndex: position,
    topic0: toHex(100n, { size: 32 }),
    topics: [toHex(100n, { size: 32 })],
    data: '0x',
    ...values,
  };
}

function batch(events: EventFactRecord[]): EventIngestionBatch {
  return { blocks: [], events, decodedEvents: events.length, malformedEvents: 0 };
}

describe('projection verification candidate planning', () => {
  it('deduplicates exact block/category/address checks and ignores sentinel addresses', () => {
    const events = [
      event(0, {
        address: asset,
        eventName: 'Transfer',
        eventDomain: 'lsp7',
        decoded: { operator: ZERO_ADDRESS, from: ZERO_ADDRESS, to: profile, amount: '5' },
      }),
      event(1, {
        address: asset,
        eventName: 'Transfer',
        eventDomain: 'lsp7',
        decoded: { operator: profile, from: ZERO_ADDRESS, to: profile, amount: '2' },
      }),
    ];

    expect(collectProjectionCandidates(batch(events))).toEqual([
      { blockNumber: 10, blockHash, address: asset, category: 'digitalAsset' },
      { blockNumber: 10, blockHash, address: profile, category: 'universalProfile' },
    ]);
  });

  it('discovers nested creator and issued-asset references from ERC725Y keys', () => {
    const creatorKey = `${DATA_KEYS.lsp4CreatorsMap}${profile.slice(2)}`;
    const issuedKey = `${DATA_KEYS.lsp12IssuedAssetsMap}${asset.slice(2)}`;
    const registryValue = `0x24871b3d${toHex(0n, { size: 16 }).slice(2)}`;
    const emitter = '0x0000000000000000000000000000000000000030';
    const events = [
      event(0, {
        address: emitter,
        eventName: 'DataChanged',
        eventDomain: 'erc725y',
        decoded: { dataKey: creatorKey, dataValue: registryValue },
      }),
      event(1, {
        address: emitter,
        eventName: 'DataChanged',
        eventDomain: 'erc725y',
        decoded: { dataKey: issuedKey, dataValue: registryValue },
      }),
    ];

    expect(collectProjectionCandidates(batch(events))).toEqual([
      { blockNumber: 10, blockHash, address: asset, category: 'digitalAsset' },
      { blockNumber: 10, blockHash, address: emitter, category: 'digitalAsset' },
      { blockNumber: 10, blockHash, address: profile, category: 'universalProfile' },
      { blockNumber: 10, blockHash, address: emitter, category: 'universalProfile' },
    ]);
  });

  it('covers call, receiver, token, follower, deployment, and malformed event families', () => {
    const deployment = '0x0000000000000000000000000000000000000040';
    const events = [
      event(0, {
        address: profile,
        eventName: 'Executed',
        eventDomain: 'erc725x',
        decoded: { target: asset },
      }),
      event(1, {
        address: profile,
        eventName: 'UniversalReceiver',
        eventDomain: 'lsp0',
        decoded: { from: asset },
      }),
      event(2, {
        address: asset,
        eventName: 'TokenIdDataChanged',
        eventDomain: 'lsp8',
        decoded: { tokenId: toHex(1n, { size: 32 }), dataKey: toHex(2n, { size: 32 }) },
      }),
      event(3, {
        address: profile,
        eventName: 'Follow',
        eventDomain: 'lsp26',
        decoded: { followerAddress: profile, followedAddress: deployment },
      }),
      event(4, {
        address: profile,
        eventName: 'Unfollow',
        eventDomain: 'lsp26',
        decoded: { followerAddress: profile, unfollowedAddress: deployment },
      }),
      event(5, {
        address: asset,
        eventName: 'DeployedContracts',
        eventDomain: 'lsp23',
        decoded: { primaryContract: deployment },
      }),
      event(6, {
        address: asset,
        eventName: 'DeployedERC1167Proxies',
        eventDomain: 'lsp23',
        decoded: { primaryContract: deployment },
      }),
      event(7, {
        address: asset,
        eventName: 'DataChanged',
        eventDomain: 'erc725y',
        decoded: null,
      }),
    ];
    const keys = collectProjectionCandidates(batch(events)).map(
      ({ category, address }) => `${category}:${address}`,
    );

    expect(keys).toEqual(
      expect.arrayContaining([
        `digitalAsset:${asset}`,
        `universalProfile:${asset}`,
        `universalProfile:${profile}`,
        `universalProfile:${deployment}`,
      ]),
    );
    expect(keys.filter((key) => key.endsWith(deployment))).toHaveLength(1);
  });
});
