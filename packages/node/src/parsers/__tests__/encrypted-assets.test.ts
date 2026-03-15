/**
 * Unit tests for LSP29 encrypted asset parsers.
 *
 * Verifies snake_case → camelCase field mapping and numeric conversions
 * for parseEncryption, parseFile, and parseChunks sub-parsers via the
 * public parseEncryptedAsset entry point.
 */
import { describe, expect, it } from 'vitest';
import { parseEncryptedAsset } from '../encrypted-assets';

// ---------------------------------------------------------------------------
// Minimal raw Hasura row factory
// ---------------------------------------------------------------------------

/** Create a minimal raw Hasura row with only the fields needed for parsing. */
function makeRawAsset(
  overrides: Record<string, unknown> = {},
): Parameters<typeof parseEncryptedAsset>[0] {
  return {
    address: '0xTestAddress',
    content_id: 'cid-1',
    revision: 1,
    ...overrides,
  } as unknown as Parameters<typeof parseEncryptedAsset>[0];
}

// ---------------------------------------------------------------------------
// parseEncryption snake_case → camelCase
// ---------------------------------------------------------------------------

// Note: parseEncryptedAsset requires include.encryption to be truthy for the
// encryption parser to run. When include is omitted (full result), Hasura
// returns all fields and the service always passes include. Tests use
// include: { encryption: true } to exercise the parser path.

describe('parseEncryptedAsset — encryption mapping', () => {
  const INCLUDE_ENCRYPTION = { encryption: true as const };

  it('maps all snake_case encryption fields to camelCase', () => {
    const raw = makeRawAsset({
      encryption: {
        provider: 'taco',
        method: 'digital-asset-balance',
        condition: '{"chain":"lukso"}',
        encrypted_key: '{"messageKit":"0xabc"}',
        token_address: '0xDA1111',
        required_balance: '1000',
        required_token_id: null,
        followed_addresses: null,
        unlock_timestamp: null,
      },
    });

    const result = parseEncryptedAsset(raw, INCLUDE_ENCRYPTION);

    expect(result.encryption).toEqual({
      provider: 'taco',
      method: 'digital-asset-balance',
      condition: '{"chain":"lukso"}',
      encryptedKey: '{"messageKit":"0xabc"}',
      tokenAddress: '0xDA1111',
      requiredBalance: '1000',
      requiredTokenId: null,
      followedAddresses: null,
      unlockTimestamp: null,
    });
  });

  it('returns null for encryption when not included', () => {
    const raw = makeRawAsset({ encryption: null });
    const result = parseEncryptedAsset(raw, INCLUDE_ENCRYPTION);
    expect(result.encryption).toBeNull();
  });

  it('maps followedAddresses array correctly', () => {
    const raw = makeRawAsset({
      encryption: {
        provider: 'taco',
        method: 'lsp26-follower',
        condition: null,
        encrypted_key: null,
        token_address: null,
        required_balance: null,
        required_token_id: null,
        followed_addresses: ['0xAddr1', '0xAddr2'],
        unlock_timestamp: null,
      },
    });

    const result = parseEncryptedAsset(raw, INCLUDE_ENCRYPTION);
    expect(result.encryption!.followedAddresses).toEqual(['0xAddr1', '0xAddr2']);
  });

  it('maps unlock_timestamp correctly', () => {
    const raw = makeRawAsset({
      encryption: {
        provider: 'taco',
        method: 'time-locked',
        condition: null,
        encrypted_key: null,
        token_address: null,
        required_balance: null,
        required_token_id: null,
        followed_addresses: null,
        unlock_timestamp: '2026-06-01T00:00:00Z',
      },
    });

    const result = parseEncryptedAsset(raw, INCLUDE_ENCRYPTION);
    expect(result.encryption!.unlockTimestamp).toBe('2026-06-01T00:00:00Z');
  });
});

// ---------------------------------------------------------------------------
// parseFile snake_case → camelCase + numeric conversion
// ---------------------------------------------------------------------------

describe('parseEncryptedAsset — file mapping', () => {
  it('maps snake_case file fields and converts numerics', () => {
    const raw = makeRawAsset({
      file: {
        hash: '0xfilehash',
        last_modified: '1718449200000',
        name: 'artwork.mp4',
        size: '1048576',
        type: 'video/mp4',
      },
    });

    const result = parseEncryptedAsset(raw);

    expect(result.file).toEqual({
      hash: '0xfilehash',
      lastModified: 1718449200000,
      name: 'artwork.mp4',
      size: 1048576,
      type: 'video/mp4',
    });
  });

  it('returns null for absent numeric fields', () => {
    const raw = makeRawAsset({
      file: {
        hash: null,
        name: 'test.pdf',
      },
    });

    const result = parseEncryptedAsset(raw);
    expect(result.file!.lastModified).toBeNull();
    expect(result.file!.size).toBeNull();
    expect(result.file!.type).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseChunks snake_case → camelCase
// ---------------------------------------------------------------------------

describe('parseEncryptedAsset — chunks mapping', () => {
  it('maps all snake_case chunks fields to camelCase', () => {
    const raw = makeRawAsset({
      chunks: {
        iv: 'iv-bytes',
        total_size: '3145728',
        ipfs_cids: ['Qm1', 'Qm2'],
        lumera_action_ids: ['act-1'],
        arweave_transaction_ids: null,
        s3_keys: ['key1'],
        s3_bucket: 'my-bucket',
        s3_region: 'us-east-1',
      },
    });

    const result = parseEncryptedAsset(raw);

    expect(result.chunks).toEqual({
      iv: 'iv-bytes',
      totalSize: 3145728,
      ipfsCids: ['Qm1', 'Qm2'],
      lumeraActionIds: ['act-1'],
      arweaveTransactionIds: null,
      s3Keys: ['key1'],
      s3Bucket: 'my-bucket',
      s3Region: 'us-east-1',
    });
  });

  it('returns null for absent chunk backends', () => {
    const raw = makeRawAsset({
      chunks: {
        iv: 'iv-bytes',
        total_size: null,
      },
    });

    const result = parseEncryptedAsset(raw);
    expect(result.chunks!.totalSize).toBeNull();
    expect(result.chunks!.ipfsCids).toBeNull();
    expect(result.chunks!.lumeraActionIds).toBeNull();
    expect(result.chunks!.arweaveTransactionIds).toBeNull();
    expect(result.chunks!.s3Keys).toBeNull();
    expect(result.chunks!.s3Bucket).toBeNull();
    expect(result.chunks!.s3Region).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Base field mapping
// ---------------------------------------------------------------------------

describe('parseEncryptedAsset — base fields', () => {
  it('maps base fields correctly', () => {
    const raw = makeRawAsset({
      address: '0xUP123',
      content_id: 'my-content',
      revision: 3,
    });

    const result = parseEncryptedAsset(raw);
    expect(result.address).toBe('0xUP123');
    expect(result.contentId).toBe('my-content');
    expect(result.revision).toBe(3);
  });

  it('maps title and description from nested value wrappers', () => {
    const raw = makeRawAsset({
      title: { value: 'My Title' },
      description: { value: 'My Description' },
    });

    const result = parseEncryptedAsset(raw);
    expect(result.title).toBe('My Title');
    expect(result.description).toBe('My Description');
  });

  it('returns null for absent title and description', () => {
    const raw = makeRawAsset({
      title: null,
      description: null,
    });

    const result = parseEncryptedAsset(raw);
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
  });
});
