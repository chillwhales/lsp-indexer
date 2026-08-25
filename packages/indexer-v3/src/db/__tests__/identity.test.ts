import { describe, expect, it } from 'vitest';
import {
  createAddressId,
  createBlockId,
  createDataValueId,
  createDeterministicId,
  createEventId,
  createMetadataRevisionId,
  createRelationshipId,
  createTokenEntityId,
  normalizeAddress,
  normalizeBytes32,
  normalizeTokenId,
} from '../identity.js';

const address = `0x${'aB'.repeat(20)}`;
const normalizedAddress = `0x${'ab'.repeat(20)}`;
const tokenId = `0x${'cD'.repeat(32)}`;
const normalizedTokenId = `0x${'cd'.repeat(32)}`;
const dataKey = `0x${'eF'.repeat(32)}`;

describe('deterministic database identities', () => {
  it('normalizes canonical fixed-width EVM values', () => {
    expect(normalizeAddress(address)).toBe(normalizedAddress);
    expect(normalizeBytes32(tokenId)).toBe(normalizedTokenId);
    expect(normalizeTokenId(tokenId)).toBe(normalizedTokenId);
  });

  it('encodes chain-scoped block and event positions', () => {
    expect(createBlockId(42, 12)).toBe('eip155:42:block:12');
    expect(createEventId(42, 12, 3, 4)).toBe('eip155:42:log:12:3:4');
  });

  it('encodes every projection from its natural key', () => {
    expect(createAddressId('profile', 1, address)).toBe(`eip155:1:profile:${normalizedAddress}`);
    expect(createTokenEntityId(1, address, tokenId)).toBe(
      `eip155:1:nft:${normalizedAddress}:${normalizedTokenId}`,
    );
    expect(createRelationshipId('follower', 1, [address, `0x${'12'.repeat(20)}`])).toBe(
      `eip155:1:follower:${normalizedAddress}:0x${'12'.repeat(20)}`,
    );
    expect(createDataValueId(1, address, dataKey)).toContain(':contract:');
    expect(createDataValueId(1, address, dataKey, tokenId)).toContain(normalizedTokenId);
    expect(
      createMetadataRevisionId(1, address, dataKey, 'ipfs://a:b', tokenId).endsWith(
        'ipfs%3A%2F%2Fa%3Ab',
      ),
    ).toBe(true);
  });

  it.each([
    () => normalizeAddress('0x1234'),
    () => normalizeBytes32('0x1234'),
    () => createBlockId(1, -1),
    () => createEventId(1, 1, 0.5, 0),
    () => createDeterministicId('BadKind', 1, ['x']),
    () => createDeterministicId('valid', 0, ['x']),
    () => createDeterministicId('valid', 1, []),
    () => createDeterministicId('valid', 1, ['']),
  ])('rejects ambiguous or invalid identity input', (operation) => {
    expect(operation).toThrow();
  });
});
