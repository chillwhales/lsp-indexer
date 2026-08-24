import { evmPortalStream, evmQuery } from '@subsquid/pipes/evm';
import { mockPortal } from '@subsquid/pipes/testing';
import { mockBlock, mockEvmPortalStream, type PortalBlock } from '@subsquid/pipes/testing/evm';
import { eq } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { toHex, type Hex } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadRuntimeConfig, type RuntimeConfig } from '../../config/index.js';
import { createNetworkDatabase, createNetworkPool, type NetworkDatabase } from '../client.js';
import {
  loadDatabaseMigrationConfig,
  loadNetworkDatabaseConfig,
  type DatabaseMigrationConfig,
  type NetworkDatabaseConfig,
} from '../config.js';
import {
  createAddressId,
  createBlockId,
  createEventId,
  createMetadataRevisionId,
} from '../identity.js';
import { migrateDatabase } from '../migrate.js';
import {
  API_OWNER_ROLE,
  API_READER_ROLE,
  API_SCHEMA,
  CURSOR_TABLE,
  DATABASE_SCHEMA_VERSION,
  quotePostgresIdentifier,
  SHARED_ENUMS,
  SHARED_SCHEMA,
} from '../names.js';
import { verifyDatabaseReadiness } from '../readiness.js';
import { createChainObjectOwnershipQuery, type ChainObjectOwnershipRow } from '../roleBoundary.js';
import {
  blocks,
  creators,
  digitalAssets,
  eventFacts,
  indexedHeads,
  issuedAssets,
  metadataJobs,
  rollbackTables,
  universalProfiles,
} from '../schema.js';
import { createPersistenceBatch, createPersistenceTarget } from '../target.js';

const configuredSourceDatabaseUrl = process.env.TEST_DATABASE_URL;
if (configuredSourceDatabaseUrl == null) {
  throw new Error('TEST_DATABASE_URL is required for the PostgreSQL persistence suite');
}
const sourceDatabaseUrl: string = configuredSourceDatabaseUrl;
const migrationCount = readMigrationFiles({
  migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url)),
}).length;

interface TestBlock {
  header: {
    number: number;
    hash: string;
    parentHash: string;
    timestamp: number;
  };
}

interface MigrationJournal {
  version: string;
  dialect: string;
  entries: {
    idx: number;
    version: string;
    when: number;
    tag: string;
    breakpoints: boolean;
  }[];
}

interface SnapshotTableRow {
  tableName: string;
}

type TestTarget = ReturnType<typeof createPersistenceTarget<TestBlock[]>>;

const suiteSuffix = `${process.pid}_${Date.now()}`;
const testDatabaseName = `lsp_v3_persistence_${suiteSuffix}`;
const runtimePassword = 'v3-persistence-test-only';
const runtimeLogins = {
  'lukso-mainnet': `v3_test_lukso_${suiteSuffix}`,
  'ethereum-mainnet': `v3_test_eth_${suiteSuffix}`,
  'ethereum-sepolia': `v3_test_sepolia_${suiteSuffix}`,
};

const testAddress = addressFor(100);
const firstOwner = addressFor(101);
const secondOwner = addressFor(102);
const collisionAddress = addressFor(200);
const dataKey = hashFor(210);
const topic0 = hashFor(211);

const block0 = mockBlock({
  number: 0,
  timestamp: 1_700_000_000_000,
  hash: hashFor(0),
  parentHash: hashFor(255),
});
const block1 = mockBlock({
  number: 1,
  timestamp: 1_700_000_001_000,
  hash: hashFor(1),
  parentHash: block0.header.hash,
});
const block2 = mockBlock({
  number: 2,
  timestamp: 1_700_000_002_000,
  hash: hashFor(2),
  parentHash: block1.header.hash,
});
const block3 = mockBlock({
  number: 3,
  timestamp: 1_700_000_003_000,
  hash: hashFor(3),
  parentHash: block2.header.hash,
});
const alternateBlock2 = mockBlock({
  number: 2,
  timestamp: 1_700_000_002_000,
  hash: hashFor(202),
  parentHash: block1.header.hash,
});
const alternateBlock3 = mockBlock({
  number: 3,
  timestamp: 1_700_000_003_000,
  hash: hashFor(204),
  parentHash: alternateBlock2.header.hash,
});

let controlPool: Pool;
let testAdminPool: Pool;
let migrationConfig: DatabaseMigrationConfig;
let ethereumRuntime: RuntimeConfig;
let ethereumDatabaseConfig: NetworkDatabaseConfig;
let ethereumPool: Pool;
let ethereumDb: NetworkDatabase;
let sepoliaPool: Pool;
let sepoliaDb: NetworkDatabase;
let luksoPool: Pool;
let target: TestTarget;

function hashFor(value: number): Hex {
  return toHex(BigInt(value), { size: 32 });
}

function addressFor(value: number): Hex {
  return toHex(BigInt(value), { size: 20 });
}

function databaseUrl(base: string, database: string, username?: string, password?: string): string {
  const url = new URL(base);
  url.pathname = `/${database}`;
  if (username != null) url.username = username;
  if (password != null) url.password = password;
  return url.toString();
}

async function createRuntimeLogin(pool: Pool, role: string): Promise<void> {
  await pool.query(
    `CREATE ROLE ${quotePostgresIdentifier(role)} LOGIN PASSWORD '${runtimePassword}'`,
  );
}

async function executeAsRole(pool: Pool, role: string, query: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`SET ROLE ${quotePostgresIdentifier(role)}`);
    await client.query(query);
  } finally {
    try {
      await client.query('RESET ROLE');
    } finally {
      client.release();
    }
  }
}

function runtimeDatabaseUrl(network: keyof typeof runtimeLogins): string {
  return databaseUrl(sourceDatabaseUrl, testDatabaseName, runtimeLogins[network], runtimePassword);
}

function createRuntimeDatabase(network: keyof typeof runtimeLogins): {
  runtime: RuntimeConfig;
  config: NetworkDatabaseConfig;
  pool: Pool;
  db: NetworkDatabase;
} {
  const runtime = loadRuntimeConfig({ INDEXER_NETWORK: network });
  const config = loadNetworkDatabaseConfig(runtime, {
    DATABASE_URL: runtimeDatabaseUrl(network),
    DATABASE_POOL_MAX: '2',
    DATABASE_UNFINALIZED_BLOCKS_RETENTION: '100',
  });
  const pool = createNetworkPool(config);
  return { runtime, config, pool, db: createNetworkDatabase(pool) };
}

function createTestTarget(failAtBlock?: number, includeEvents = true): TestTarget {
  return createPersistenceTarget<TestBlock[]>({
    runtime: ethereumRuntime,
    databaseConfig: ethereumDatabaseConfig,
    db: ethereumDb,
    async onData({ tx }, batch): Promise<void> {
      for (const block of batch) {
        const { number, hash, parentHash, timestamp } = block.header;
        await tx
          .insert(blocks)
          .values({
            id: createBlockId(ethereumRuntime.network.chainId, number),
            network: ethereumRuntime.network.key,
            chainId: ethereumRuntime.network.chainId,
            number,
            hash,
            parentHash,
            timestamp: new Date(timestamp),
          })
          .onConflictDoNothing();
        if (includeEvents) {
          await tx
            .insert(eventFacts)
            .values({
              id: createEventId(ethereumRuntime.network.chainId, number, 0, 0),
              network: ethereumRuntime.network.key,
              chainId: ethereumRuntime.network.chainId,
              blockNumber: number,
              blockHash: hash,
              parentHash,
              blockTimestamp: new Date(timestamp),
              transactionHash: hashFor(number + 20),
              transactionIndex: 0,
              logIndex: 0,
              address: testAddress,
              topic0,
              topics: [topic0],
              data: '0x',
              eventName: 'TestEvent',
              eventDomain: 'test',
              decoded: { number },
            })
            .onConflictDoNothing();
        }

        const ownerAddress = number === 1 ? firstOwner : secondOwner;
        const profileValues = {
          id: createAddressId('profile', ethereumRuntime.network.chainId, testAddress),
          network: ethereumRuntime.network.key,
          chainId: ethereumRuntime.network.chainId,
          address: testAddress,
          ownerAddress,
          verification: 'verified' as const,
          lastBlockNumber: number,
          lastBlockHash: hash,
          lastTransactionHash: hashFor(number + 20),
          lastTransactionIndex: 0,
          lastLogIndex: 0,
        };
        await tx
          .insert(universalProfiles)
          .values(profileValues)
          .onConflictDoUpdate({
            target: [universalProfiles.chainId, universalProfiles.address],
            set: {
              ownerAddress: profileValues.ownerAddress,
              verification: profileValues.verification,
              lastBlockNumber: profileValues.lastBlockNumber,
              lastBlockHash: profileValues.lastBlockHash,
              lastTransactionHash: profileValues.lastTransactionHash,
              lastTransactionIndex: profileValues.lastTransactionIndex,
              lastLogIndex: profileValues.lastLogIndex,
            },
          });

        if (number === 2) {
          await tx
            .insert(metadataJobs)
            .values({
              id: createMetadataRevisionId(
                ethereumRuntime.network.chainId,
                testAddress,
                dataKey,
                hash,
              ),
              network: ethereumRuntime.network.key,
              chainId: ethereumRuntime.network.chainId,
              kind: 'lsp3_profile',
              address: testAddress,
              dataKey,
              sourceRevision: hash,
              contentUri: 'ipfs://test-revision',
              sourceBlockNumber: number,
              sourceBlockHash: hash,
            })
            .onConflictDoNothing();
        }

        if (number === failAtBlock) throw new Error(`injected failure at block ${number}`);
      }
    },
  });
}

