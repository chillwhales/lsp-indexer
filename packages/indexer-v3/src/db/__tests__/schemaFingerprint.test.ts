import { describe, expect, it } from 'vitest';
import {
  createChainAclBoundaryQuery,
  createPublicPrivilegeBoundaryQuery,
} from '../roleBoundary.js';
import {
  EXPECTED_CHAIN_SCHEMA_FINGERPRINT,
  assertChainSchemaFingerprint,
  createChainSchemaFingerprintQuery,
} from '../schemaFingerprint.js';

describe('database catalog boundaries', () => {
  it('accepts only the reviewed chain-schema fingerprint', () => {
    expect(() =>
      assertChainSchemaFingerprint('chain_ethereum_mainnet', EXPECTED_CHAIN_SCHEMA_FINGERPRINT),
    ).not.toThrow();
    expect(() => assertChainSchemaFingerprint('chain_ethereum_mainnet', 'unexpected')).toThrow(
      `expected "${EXPECTED_CHAIN_SCHEMA_FINGERPRINT}"`,
    );
    expect(() => assertChainSchemaFingerprint('chain_ethereum_mainnet', undefined)).toThrow(
      'fingerprint is "missing"',
    );
  });

  it('builds the chain and PUBLIC catalog audits', () => {
    expect(createChainSchemaFingerprintQuery('chain_ethereum_mainnet')).toBeDefined();
    expect(
      createChainAclBoundaryQuery('lsp_v3_chain_ethereum_mainnet_writer', 'chain_ethereum_mainnet'),
    ).toBeDefined();
    expect(createPublicPrivilegeBoundaryQuery()).toBeDefined();
  });

  it('rejects unsafe schema identifiers before building a catalog query', () => {
    expect(() => createChainSchemaFingerprintQuery('chain; DROP SCHEMA public')).toThrow(
      'network database schema',
    );
    expect(() =>
      createChainAclBoundaryQuery('writer; RESET ROLE', 'chain_ethereum_mainnet'),
    ).toThrow('database writer role');
  });
});
