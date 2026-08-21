import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig, type RuntimeConfig } from '../../config/index.js';
import { loadDatabaseMigrationConfig, loadNetworkDatabaseConfig } from '../config.js';

function runtime(network = 'ethereum-mainnet'): RuntimeConfig {
  return loadRuntimeConfig({ INDEXER_NETWORK: network });
}

describe('database configuration', () => {
  it('loads a role- and schema-scoped runtime pool configuration', () => {
    const config = loadNetworkDatabaseConfig(runtime(), {
      DATABASE_URL: 'postgresql://generic.example.test/indexer',
      DATABASE_URL_ETHEREUM_MAINNET: 'postgres://network.example.test/indexer',
      DATABASE_POOL_MAX: '20',
      DATABASE_CONNECTION_TIMEOUT_MS: '2000',
      DATABASE_IDLE_TIMEOUT_MS: '3000',
      DATABASE_STATEMENT_TIMEOUT_MS: '4000',
      DATABASE_LOCK_TIMEOUT_MS: '5000',
      DATABASE_IDLE_TRANSACTION_TIMEOUT_MS: '6000',
      DATABASE_UNFINALIZED_BLOCKS_RETENTION: '1200',
    });

    expect(config).toMatchObject({
      connectionString: 'postgres://network.example.test/indexer',
      schema: 'chain_ethereum_mainnet',
      role: 'lsp_v3_chain_ethereum_mainnet_writer',
      applicationName: 'lsp-indexer-v3:ethereum-mainnet',
      poolMax: 20,
      connectionTimeoutMs: 2000,
      idleTimeoutMs: 3000,
      statementTimeoutMs: 4000,
      lockTimeoutMs: 5000,
      idleTransactionTimeoutMs: 6000,
      unfinalizedBlocksRetention: 1200,
    });
  });

  it('falls back to the generic URL when a network override is empty', () => {
    const config = loadNetworkDatabaseConfig(runtime(), {
      DATABASE_URL: 'postgresql://generic.example.test/indexer',
      DATABASE_URL_ETHEREUM_MAINNET: '   ',
    });

    expect(config.connectionString).toBe('postgresql://generic.example.test/indexer');
  });

  it('loads every configured network into the default migration plan', () => {
    const config = loadDatabaseMigrationConfig({
      DATABASE_ADMIN_URL: 'postgresql://admin.example.test/indexer',
      DATABASE_RUNTIME_LOGIN_ETHEREUM_MAINNET: 'runtime_eth',
    });

    expect(config.networks).toHaveLength(3);
    expect(config.networks.find(({ network }) => network.chainId === 1)).toMatchObject({
      schema: 'chain_ethereum_mainnet',
      role: 'lsp_v3_chain_ethereum_mainnet_writer',
      runtimeLogin: 'runtime_eth',
    });
  });

  it('supports an explicit enabled-network migration set', () => {
    const config = loadDatabaseMigrationConfig({
      DATABASE_ADMIN_URL: 'postgresql://admin.example.test/indexer',
      DATABASE_MIGRATION_NETWORKS: 'ethereum-mainnet, ethereum-sepolia',
    });
    expect(config.networks.map(({ network }) => network.key)).toEqual([
      'ethereum-mainnet',
      'ethereum-sepolia',
    ]);
  });

  it('rejects a runtime login shared by multiple networks', () => {
    expect(() =>
      loadDatabaseMigrationConfig({
        DATABASE_ADMIN_URL: 'postgresql://example.test/indexer',
        DATABASE_RUNTIME_LOGIN_ETHEREUM_MAINNET: 'shared_runtime',
        DATABASE_RUNTIME_LOGIN_ETHEREUM_SEPOLIA: 'shared_runtime',
      }),
    ).toThrow('distinct login role');
  });

  it('accepts an explicit rollback retention below the default floor when it exceeds finality', () => {
    const config = loadNetworkDatabaseConfig(runtime(), {
      DATABASE_URL: 'postgresql://example.test/indexer',
      DATABASE_UNFINALIZED_BLOCKS_RETENTION: '13',
    });

    expect(config.unfinalizedBlocksRetention).toBe(13);
  });

  it.each([
    () => loadNetworkDatabaseConfig(runtime(), {}),
    () => loadNetworkDatabaseConfig(runtime(), { DATABASE_URL: 'https://example.test' }),
    () =>
      loadNetworkDatabaseConfig(runtime(), {
        DATABASE_URL: 'postgresql://example.test/indexer',
        DATABASE_POOL_MAX: '0',
      }),
    () =>
      loadNetworkDatabaseConfig(runtime(), {
        DATABASE_URL: 'postgresql://example.test/indexer',
        DATABASE_UNFINALIZED_BLOCKS_RETENTION: '12',
      }),
    () => loadDatabaseMigrationConfig({}),
    () =>
      loadDatabaseMigrationConfig({
        DATABASE_ADMIN_URL: 'postgresql://example.test/indexer',
        DATABASE_MIGRATION_NETWORKS: 'ethereum-mainnet,ethereum-mainnet',
      }),
    () =>
      loadDatabaseMigrationConfig({
        DATABASE_ADMIN_URL: 'postgresql://example.test/indexer',
        DATABASE_RUNTIME_LOGIN_ETHEREUM_MAINNET: 'Unsafe Runtime Login',
      }),
  ])('rejects unsafe database configuration', (operation) => {
    expect(operation).toThrow();
  });
});