async function runBlocks(
  currentTarget: TestTarget,
  selectedBlocks: PortalBlock[],
  finalized: { number: number; hash: string } | null = {
    number: block1.header.number,
    hash: block1.header.hash,
  },
): Promise<void> {
  const first = selectedBlocks.at(0);
  const last = selectedBlocks.at(-1);
  if (first == null || last == null) throw new Error('At least one test block is required');
  const portal =
    finalized == null
      ? await mockPortal([{ statusCode: 200, data: selectedBlocks }])
      : await mockEvmPortalStream({ blocks: selectedBlocks, finalized });
  try {
    const output = evmQuery()
      .addRange({ from: first.header.number, to: last.header.number })
      .addFields({
        block: { number: true, hash: true, parentHash: true, timestamp: true },
      })
      .build();
    const stream = evmPortalStream({
      id: ethereumRuntime.streamId,
      portal: portal.url,
      outputs: output,
      logger: 'error',
      profiler: false,
    }).pipe((data, ctx) => createPersistenceBatch(ethereumRuntime, data, ctx));
    await stream.pipeTo(currentTarget);
  } finally {
    await portal.close();
  }
}

async function countRows(pool: Pool, qualifiedTable: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT count(*) AS count FROM ${qualifiedTable}`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function createPendingMigrationDirectory(
  statement = 'ALTER TABLE universal_profiles ADD COLUMN forbidden_schema_change text;',
): Promise<{
  migrationsDirectory: string;
  temporaryDirectory: string;
}> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'lsp-v3-migrations-'));
  const migrationsDirectory = join(temporaryDirectory, 'drizzle');
  await cp(fileURLToPath(new URL('../../../drizzle', import.meta.url)), migrationsDirectory, {
    recursive: true,
  });
  const journalPath = join(migrationsDirectory, 'meta', '_journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8')) as MigrationJournal;
  const previous = journal.entries.at(-1);
  if (previous == null) throw new Error('Expected existing Drizzle migrations');
  journal.entries.push({
    idx: previous.idx + 1,
    version: previous.version,
    when: previous.when + 1,
    tag: 'pending_test_schema_change',
    breakpoints: true,
  });
  await writeFile(journalPath, `${JSON.stringify(journal, null, 2)}\n`);
  await writeFile(join(migrationsDirectory, 'pending_test_schema_change.sql'), `${statement}\n`);
  return { migrationsDirectory, temporaryDirectory };
}

beforeAll(async (): Promise<void> => {
  controlPool = new Pool({ connectionString: sourceDatabaseUrl, max: 1 });
  await controlPool.query(`CREATE DATABASE ${quotePostgresIdentifier(testDatabaseName)}`);
  for (const role of Object.values(runtimeLogins)) await createRuntimeLogin(controlPool, role);

  const adminUrl = databaseUrl(sourceDatabaseUrl, testDatabaseName);
  migrationConfig = loadDatabaseMigrationConfig({
    DATABASE_ADMIN_URL: adminUrl,
    DATABASE_RUNTIME_LOGIN_LUKSO_MAINNET: runtimeLogins['lukso-mainnet'],
    DATABASE_RUNTIME_LOGIN_ETHEREUM_MAINNET: runtimeLogins['ethereum-mainnet'],
    DATABASE_RUNTIME_LOGIN_ETHEREUM_SEPOLIA: runtimeLogins['ethereum-sepolia'],
  });
  await migrateDatabase(migrationConfig);
  testAdminPool = new Pool({ connectionString: adminUrl, max: 2 });

  const ethereum = createRuntimeDatabase('ethereum-mainnet');
  ethereumRuntime = ethereum.runtime;
  ethereumDatabaseConfig = ethereum.config;
  ethereumPool = ethereum.pool;
  ethereumDb = ethereum.db;
  const sepolia = createRuntimeDatabase('ethereum-sepolia');
  sepoliaPool = sepolia.pool;
  sepoliaDb = sepolia.db;
  const lukso = createRuntimeDatabase('lukso-mainnet');
  luksoPool = lukso.pool;
});

afterAll(async (): Promise<void> => {
  await Promise.all([
    ethereumPool?.end(),
    sepoliaPool?.end(),
    luksoPool?.end(),
    testAdminPool?.end(),
  ]);
  if (controlPool != null) {
    await controlPool.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [testDatabaseName],
    );
    await controlPool.query(`DROP DATABASE IF EXISTS ${quotePostgresIdentifier(testDatabaseName)}`);
    for (const role of Object.values(runtimeLogins)) {
      await controlPool.query(`DROP ROLE IF EXISTS ${quotePostgresIdentifier(role)}`);
    }
    await controlPool.end();
  }
});

describe.sequential('PostgreSQL persistence', () => {
  it('migrates all schemas and API views idempotently without public leakage', async () => {
    await migrateDatabase(migrationConfig);
    const tableCounts = await testAdminPool.query<{ schemaname: string; count: string }>(`
      SELECT schemaname, count(*) AS count
      FROM pg_tables
      WHERE schemaname LIKE 'chain_%'
      GROUP BY schemaname
      ORDER BY schemaname
    `);
    expect(tableCounts.rows).toHaveLength(3);
    expect(tableCounts.rows.every(({ count }) => Number(count) === 18)).toBe(true);

    const views = await testAdminPool.query<{ count: string }>(
      `SELECT count(*) AS count FROM pg_views WHERE schemaname = 'api'`,
    );
    expect(Number(views.rows[0]?.count)).toBe(14);

    const enums = await testAdminPool.query<{ schema: string; count: string }>(`
      SELECT n.nspname AS schema, count(*) AS count
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typtype = 'e' AND (n.nspname = '${SHARED_SCHEMA}' OR n.nspname LIKE 'chain_%')
      GROUP BY n.nspname
    `);
    expect(enums.rows).toEqual([{ schema: SHARED_SCHEMA, count: '4' }]);

    const leaked = await testAdminPool.query<{ count: string }>(`
      SELECT count(*) AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('blocks', 'event_facts', 'network_config', 'sqd_cursor')
    `);
    expect(Number(leaked.rows[0]?.count)).toBe(0);

    for (const network of migrationConfig.networks) {
      expect(
        await countRows(
          testAdminPool,
          `${quotePostgresIdentifier(network.schema)}.${quotePostgresIdentifier('__drizzle_migrations')}`,
        ),
      ).toBe(migrationCount);
    }
  });

  it('rejects incomplete finalized block identities', async () => {
    const client = await ethereumPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO blocks (id, network, chain_id, number, hash, parent_hash, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          createBlockId(ethereumRuntime.network.chainId, block0.header.number),
          ethereumRuntime.network.key,
          ethereumRuntime.network.chainId,
          block0.header.number,
          block0.header.hash,
          block0.header.parentHash,
          new Date(block0.header.timestamp),
        ],
      );
      await expect(
        client.query(
          `INSERT INTO indexed_heads (
             network,
             chain_id,
             block_number,
             block_hash,
             block_timestamp,
             finalized_block_number
           ) VALUES ($1, $2, $3, $4, $5, $3)`,
          [
            ethereumRuntime.network.key,
            ethereumRuntime.network.chainId,
            block0.header.number,
            block0.header.hash,
            new Date(block0.header.timestamp),
          ],
        ),
      ).rejects.toMatchObject({ constraint: 'indexed_heads_finalized_pair_check' });
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('recreates API views when their public columns are incompatible', async () => {
    const qualifiedView = `${quotePostgresIdentifier(API_SCHEMA)}.${quotePostgresIdentifier('creators')}`;
    await executeAsRole(testAdminPool, API_OWNER_ROLE, `DROP VIEW ${qualifiedView}`);
    await executeAsRole(
      testAdminPool,
      API_OWNER_ROLE,
      `CREATE VIEW ${qualifiedView} AS SELECT id AS legacy_id FROM ${quotePostgresIdentifier('chain_ethereum_mainnet')}.${quotePostgresIdentifier('creators')}`,
    );

    await expect(migrateDatabase(migrationConfig)).resolves.toBeDefined();
    const columns = await testAdminPool.query<{ columnName: string }>(
      `SELECT column_name AS "columnName"
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [API_SCHEMA, 'creators'],
    );
    expect(columns.rows.map(({ columnName }) => columnName)).toContain('array_index');
    expect(columns.rows.map(({ columnName }) => columnName)).not.toContain('legacy_id');
  });

  it('drops API views before migrating incompatible public-table columns', async () => {
    const scratchDatabaseName = `lsp_v3_view_${suiteSuffix}`;
    const scratchUrl = databaseUrl(sourceDatabaseUrl, scratchDatabaseName);
    const scratchConfig = {
      connectionString: scratchUrl,
      networks: migrationConfig.networks.filter(
        ({ network }) => network.key === 'ethereum-mainnet',
      ),
    };
    const { migrationsDirectory, temporaryDirectory } = await createPendingMigrationDirectory(
      `ALTER TABLE blocks ALTER COLUMN id TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE blocks ALTER COLUMN id TYPE text;
--> statement-breakpoint
ALTER TABLE metadata_jobs_pending_migration RENAME TO metadata_jobs;`,
    );
    let scratchPool: Pool | undefined;
    await controlPool.query(`CREATE DATABASE ${quotePostgresIdentifier(scratchDatabaseName)}`);
    try {
      await migrateDatabase(scratchConfig);
      scratchPool = new Pool({ connectionString: scratchUrl, max: 1 });
      await scratchPool.query(
        'ALTER TABLE chain_ethereum_mainnet.metadata_jobs RENAME TO metadata_jobs_pending_migration',
      );
      await expect(migrateDatabase(scratchConfig, { migrationsDirectory })).resolves.toBeDefined();

      const column = await scratchPool.query<{
        dataType: string;
        maximumLength: number | null;
      }>(
        `SELECT data_type AS "dataType", character_maximum_length AS "maximumLength"
         FROM information_schema.columns
         WHERE table_schema = 'chain_ethereum_mainnet'
           AND table_name = 'blocks'
           AND column_name = 'id'`,
      );
      expect(column.rows[0]).toEqual({ dataType: 'text', maximumLength: null });
      expect(await countRows(scratchPool, 'api.blocks')).toBe(0);
    } finally {
      await scratchPool?.end();
      await controlPool.query(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
        [scratchDatabaseName],
      );
      await controlPool.query(
        `DROP DATABASE IF EXISTS ${quotePostgresIdentifier(scratchDatabaseName)}`,
      );
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('rolls back every network and preserves API views when a later migration fails', async () => {
    const scratchDatabaseName = `lsp_v3_atomic_${suiteSuffix}`;
    const scratchUrl = databaseUrl(sourceDatabaseUrl, scratchDatabaseName);
    const selectedNetworks = ['ethereum-mainnet', 'ethereum-sepolia'].map((networkKey) => {
      const network = migrationConfig.networks.find(({ network }) => network.key === networkKey);
      if (network == null) throw new Error(`Expected migration network ${networkKey}`);
      return network;
    });
    const scratchConfig = { connectionString: scratchUrl, networks: selectedNetworks };
    const { migrationsDirectory, temporaryDirectory } = await createPendingMigrationDirectory(
      `COMMENT ON TABLE blocks IS 'pending cross-network migration';
--> statement-breakpoint
ALTER TABLE metadata_jobs_pending_migration RENAME TO metadata_jobs;`,
    );
    let scratchPool: Pool | undefined;
    await controlPool.query(`CREATE DATABASE ${quotePostgresIdentifier(scratchDatabaseName)}`);
    try {
      await migrateDatabase(scratchConfig);
      scratchPool = new Pool({ connectionString: scratchUrl, max: 1 });
      const viewsBeforeFailure = await scratchPool.query<{ name: string; oid: string }>(`
        SELECT relation.relname AS name, relation.oid::text AS oid
        FROM pg_class relation
        JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'api' AND relation.relkind = 'v'
        ORDER BY relation.relname
      `);
      await scratchPool.query(
        'ALTER TABLE chain_ethereum_mainnet.metadata_jobs RENAME TO metadata_jobs_pending_migration',
      );

      await expect(migrateDatabase(scratchConfig, { migrationsDirectory })).rejects.toThrow(
        'metadata_jobs_pending_migration',
      );

      for (const network of selectedNetworks) {
        expect(
          await countRows(
            scratchPool,
            `${quotePostgresIdentifier(network.schema)}.${quotePostgresIdentifier('__drizzle_migrations')}`,
          ),
        ).toBe(migrationCount);
        const tableComment = await scratchPool.query<{ comment: string | null }>(
          `SELECT obj_description($1::regclass, 'pg_class') AS comment`,
          [`${network.schema}.blocks`],
        );
        expect(tableComment.rows[0]?.comment).toBeNull();
      }
      expect(await countRows(scratchPool, 'api.blocks')).toBe(0);
      const viewsAfterFailure = await scratchPool.query<{ name: string; oid: string }>(`
        SELECT relation.relname AS name, relation.oid::text AS oid
        FROM pg_class relation
        JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'api' AND relation.relkind = 'v'
        ORDER BY relation.relname
      `);
      expect(viewsAfterFailure.rows).toEqual(viewsBeforeFailure.rows);
      expect(viewsAfterFailure.rows).toHaveLength(14);
    } finally {
      await scratchPool?.end();
      await controlPool.query(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
        [scratchDatabaseName],
      );
      await controlPool.query(
        `DROP DATABASE IF EXISTS ${quotePostgresIdentifier(scratchDatabaseName)}`,
      );
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('stores the full unsigned 128-bit ERC725Y array-index range', async () => {
    const issuerAddress = addressFor(230);
    const assetAddress = addressFor(231);
    const creatorAddress = addressFor(232);
    const blockHash = hashFor(230);
    const arrayIndex = (1n << 128n) - 1n;

    await ethereumDb.insert(universalProfiles).values({
      id: createAddressId('profile', ethereumRuntime.network.chainId, issuerAddress),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: issuerAddress,
      lastBlockNumber: 0,
      lastBlockHash: blockHash,
    });
    await ethereumDb.insert(digitalAssets).values({
      id: createAddressId('asset', ethereumRuntime.network.chainId, assetAddress),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: assetAddress,
      lastBlockNumber: 0,
      lastBlockHash: blockHash,
    });
    try {
      await ethereumDb.insert(creators).values({
        id: 'large-creator-array-index',
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        assetAddress,
        creatorAddress,
        arrayIndex,
        lastBlockNumber: 0,
        lastBlockHash: blockHash,
      });
      await ethereumDb.insert(issuedAssets).values({
        id: 'large-issued-asset-array-index',
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        issuerAddress,
        assetAddress,
        arrayIndex,
        lastBlockNumber: 0,
        lastBlockHash: blockHash,
      });

      expect(
        (
          await ethereumDb
            .select()
            .from(creators)
            .where(eq(creators.id, 'large-creator-array-index'))
        )[0]?.arrayIndex,
      ).toBe(arrayIndex);
      expect(
        (
          await ethereumDb
            .select()
            .from(issuedAssets)
            .where(eq(issuedAssets.id, 'large-issued-asset-array-index'))
        )[0]?.arrayIndex,
      ).toBe(arrayIndex);
    } finally {
      await ethereumDb.delete(digitalAssets).where(eq(digitalAssets.address, assetAddress));
      await ethereumDb
        .delete(universalProfiles)
        .where(eq(universalProfiles.address, issuerAddress));
    }
  });

  it('rejects duplicate network keys and schemas at the migration API boundary', async () => {
    const ethereum = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    const sepolia = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-sepolia',
    );
    if (ethereum == null || sepolia == null) throw new Error('Expected Ethereum test networks');

    await expect(
      migrateDatabase({ ...migrationConfig, networks: [ethereum, ethereum] }),
    ).rejects.toThrow('Migration networks contain duplicate network keys: ethereum-mainnet');
    await expect(
      migrateDatabase({
        ...migrationConfig,
        networks: [ethereum, { ...sepolia, schema: ethereum.schema }],
      }),
    ).rejects.toThrow(`Migration networks contain duplicate schemas: ${ethereum.schema}`);
  });

  it('rejects reserved and noncanonical migration schemas and writer roles', async () => {
    const ethereum = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereum == null) throw new Error('Expected the Ethereum migration network');

    await expect(
      migrateDatabase({
        ...migrationConfig,
        networks: [
          {
            ...ethereum,
            network: { ...ethereum.network, chainId: ethereum.network.chainId + 1 },
          },
        ],
      }),
    ).rejects.toThrow(
      'Migration network "ethereum-mainnet" must use catalog chain ID 1; received 2',
    );

    await expect(
      migrateDatabase({
        ...migrationConfig,
        networks: migrationConfig.networks.map((network) =>
          network === ethereum ? { ...network, schema: SHARED_SCHEMA } : network,
        ),
      }),
    ).rejects.toThrow(
      `Migration network "ethereum-mainnet" must not use reserved schema "${SHARED_SCHEMA}"`,
    );
    await expect(
      migrateDatabase({
        ...migrationConfig,
        networks: migrationConfig.networks.map((network) =>
          network === ethereum ? { ...network, schema: 'chain_noncanonical' } : network,
        ),
      }),
    ).rejects.toThrow(
      'Migration network "ethereum-mainnet" must use canonical schema "chain_ethereum_mainnet"; received "chain_noncanonical"',
    );
    await expect(
      migrateDatabase({
        ...migrationConfig,
        networks: migrationConfig.networks.map((network) =>
          network === ethereum ? { ...network, role: API_OWNER_ROLE } : network,
        ),
      }),
    ).rejects.toThrow(
      `Migration network "ethereum-mainnet" must not use reserved writer role "${API_OWNER_ROLE}"`,
    );
    await expect(
      migrateDatabase({
        ...migrationConfig,
        networks: migrationConfig.networks.map((network) =>
          network === ethereum ? { ...network, role: 'lsp_v3_noncanonical_writer' } : network,
        ),
      }),
    ).rejects.toThrow(
      'Migration network "ethereum-mainnet" must use canonical writer role "lsp_v3_chain_ethereum_mainnet_writer"; received "lsp_v3_noncanonical_writer"',
    );
  });

  it('rejects unsafe attributes on pre-existing deterministic roles', async () => {
    const ethereumRole = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    )?.role;
    if (ethereumRole == null) throw new Error('Expected the Ethereum writer role');

    for (const role of [API_OWNER_ROLE, ethereumRole]) {
      await controlPool.query(`ALTER ROLE ${quotePostgresIdentifier(role)} LOGIN INHERIT`);
      try {
        await expect(migrateDatabase(migrationConfig)).rejects.toThrow('NOLOGIN, NOINHERIT');
      } finally {
        await controlPool.query(`ALTER ROLE ${quotePostgresIdentifier(role)} NOLOGIN NOINHERIT`);
      }
    }
  });

  it('rejects memberships on pre-existing deterministic roles', async () => {
    const ethereumRole = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    )?.role;
    if (ethereumRole == null) throw new Error('Expected the Ethereum writer role');
    const bridgeRole = `v3_test_bridge_${suiteSuffix}`;
    const parentRole = `v3_test_parent_${suiteSuffix}`;

    await controlPool.query(`CREATE ROLE ${quotePostgresIdentifier(bridgeRole)} NOLOGIN NOINHERIT`);
    await controlPool.query(`CREATE ROLE ${quotePostgresIdentifier(parentRole)} NOLOGIN NOINHERIT`);
    try {
      await controlPool.query(
        `GRANT ${quotePostgresIdentifier(parentRole)} TO ${quotePostgresIdentifier(bridgeRole)}`,
      );
      await controlPool.query(
        `GRANT ${quotePostgresIdentifier(bridgeRole)} TO ${quotePostgresIdentifier(ethereumRole)}`,
      );
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Existing database role "${ethereumRole}" must not be a member of other roles: ${bridgeRole}, ${parentRole}`,
      );
    } finally {
      await controlPool.query(
        `REVOKE ${quotePostgresIdentifier(bridgeRole)} FROM ${quotePostgresIdentifier(ethereumRole)}`,
      );
      await controlPool.query(
        `REVOKE ${quotePostgresIdentifier(parentRole)} FROM ${quotePostgresIdentifier(bridgeRole)}`,
      );
      await controlPool.query(`DROP ROLE ${quotePostgresIdentifier(bridgeRole)}`);
      await controlPool.query(`DROP ROLE ${quotePostgresIdentifier(parentRole)}`);
    }
  });

  it('rejects stale direct members of the API owner role', async () => {
    const retiredAdmin = `v3_test_retired_admin_${suiteSuffix}`;
    await controlPool.query(`CREATE ROLE ${quotePostgresIdentifier(retiredAdmin)} LOGIN`);
    try {
      await controlPool.query(
        `GRANT ${quotePostgresIdentifier(API_OWNER_ROLE)} TO ${quotePostgresIdentifier(retiredAdmin)}`,
      );
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `API owner role "${API_OWNER_ROLE}" has unexpected direct or transitive members: ${retiredAdmin}. Revoke their membership before retrying`,
      );
    } finally {
      await controlPool.query(
        `REVOKE ${quotePostgresIdentifier(API_OWNER_ROLE)} FROM ${quotePostgresIdentifier(retiredAdmin)}`,
      );
      await controlPool.query(`DROP ROLE ${quotePostgresIdentifier(retiredAdmin)}`);
    }
  });

  it('rejects pre-existing shared enums with mismatched labels', async () => {
    const enumName = 'metadata_job_status';
    const expectedLabel = SHARED_ENUMS[enumName][1];
    const unexpectedLabel = 'unexpected_processing';
    const qualifiedEnum = `${quotePostgresIdentifier(SHARED_SCHEMA)}.${quotePostgresIdentifier(enumName)}`;
    await executeAsRole(
      testAdminPool,
      API_OWNER_ROLE,
      `ALTER TYPE ${qualifiedEnum} RENAME VALUE '${expectedLabel}' TO '${unexpectedLabel}'`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Existing shared type "${SHARED_SCHEMA}.${enumName}" must be an enum with labels in this order`,
      );
    } finally {
      await executeAsRole(
        testAdminPool,
        API_OWNER_ROLE,
        `ALTER TYPE ${qualifiedEnum} RENAME VALUE '${unexpectedLabel}' TO '${expectedLabel}'`,
      );
    }
  });

  it('rejects unexpected objects in the shared enum schema', async () => {
    const routineName = 'unexpected_shared_data';
    const qualifiedRoutine = `${quotePostgresIdentifier(SHARED_SCHEMA)}.${quotePostgresIdentifier(routineName)}`;
    await executeAsRole(
      testAdminPool,
      API_OWNER_ROLE,
      `CREATE FUNCTION ${qualifiedRoutine}() RETURNS text LANGUAGE sql SECURITY DEFINER AS $$ SELECT 'secret'::text $$`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Shared schema "${SHARED_SCHEMA}" contains unexpected objects: ${routineName}() (function)`,
      );
    } finally {
      await executeAsRole(testAdminPool, API_OWNER_ROLE, `DROP FUNCTION ${qualifiedRoutine}()`);
    }
  });

  it('rejects unexpected API relations instead of granting reader access', async () => {
    const relationName = 'unexpected_internal_data';
    const qualifiedRelation = `${quotePostgresIdentifier(API_SCHEMA)}.${quotePostgresIdentifier(relationName)}`;
    await executeAsRole(
      testAdminPool,
      API_OWNER_ROLE,
      `CREATE TABLE ${qualifiedRelation} (secret text NOT NULL)`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `API schema contains unexpected relations: ${relationName} (r)`,
      );
      const privilege = await testAdminPool.query<{ allowed: boolean }>(
        `SELECT has_table_privilege($1, $2, 'SELECT') AS allowed`,
        [API_READER_ROLE, `${API_SCHEMA}.${relationName}`],
      );
      expect(privilege.rows[0]?.allowed).toBe(false);
    } finally {
      await executeAsRole(testAdminPool, API_OWNER_ROLE, `DROP TABLE ${qualifiedRelation}`);
    }
  });

  it('rejects unexpected API routines', async () => {
    const routineName = 'unexpected_internal_data';
    const qualifiedRoutine = `${quotePostgresIdentifier(API_SCHEMA)}.${quotePostgresIdentifier(routineName)}`;
    await executeAsRole(
      testAdminPool,
      API_OWNER_ROLE,
      `CREATE FUNCTION ${qualifiedRoutine}() RETURNS text LANGUAGE sql SECURITY DEFINER AS $$ SELECT 'secret'::text $$`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `API schema contains unexpected routines: ${routineName}() (function)`,
      );
    } finally {
      await executeAsRole(testAdminPool, API_OWNER_ROLE, `DROP FUNCTION ${qualifiedRoutine}()`);
    }
  });

  it('rejects API reader privileges outside the approved views', async () => {
    const schemaName = 'chain_ethereum_mainnet';
    const qualifiedJobs = `${quotePostgresIdentifier(schemaName)}.${quotePostgresIdentifier('metadata_jobs')}`;
    await testAdminPool.query(
      `GRANT USAGE ON SCHEMA ${quotePostgresIdentifier(schemaName)} TO ${quotePostgresIdentifier(API_READER_ROLE)}`,
    );
    await testAdminPool.query(
      `GRANT SELECT ON ${qualifiedJobs} TO ${quotePostgresIdentifier(API_READER_ROLE)}`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `API reader role "${API_READER_ROLE}" has privileges outside the approved API boundary: ${schemaName}.metadata_jobs (relation SELECT via ${API_READER_ROLE}), ${schemaName} (schema USAGE via ${API_READER_ROLE})`,
      );
    } finally {
      await testAdminPool.query(
        `REVOKE SELECT ON ${qualifiedJobs} FROM ${quotePostgresIdentifier(API_READER_ROLE)}`,
      );
      await testAdminPool.query(
        `REVOKE USAGE ON SCHEMA ${quotePostgresIdentifier(schemaName)} FROM ${quotePostgresIdentifier(API_READER_ROLE)}`,
      );
    }
  });

  it('rejects user-defined routines executable through PUBLIC', async () => {
    const routineName = `v3_test_public_routine_${suiteSuffix}`;
    const qualifiedRoutine = `${quotePostgresIdentifier('public')}.${quotePostgresIdentifier(routineName)}`;
    await testAdminPool.query(
      `CREATE FUNCTION ${qualifiedRoutine}() RETURNS text LANGUAGE sql SECURITY DEFINER AS $$ SELECT 'secret'::text $$`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `API reader role "${API_READER_ROLE}" has privileges outside the approved API boundary: public.${routineName}() (routine EXECUTE via PUBLIC)`,
      );
    } finally {
      await testAdminPool.query(`DROP FUNCTION ${qualifiedRoutine}()`);
    }
  });

  it('rejects runtime CREATE inherited through PUBLIC', async () => {
    await testAdminPool.query(
      `GRANT CREATE ON SCHEMA ${quotePostgresIdentifier('public')} TO PUBLIC`,
    );
    try {
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        'Database credential inherits unexpected PUBLIC privileges: public (schema CREATE)',
      );
    } finally {
      await testAdminPool.query(
        `REVOKE CREATE ON SCHEMA ${quotePostgresIdentifier('public')} FROM PUBLIC`,
      );
    }
  });

  it('rejects runtime execution of a default-public SECURITY DEFINER routine', async () => {
    const routineName = `v3_test_runtime_public_${suiteSuffix}`;
    const qualifiedRoutine = `${quotePostgresIdentifier('public')}.${quotePostgresIdentifier(routineName)}`;
    await testAdminPool.query(
      `CREATE FUNCTION ${qualifiedRoutine}() RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$`,
    );
    try {
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        `Database credential inherits unexpected PUBLIC privileges: public.${routineName}() (routine EXECUTE)`,
      );
    } finally {
      await testAdminPool.query(`DROP FUNCTION ${qualifiedRoutine}()`);
    }
  });

  it('normalizes PUBLIC usage on approved API view types before enforcing the boundary', async () => {
    const qualifiedType = `${quotePostgresIdentifier(API_SCHEMA)}.${quotePostgresIdentifier('blocks')}`;
    await executeAsRole(
      testAdminPool,
      API_OWNER_ROLE,
      `GRANT USAGE ON TYPE ${qualifiedType} TO PUBLIC`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).resolves.toBeDefined();
      const publicUsage = await testAdminPool.query<{ allowed: boolean }>(
        `SELECT EXISTS (
           SELECT 1
           FROM pg_type granted_type
           JOIN pg_namespace namespace ON namespace.oid = granted_type.typnamespace
           CROSS JOIN LATERAL aclexplode(granted_type.typacl) acl
           WHERE namespace.nspname = $1
             AND granted_type.typname = $2
             AND acl.grantee = 0
             AND acl.privilege_type = 'USAGE'
         ) AS allowed`,
        [API_SCHEMA, 'blocks'],
      );
      expect(publicUsage.rows[0]?.allowed).toBe(false);
    } finally {
      await executeAsRole(
        testAdminPool,
        API_OWNER_ROLE,
        `REVOKE USAGE ON TYPE ${qualifiedType} FROM PUBLIC`,
      );
    }
  });

  it('allows only non-grantable direct CONNECT for a runtime login', async () => {
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    await testAdminPool.query(
      `GRANT CONNECT ON DATABASE ${quotePostgresIdentifier(testDatabaseName)} TO ${quotePostgresIdentifier(runtimeLogin)}`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).resolves.toBeDefined();
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).resolves.toBeDefined();
    } finally {
      await testAdminPool.query(
        `REVOKE CONNECT ON DATABASE ${quotePostgresIdentifier(testDatabaseName)} FROM ${quotePostgresIdentifier(runtimeLogin)}`,
      );
    }
  });

  it('rejects direct privileges held by runtime logins during migration and startup', async () => {
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    await testAdminPool.query(
      `GRANT CREATE ON SCHEMA ${quotePostgresIdentifier(API_SCHEMA)} TO ${quotePostgresIdentifier(runtimeLogin)}`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Configured runtime login "${runtimeLogin}" has direct privileges, ownership, or policy references outside its writer role: schema ${API_SCHEMA} (ACL)`,
      );
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        `Database session user "${runtimeLogin}" has direct privileges, ownership, or policy references outside its writer role: schema ${API_SCHEMA} (ACL)`,
      );
    } finally {
      await testAdminPool.query(
        `REVOKE CREATE ON SCHEMA ${quotePostgresIdentifier(API_SCHEMA)} FROM ${quotePostgresIdentifier(runtimeLogin)}`,
      );
    }
  });

  it('rejects database objects owned by runtime logins during migration and startup', async () => {
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    const schemaName = `v3_test_runtime_owned_${suiteSuffix}`;
    await testAdminPool.query(
      `CREATE SCHEMA ${quotePostgresIdentifier(schemaName)} AUTHORIZATION ${quotePostgresIdentifier(runtimeLogin)}`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Configured runtime login "${runtimeLogin}" has direct privileges, ownership, or policy references outside its writer role: schema ${schemaName} (ownership)`,
      );
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        `Database session user "${runtimeLogin}" has direct privileges, ownership, or policy references outside its writer role: schema ${schemaName} (ownership)`,
      );
    } finally {
      await testAdminPool.query(`DROP SCHEMA ${quotePostgresIdentifier(schemaName)}`);
    }
  });

  it('rejects elevated runtime login capabilities', async () => {
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    await controlPool.query(`ALTER ROLE ${quotePostgresIdentifier(runtimeLogin)} SUPERUSER`);
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow('NOSUPERUSER');
    } finally {
      await controlPool.query(`ALTER ROLE ${quotePostgresIdentifier(runtimeLogin)} NOSUPERUSER`);
    }
  });

  it('rejects ADMIN OPTION on a runtime writer membership', async () => {
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    const ethereumRole = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    )?.role;
    if (ethereumRole == null) throw new Error('Expected the Ethereum writer role');

    await controlPool.query(
      `GRANT ${quotePostgresIdentifier(ethereumRole)} TO ${quotePostgresIdentifier(runtimeLogin)} WITH ADMIN OPTION`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Configured runtime login "${runtimeLogin}" must not hold ADMIN OPTION on "${ethereumRole}"`,
      );
    } finally {
      await controlPool.query(
        `REVOKE ADMIN OPTION FOR ${quotePostgresIdentifier(ethereumRole)} FROM ${quotePostgresIdentifier(runtimeLogin)}`,
      );
    }
  });

  it('rejects a runtime writer membership without SET OPTION', async () => {
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    const ethereumRole = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    )?.role;
    if (ethereumRole == null) throw new Error('Expected the Ethereum writer role');

    await controlPool.query(
      `GRANT ${quotePostgresIdentifier(ethereumRole)} TO ${quotePostgresIdentifier(runtimeLogin)} WITH SET FALSE`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Configured runtime login "${runtimeLogin}" must hold SET OPTION on "${ethereumRole}"`,
      );
    } finally {
      await controlPool.query(
        `GRANT ${quotePostgresIdentifier(ethereumRole)} TO ${quotePostgresIdentifier(runtimeLogin)} WITH SET TRUE`,
      );
    }
  });

  it('rejects read privileges held by a writer in another network schema', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const foreignTable = `${quotePostgresIdentifier('chain_lukso_mainnet')}.${quotePostgresIdentifier('metadata_jobs')}`;

    await testAdminPool.query(
      `GRANT SELECT ON ${foreignTable} TO ${quotePostgresIdentifier(ethereumNetwork.role)}`,
    );
    try {
      const expectedError = `Database writer role "${ethereumNetwork.role}" has privileges, ownership, default privileges, or policy references outside assigned schema "${ethereumNetwork.schema}": table chain_lukso_mainnet.metadata_jobs (ACL)`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await testAdminPool.query(
        `REVOKE SELECT ON ${foreignTable} FROM ${quotePostgresIdentifier(ethereumNetwork.role)}`,
      );
    }
  });

  it('requires the writer to own every expected chain object', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const owner = await testAdminPool.query<{ role: string }>('SELECT current_user AS role');
    const adminRole = owner.rows[0]?.role;
    if (adminRole == null) throw new Error('Expected the migration admin role');
    const qualifiedJobs = `${quotePostgresIdentifier(ethereumNetwork.schema)}.${quotePostgresIdentifier('metadata_jobs')}`;
    await testAdminPool.query(`ALTER TABLE ${qualifiedJobs} OWNER TO CURRENT_USER`);
    try {
      const expectedError = `Database writer role "${ethereumNetwork.role}" must own every expected object in schema "${ethereumNetwork.schema}": metadata_jobs (table owned by ${adminRole})`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await testAdminPool.query(
        `ALTER TABLE ${qualifiedJobs} OWNER TO ${quotePostgresIdentifier(ethereumNetwork.role)}`,
      );
    }
  });

  it('rejects live chain schemas that drift from the reviewed catalog', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const qualifiedFacts = `${quotePostgresIdentifier(ethereumNetwork.schema)}.${quotePostgresIdentifier('event_facts')}`;
    const constraint = quotePostgresIdentifier('event_facts_block_fk');

    await testAdminPool.query(`ALTER TABLE ${qualifiedFacts} DROP CONSTRAINT ${constraint}`);
    try {
      const expectedError = `Database schema "${ethereumNetwork.schema}" fingerprint is`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await testAdminPool.query(
        `ALTER TABLE ${qualifiedFacts} ADD CONSTRAINT ${constraint} FOREIGN KEY (chain_id, block_number, block_hash) REFERENCES ${quotePostgresIdentifier(ethereumNetwork.schema)}.${quotePostgresIdentifier('blocks')} (chain_id, number, hash) ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }

    await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).resolves.toBeDefined();
  });

  it('allows pending migrations to introduce missing latest-schema tables', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const qualifiedJobs = `${quotePostgresIdentifier(ethereumNetwork.schema)}.${quotePostgresIdentifier('metadata_jobs')}`;
    const pendingJobs = quotePostgresIdentifier('metadata_jobs_pending_migration');
    await testAdminPool.query(`ALTER TABLE ${qualifiedJobs} RENAME TO ${pendingJobs}`);
    try {
      const partialInventory = await ethereumDb.execute<ChainObjectOwnershipRow>(
        createChainObjectOwnershipQuery(ethereumNetwork.role, ethereumNetwork.schema, false),
      );
      expect(partialInventory.rows).not.toContainEqual(
        expect.objectContaining({ objectName: 'metadata_jobs' }),
      );

      const completeInventory = await ethereumDb.execute<ChainObjectOwnershipRow>(
        createChainObjectOwnershipQuery(ethereumNetwork.role, ethereumNetwork.schema),
      );
      expect(completeInventory.rows).toContainEqual({
        objectName: 'metadata_jobs',
        objectType: 'table',
        owner: null,
      });
    } finally {
      await testAdminPool.query(
        `ALTER TABLE ${quotePostgresIdentifier(ethereumNetwork.schema)}.${pendingJobs} RENAME TO ${quotePostgresIdentifier('metadata_jobs')}`,
      );
    }
  });

  it('requires the writer to own the migration history sequence', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const owner = await testAdminPool.query<{ role: string }>('SELECT current_user AS role');
    const adminRole = owner.rows[0]?.role;
    if (adminRole == null) throw new Error('Expected the migration admin role');
    const qualifiedSchema = quotePostgresIdentifier(ethereumNetwork.schema);
    const qualifiedSequence = `${qualifiedSchema}.${quotePostgresIdentifier('__drizzle_migrations_id_seq')}`;
    const qualifiedMigrationTable = `${qualifiedSchema}.${quotePostgresIdentifier('__drizzle_migrations')}`;
    await testAdminPool.query(`ALTER SEQUENCE ${qualifiedSequence} OWNED BY NONE`);
    await testAdminPool.query(`ALTER SEQUENCE ${qualifiedSequence} OWNER TO CURRENT_USER`);
    try {
      const expectedError = `Database writer role "${ethereumNetwork.role}" must own every expected object in schema "${ethereumNetwork.schema}": __drizzle_migrations_id_seq (sequence owned by ${adminRole})`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await testAdminPool.query(
        `ALTER SEQUENCE ${qualifiedSequence} OWNER TO ${quotePostgresIdentifier(ethereumNetwork.role)}`,
      );
      await testAdminPool.query(
        `ALTER SEQUENCE ${qualifiedSequence} OWNED BY ${qualifiedMigrationTable}.id`,
      );
    }
  });

  it('rejects CREATE on the shared schema and grantable shared-enum usage', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const quotedWriter = quotePostgresIdentifier(ethereumNetwork.role);
    const qualifiedType = `${quotePostgresIdentifier(SHARED_SCHEMA)}.${quotePostgresIdentifier('verification_status')}`;

    await testAdminPool.query(
      `GRANT CREATE ON SCHEMA ${quotePostgresIdentifier(SHARED_SCHEMA)} TO ${quotedWriter}`,
    );
    try {
      const expectedError = `Database writer role "${ethereumNetwork.role}" has privileges, ownership, default privileges, or policy references outside assigned schema "${ethereumNetwork.schema}": schema ${SHARED_SCHEMA} (ACL)`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await testAdminPool.query(
        `REVOKE CREATE ON SCHEMA ${quotePostgresIdentifier(SHARED_SCHEMA)} FROM ${quotedWriter}`,
      );
    }

    await testAdminPool.query(
      `GRANT USAGE ON TYPE ${qualifiedType} TO ${quotedWriter} WITH GRANT OPTION`,
    );
    try {
      const expectedError = `Database writer role "${ethereumNetwork.role}" has privileges, ownership, default privileges, or policy references outside assigned schema "${ethereumNetwork.schema}"`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await testAdminPool.query(
        `REVOKE GRANT OPTION FOR USAGE ON TYPE ${qualifiedType} FROM ${quotedWriter}`,
      );
    }
  });

  it('rejects schemas and objects owned by a writer outside its network schema', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const schemaName = `v3_test_writer_owned_${suiteSuffix}`;
    const quotedSchema = quotePostgresIdentifier(schemaName);
    const quotedWriter = quotePostgresIdentifier(ethereumNetwork.role);

    await testAdminPool.query(`CREATE SCHEMA ${quotedSchema} AUTHORIZATION ${quotedWriter}`);
    await executeAsRole(
      testAdminPool,
      ethereumNetwork.role,
      `CREATE TABLE ${quotedSchema}.items (id integer)`,
    );
    try {
      const expectedError = `Database writer role "${ethereumNetwork.role}" has privileges, ownership, default privileges, or policy references outside assigned schema "${ethereumNetwork.schema}"`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await testAdminPool.query(`DROP SCHEMA ${quotedSchema} CASCADE`);
    }
  });

  it('rejects foreign default privileges and policy references held by a writer', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    const luksoNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'lukso-mainnet',
    );
    if (ethereumNetwork == null || luksoNetwork == null) {
      throw new Error('Expected the Ethereum and LUKSO migration networks');
    }
    const quotedWriter = quotePostgresIdentifier(ethereumNetwork.role);
    const expectedError = `Database writer role "${ethereumNetwork.role}" has privileges, ownership, default privileges, or policy references outside assigned schema "${ethereumNetwork.schema}"`;

    await executeAsRole(
      testAdminPool,
      luksoNetwork.role,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA ${quotePostgresIdentifier(luksoNetwork.schema)} GRANT SELECT ON TABLES TO ${quotedWriter}`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await executeAsRole(
        testAdminPool,
        luksoNetwork.role,
        `ALTER DEFAULT PRIVILEGES IN SCHEMA ${quotePostgresIdentifier(luksoNetwork.schema)} REVOKE SELECT ON TABLES FROM ${quotedWriter}`,
      );
    }

    const policyName = `v3_test_writer_policy_${suiteSuffix}`;
    const qualifiedJobs = `${quotePostgresIdentifier(luksoNetwork.schema)}.${quotePostgresIdentifier('metadata_jobs')}`;
    await executeAsRole(
      testAdminPool,
      luksoNetwork.role,
      `CREATE POLICY ${quotePostgresIdentifier(policyName)} ON ${qualifiedJobs} TO ${quotedWriter} USING (true)`,
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await executeAsRole(
        testAdminPool,
        luksoNetwork.role,
        `DROP POLICY ${quotePostgresIdentifier(policyName)} ON ${qualifiedJobs}`,
      );
    }
  });

  it('rejects direct and transitive runtime memberships outside the assigned writer role', async () => {
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    const bridgeRole = `v3_test_runtime_bridge_${suiteSuffix}`;
    const parentRole = `v3_test_runtime_parent_${suiteSuffix}`;
    const ethereumRole = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    )?.role;
    if (ethereumRole == null) throw new Error('Expected the Ethereum writer role');

    await controlPool.query(`CREATE ROLE ${quotePostgresIdentifier(bridgeRole)} NOLOGIN NOINHERIT`);
    await controlPool.query(`CREATE ROLE ${quotePostgresIdentifier(parentRole)} NOLOGIN NOINHERIT`);
    try {
      await controlPool.query(
        `GRANT ${quotePostgresIdentifier(parentRole)} TO ${quotePostgresIdentifier(bridgeRole)}`,
      );
      await controlPool.query(
        `GRANT ${quotePostgresIdentifier(bridgeRole)} TO ${quotePostgresIdentifier(runtimeLogin)}`,
      );
      const unexpectedRoles = `${bridgeRole}, ${parentRole}`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Configured runtime login "${runtimeLogin}" must not be a member of roles other than "${ethereumRole}": ${unexpectedRoles}`,
      );
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        `Database session user can assume roles outside "${ethereumRole}": ${unexpectedRoles}`,
      );
    } finally {
      await controlPool.query(
        `REVOKE ${quotePostgresIdentifier(bridgeRole)} FROM ${quotePostgresIdentifier(runtimeLogin)}`,
      );
      await controlPool.query(
        `REVOKE ${quotePostgresIdentifier(parentRole)} FROM ${quotePostgresIdentifier(bridgeRole)}`,
      );
      await controlPool.query(`DROP ROLE ${quotePostgresIdentifier(bridgeRole)}`);
      await controlPool.query(`DROP ROLE ${quotePostgresIdentifier(parentRole)}`);
    }
  });

  it('rejects stale direct and transitive members of a network writer role', async () => {
    const ethereumRole = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    )?.role;
    if (ethereumRole == null) throw new Error('Expected the Ethereum writer role');
    const retiredLogin = `v3_test_retired_${suiteSuffix}`;
    const bridgeRole = `v3_test_writer_bridge_${suiteSuffix}`;

    await controlPool.query(`CREATE ROLE ${quotePostgresIdentifier(retiredLogin)} LOGIN`);
    await controlPool.query(`CREATE ROLE ${quotePostgresIdentifier(bridgeRole)} NOLOGIN NOINHERIT`);
    try {
      await controlPool.query(
        `GRANT ${quotePostgresIdentifier(ethereumRole)} TO ${quotePostgresIdentifier(bridgeRole)}`,
      );
      await controlPool.query(
        `GRANT ${quotePostgresIdentifier(bridgeRole)} TO ${quotePostgresIdentifier(retiredLogin)}`,
      );
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Database writer role "${ethereumRole}" has unexpected direct or transitive members: ${retiredLogin}, ${bridgeRole}. Revoke their membership before retrying`,
      );
    } finally {
      await controlPool.query(
        `REVOKE ${quotePostgresIdentifier(bridgeRole)} FROM ${quotePostgresIdentifier(retiredLogin)}`,
      );
      await controlPool.query(
        `REVOKE ${quotePostgresIdentifier(ethereumRole)} FROM ${quotePostgresIdentifier(bridgeRole)}`,
      );
      await controlPool.query(`DROP ROLE ${quotePostgresIdentifier(retiredLogin)}`);
      await controlPool.query(`DROP ROLE ${quotePostgresIdentifier(bridgeRole)}`);
    }
  });

  it('rejects concurrent migration commands', async () => {
    const lockClient = await testAdminPool.connect();
    try {
      await lockClient.query(
        "SELECT pg_advisory_lock(hashtext('lsp-indexer-v3:database-migration')::bigint)",
      );
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        'Another v3 database migration is already running',
      );
    } finally {
      await lockClient.query(
        "SELECT pg_advisory_unlock(hashtext('lsp-indexer-v3:database-migration')::bigint)",
      );
      lockClient.release();
    }
  });

  it('rejects a second identity in an existing network schema', async () => {
    const schemaName = 'chain_ethereum_mainnet';
    await testAdminPool.query(
      `INSERT INTO ${quotePostgresIdentifier(schemaName)}.network_config (network, chain_id, schema_version)
       VALUES ('unexpected-network', 999, $1)`,
      [DATABASE_SCHEMA_VERSION],
    );
    try {
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
        `Network schema "${schemaName}" contains unexpected identities: ethereum-mainnet:1, unexpected-network:999; expected only ethereum-mainnet:1`,
      );
    } finally {
      await testAdminPool.query(
        `DELETE FROM ${quotePostgresIdentifier(schemaName)}.network_config WHERE network = 'unexpected-network' AND chain_id = 999`,
      );
    }
  });

  it('enforces the runtime role, search path, chain identity, and schema version', async () => {
    const readiness = await verifyDatabaseReadiness(ethereumDb, ethereumRuntime);
    expect(readiness).toMatchObject({
      currentRole: 'lsp_v3_chain_ethereum_mainnet_writer',
      currentSchema: 'chain_ethereum_mainnet',
      network: 'ethereum-mainnet',
      chainId: 1,
      schemaVersion: DATABASE_SCHEMA_VERSION,
    });

    await testAdminPool.query(
      'UPDATE chain_ethereum_mainnet.network_config SET schema_version = $1',
      [DATABASE_SCHEMA_VERSION + 1],
    );
    try {
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        `expected ${DATABASE_SCHEMA_VERSION}`,
      );
    } finally {
      await testAdminPool.query(
        'UPDATE chain_ethereum_mainnet.network_config SET schema_version = $1',
        [DATABASE_SCHEMA_VERSION],
      );
    }
  });

  it('rejects credentials that can assume another network writer role', async () => {
    const sepoliaRole = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-sepolia',
    )?.role;
    if (sepoliaRole == null) throw new Error('Expected the Sepolia writer role');
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    await controlPool.query(
      `GRANT ${quotePostgresIdentifier(sepoliaRole)} TO ${quotePostgresIdentifier(runtimeLogin)}`,
    );
    try {
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        'roles outside',
      );
    } finally {
      await controlPool.query(
        `REVOKE ${quotePostgresIdentifier(sepoliaRole)} FROM ${quotePostgresIdentifier(runtimeLogin)}`,
      );
    }
  });

  it('allows natural-key collisions across chains and denies cross-schema writes', async () => {
    const hash = hashFor(90);
    const common = {
      address: collisionAddress,
      ownerAddress: null,
      verification: 'verified' as const,
      lastBlockNumber: 0,
      lastBlockHash: hash,
    };
    await ethereumDb.insert(universalProfiles).values({
      ...common,
      id: createAddressId('profile', 1, collisionAddress),
      network: 'ethereum-mainnet',
      chainId: 1,
    });
    await sepoliaDb.insert(universalProfiles).values({
      ...common,
      id: createAddressId('profile', 11_155_111, collisionAddress),
      network: 'ethereum-sepolia',
      chainId: 11_155_111,
    });

    const apiRows = await testAdminPool.query<{ network: string; chainId: string }>(
      `SELECT network, chain_id AS "chainId" FROM api.universal_profiles WHERE address = $1 ORDER BY chain_id`,
      [collisionAddress],
    );
    expect(apiRows.rows).toEqual([
      { network: 'ethereum-mainnet', chainId: '1' },
      { network: 'ethereum-sepolia', chainId: '11155111' },
    ]);

    await expect(
      ethereumPool.query(
        `INSERT INTO chain_lukso_mainnet.blocks (id, network, chain_id, number, hash, parent_hash, timestamp)
         VALUES ('forbidden', 'lukso-mainnet', 42, 1, $1, $2, now())`,
        [hashFor(91), hashFor(92)],
      ),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('keeps data, current state, jobs, indexed head, and cursor atomic', async () => {
    target = createTestTarget();
    await runBlocks(target, [block1, block2]);

    const profile = await ethereumDb
      .select()
      .from(universalProfiles)
      .where(eq(universalProfiles.address, testAddress));
    expect(profile[0]).toMatchObject({ ownerAddress: secondOwner, lastBlockNumber: 2 });
    expect(await countRows(ethereumPool, 'blocks')).toBe(2);
    expect(await countRows(ethereumPool, 'event_facts')).toBe(2);
    expect(await countRows(ethereumPool, 'metadata_jobs')).toBe(1);
    expect(await countRows(ethereumPool, 'sqd_cursor')).toBe(2);

    const head = await ethereumDb.select().from(indexedHeads);
    expect(head[0]).toMatchObject({ blockNumber: 2, blockHash: block2.header.hash });

    const failingTarget = createTestTarget(3);
    await expect(runBlocks(failingTarget, [block3])).rejects.toThrow('injected failure');
    expect(await countRows(ethereumPool, 'blocks')).toBe(2);
    expect(await countRows(ethereumPool, 'event_facts')).toBe(2);
    expect(await countRows(ethereumPool, 'sqd_cursor')).toBe(2);
    expect((await ethereumDb.select().from(indexedHeads))[0]?.blockNumber).toBe(2);
  });

  it('preserves a known finalized watermark when a later batch omits finality', async () => {
    const before = (await ethereumDb.select().from(indexedHeads))[0];
    expect(before).toMatchObject({
      finalizedBlockNumber: block1.header.number,
      finalizedBlockHash: block1.header.hash,
    });

    await ethereumPool.query('DELETE FROM sqd_cursor');
    await runBlocks(target, [block1, block2], null);

    const after = (await ethereumDb.select().from(indexedHeads))[0];
    expect(after).toMatchObject({
      blockNumber: block2.header.number,
      finalizedBlockNumber: block1.header.number,
      finalizedBlockHash: block1.header.hash,
    });
  });

  it('does not move the finalized watermark backwards during forward processing', async () => {
    await ethereumPool.query('DELETE FROM sqd_cursor');
    await runBlocks(target, [block2], {
      number: block1.header.number,
      hash: block1.header.hash,
    });
    expect((await ethereumDb.select().from(indexedHeads))[0]).toMatchObject({
      finalizedBlockNumber: block1.header.number,
      finalizedBlockHash: block1.header.hash,
    });

    await ethereumPool.query('DELETE FROM sqd_cursor');
    await runBlocks(target, [block2], {
      number: block0.header.number,
      hash: block0.header.hash,
    });
    expect((await ethereumDb.select().from(indexedHeads))[0]).toMatchObject({
      finalizedBlockNumber: block1.header.number,
      finalizedBlockHash: block1.header.hash,
    });
  });

  it('rejects a conflicting hash at the stored finalized height', async () => {
    const conflictingHash = hashFor(203);
    await ethereumPool.query('DELETE FROM sqd_cursor');
    await expect(
      runBlocks(target, [block2], {
        number: block1.header.number,
        hash: conflictingHash,
      }),
    ).rejects.toThrow(
      `Finalized block ${block1.header.number} conflicts with stored hash ${block1.header.hash}`,
    );

    expect((await ethereumDb.select().from(indexedHeads))[0]).toMatchObject({
      finalizedBlockNumber: block1.header.number,
      finalizedBlockHash: block1.header.hash,
    });
  });

  it('rejects an advancing finalized hash that disagrees with the canonical block', async () => {
    const conflictingHash = hashFor(205);
    await ethereumPool.query('DELETE FROM sqd_cursor');
    await expect(
      runBlocks(target, [block1, block2], {
        number: block2.header.number,
        hash: conflictingHash,
      }),
    ).rejects.toThrow(
      `Finalized block ${block2.header.number} conflicts with canonical hash ${block2.header.hash}`,
    );

    expect((await ethereumDb.select().from(indexedHeads))[0]).toMatchObject({
      blockNumber: block2.header.number,
      blockHash: block2.header.hash,
      finalizedBlockNumber: block1.header.number,
      finalizedBlockHash: block1.header.hash,
    });
  });

  it('rejects a lower indexed head outside Pipes rollback', async () => {
    await ethereumPool.query('DELETE FROM sqd_cursor');
    await expect(
      runBlocks(target, [block1], {
        number: block1.header.number,
        hash: block1.header.hash,
      }),
    ).rejects.toThrow(
      `Persistence head cannot move backwards from block ${block2.header.number} to block ${block1.header.number} outside Pipes rollback`,
    );

    expect((await ethereumDb.select().from(indexedHeads))[0]).toMatchObject({
      blockNumber: block2.header.number,
      blockHash: block2.header.hash,
    });
  });

  it('rejects an event whose block hash disagrees with its referenced block', async () => {
    await expect(
      ethereumDb.insert(eventFacts).values({
        id: createEventId(ethereumRuntime.network.chainId, block1.header.number, 0, 99),
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        blockNumber: block1.header.number,
        blockHash: block2.header.hash,
        parentHash: block0.header.hash,
        blockTimestamp: new Date(block1.header.timestamp),
        transactionHash: hashFor(199),
        transactionIndex: 0,
        logIndex: 99,
        address: testAddress,
        topic0,
        topics: [topic0],
        data: '0x',
      }),
    ).rejects.toMatchObject({ cause: { code: '23503' } });
  });

  it('rejects a no-event replay whose indexed head disagrees with the canonical block', async () => {
    await ethereumPool.query('DELETE FROM sqd_cursor');
    await expect(
      runBlocks(createTestTarget(undefined, false), [alternateBlock2]),
    ).rejects.toMatchObject({ cause: { code: '23503', constraint: 'indexed_heads_block_fk' } });

    expect(await countRows(ethereumPool, 'blocks')).toBe(2);
    expect(await countRows(ethereumPool, 'event_facts')).toBe(2);
    expect((await ethereumDb.select().from(indexedHeads))[0]).toMatchObject({
      blockNumber: block2.header.number,
      blockHash: block2.header.hash,
    });
    expect(
      (
        await ethereumDb
          .select()
          .from(universalProfiles)
          .where(eq(universalProfiles.address, testAddress))
      )[0],
    ).toMatchObject({ lastBlockHash: block2.header.hash });
  });

  it('rejects a conflicting intermediate block hash during replay', async () => {
    await ethereumPool.query('DELETE FROM sqd_cursor');
    await expect(
      runBlocks(createTestTarget(undefined, false), [alternateBlock2, alternateBlock3], null),
    ).rejects.toThrow(
      `Block 3 links to parent hash ${alternateBlock2.header.hash}, but canonical block 2 has hash ${block2.header.hash}`,
    );

    expect(await countRows(ethereumPool, 'blocks')).toBe(2);
    expect((await ethereumDb.select().from(indexedHeads))[0]).toMatchObject({
      blockNumber: block2.header.number,
      blockHash: block2.header.hash,
    });
    expect(
      (
        await ethereumDb
          .select()
          .from(universalProfiles)
          .where(eq(universalProfiles.address, testAddress))
      )[0],
    ).toMatchObject({ lastBlockHash: block2.header.hash });
  });

  it('creates every rollback artifact inside only the selected chain schema', async () => {
    const expected = rollbackTables.length;
    const inventory = await testAdminPool.query<{
      schema: string;
      snapshots: string;
      functions: string;
      triggers: string;
    }>(`
      SELECT n.nspname AS schema,
             count(DISTINCT c.oid) FILTER (WHERE c.relkind = 'r' AND c.relname LIKE '%\\_\\_snapshots') AS snapshots,
             count(DISTINCT p.oid) FILTER (WHERE p.proname LIKE 'maybe_snapshot_%') AS functions,
             count(DISTINCT t.oid) FILTER (WHERE t.tgname LIKE '%_snapshot_trigger') AS triggers
      FROM pg_namespace n
      LEFT JOIN pg_class c ON c.relnamespace = n.oid
      LEFT JOIN pg_proc p ON p.pronamespace = n.oid
      LEFT JOIN pg_trigger t ON t.tgrelid = c.oid AND NOT t.tgisinternal
      WHERE n.nspname IN ('public', 'chain_ethereum_mainnet', 'chain_ethereum_sepolia', 'chain_lukso_mainnet')
      GROUP BY n.nspname
      ORDER BY n.nspname
    `);
    const ethereum = inventory.rows.find(({ schema }) => schema === 'chain_ethereum_mainnet');
    expect(ethereum).toMatchObject({
      snapshots: String(expected),
      functions: String(expected),
      triggers: String(expected),
    });
    for (const row of inventory.rows.filter(({ schema }) => schema !== 'chain_ethereum_mainnet')) {
      expect(row).toMatchObject({ snapshots: '0', functions: '0', triggers: '0' });
    }
  });

  it('refuses tracked schema evolution while rollback snapshots contain data', async () => {
    const { migrationsDirectory, temporaryDirectory } = await createPendingMigrationDirectory();
    try {
      const ethereumMigration = {
        connectionString: migrationConfig.connectionString,
        networks: migrationConfig.networks.filter(
          ({ network }) => network.key === 'ethereum-mainnet',
        ),
      };
      await expect(migrateDatabase(ethereumMigration, { migrationsDirectory })).rejects.toThrow(
        'rollback snapshot artifacts exist',
      );

      const column = await testAdminPool.query<{ exists: boolean }>(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'chain_ethereum_mainnet'
            AND table_name = 'universal_profiles'
            AND column_name = 'forbidden_schema_change'
        ) AS exists
      `);
      expect(column.rows[0]?.exists).toBe(false);
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('replays deterministically and rolls a fork back to the common ancestor', async () => {
    const checksumQuery = `
      SELECT md5(jsonb_build_object(
        'blocks', (SELECT jsonb_agg(to_jsonb(b) ORDER BY b.number) FROM chain_ethereum_mainnet.blocks b),
        'events', (SELECT jsonb_agg(to_jsonb(e) ORDER BY e.block_number) FROM chain_ethereum_mainnet.event_facts e),
        'profiles', (SELECT jsonb_agg(to_jsonb(p) ORDER BY p.address) FROM chain_ethereum_mainnet.universal_profiles p),
        'jobs', (SELECT jsonb_agg(to_jsonb(j) - 'created_at' - 'updated_at' ORDER BY j.id) FROM chain_ethereum_mainnet.metadata_jobs j)
      )::text) AS digest
    `;
    const beforeReplay = await testAdminPool.query<{ digest: string }>(checksumQuery);
    await ethereumPool.query('DELETE FROM sqd_cursor');
    await ethereumPool.query(
      `INSERT INTO ${quotePostgresIdentifier(CURSOR_TABLE)}
         (id, current_number, current_hash, ${quotePostgresIdentifier('current_timestamp')}, finalized, rollback_chain)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
      [
        ethereumRuntime.streamId,
        block1.header.number,
        block1.header.hash,
        new Date(block1.header.timestamp),
        JSON.stringify({ number: block1.header.number, hash: block1.header.hash }),
        JSON.stringify([
          {
            number: block1.header.number,
            hash: block1.header.hash,
            timestamp: block1.header.timestamp,
          },
        ]),
      ],
    );
    await runBlocks(target, [block2]);
    const afterReplay = await testAdminPool.query<{ digest: string }>(checksumQuery);
    expect(afterReplay.rows[0]?.digest).toBe(beforeReplay.rows[0]?.digest);

    if (target.resolveFork == null) throw new Error('Persistence target must support forks');
    const cursor = await target.resolveFork([
      {
        number: block1.header.number,
        hash: block1.header.hash,
        timestamp: block1.header.timestamp,
      },
    ]);
    expect(cursor).toMatchObject({ number: 1, hash: block1.header.hash });

    expect(await countRows(ethereumPool, 'blocks')).toBe(1);
    expect(await countRows(ethereumPool, 'event_facts')).toBe(1);
    expect(await countRows(ethereumPool, 'metadata_jobs')).toBe(0);
    expect(await countRows(ethereumPool, 'sqd_cursor')).toBe(1);
    const profile = await ethereumDb
      .select()
      .from(universalProfiles)
      .where(eq(universalProfiles.address, testAddress));
    expect(profile[0]).toMatchObject({ ownerAddress: firstOwner, lastBlockNumber: 1 });
    expect((await ethereumDb.select().from(indexedHeads))[0]).toMatchObject({
      blockNumber: 1,
      blockHash: block1.header.hash,
    });

    const sepoliaCollision = await sepoliaDb
      .select()
      .from(universalProfiles)
      .where(eq(universalProfiles.address, collisionAddress));
    expect(sepoliaCollision).toHaveLength(1);
  });

  it('restores all tracked state across a multi-block fork', async () => {
    await runBlocks(target, [block2, block3]);
    if (target.resolveFork == null) throw new Error('Persistence target must support forks');
    const cursor = await target.resolveFork([
      {
        number: block1.header.number,
        hash: block1.header.hash,
        timestamp: block1.header.timestamp,
      },
    ]);
    expect(cursor).toMatchObject({ number: 1, hash: block1.header.hash });

    expect(await countRows(ethereumPool, 'blocks')).toBe(1);
    expect(await countRows(ethereumPool, 'event_facts')).toBe(1);
    expect(await countRows(ethereumPool, 'metadata_jobs')).toBe(0);
    expect(await countRows(ethereumPool, 'sqd_cursor')).toBe(1);
    expect(await countRows(ethereumPool, 'indexed_heads')).toBe(1);
    const targetProfile = await ethereumDb
      .select()
      .from(universalProfiles)
      .where(eq(universalProfiles.address, testAddress));
    expect(targetProfile[0]).toMatchObject({ ownerAddress: firstOwner, lastBlockNumber: 1 });

    const sepoliaCollision = await sepoliaDb
      .select()
      .from(universalProfiles)
      .where(eq(universalProfiles.address, collisionAddress));
    expect(sepoliaCollision).toHaveLength(1);
  });

  it('refuses tracked schema evolution when rollback snapshot tables are empty', async () => {
    const snapshotTables = await testAdminPool.query<SnapshotTableRow>(`
      SELECT tablename AS "tableName"
      FROM pg_tables
      WHERE schemaname = 'chain_ethereum_mainnet'
        AND right(tablename, 11) = '__snapshots'
      ORDER BY tablename
    `);
    expect(snapshotTables.rows).toHaveLength(rollbackTables.length);
    for (const { tableName } of snapshotTables.rows) {
      const qualifiedTable = `${quotePostgresIdentifier('chain_ethereum_mainnet')}.${quotePostgresIdentifier(tableName)}`;
      await testAdminPool.query(`TRUNCATE TABLE ${qualifiedTable}`);
      expect(await countRows(testAdminPool, qualifiedTable)).toBe(0);
    }

    const { migrationsDirectory, temporaryDirectory } = await createPendingMigrationDirectory();
    try {
      const ethereumMigration = {
        connectionString: migrationConfig.connectionString,
        networks: migrationConfig.networks.filter(
          ({ network }) => network.key === 'ethereum-mainnet',
        ),
      };
      await expect(migrateDatabase(ethereumMigration, { migrationsDirectory })).rejects.toThrow(
        'rollback snapshot artifacts exist',
      );
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
