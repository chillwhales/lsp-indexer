import { describe, expect, it } from 'vitest';
import {
  assertPostgresIdentifier,
  createNetworkDatabaseRole,
  createNetworkDatabaseVariable,
  createRuntimeLoginVariable,
  quotePostgresIdentifier,
} from '../names.js';

describe('database names', () => {
  it('derives stable network-specific names', () => {
    expect(createNetworkDatabaseRole('chain_lukso_mainnet')).toBe(
      'lsp_v3_chain_lukso_mainnet_writer',
    );
    expect(createNetworkDatabaseVariable('lukso-mainnet')).toBe('DATABASE_URL_LUKSO_MAINNET');
    expect(createRuntimeLoginVariable('ethereum-sepolia')).toBe(
      'DATABASE_RUNTIME_LOGIN_ETHEREUM_SEPOLIA',
    );
    expect(quotePostgresIdentifier('_internal')).toBe('"_internal"');
  });

  it.each(['Uppercase', 'has-dash', 'has space', '1starts_with_number', 'a'.repeat(64)])(
    'rejects unsafe PostgreSQL identifier %s',
    (identifier) => {
      expect(() => assertPostgresIdentifier(identifier)).toThrow();
    },
  );

  it('rejects invalid network keys', () => {
    expect(() => createNetworkDatabaseVariable('Ethereum Mainnet')).toThrow();
  });
});
