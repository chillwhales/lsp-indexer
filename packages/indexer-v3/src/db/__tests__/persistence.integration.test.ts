import { encodeVerifiableUri } from '@chillwhales/lsp2';
import { computeContentHash, encodeLsp31Uri } from '@chillwhales/lsp31';
import { evmPortalStream, evmQuery } from '@subsquid/pipes/evm';
import { mockPortal } from '@subsquid/pipes/testing';
import {
  encodeEvent,
  mockBlock,
  mockEvmPortalStream,
  type PortalBlock,
} from '@subsquid/pipes/testing/evm';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { concatHex, stringToHex, toBytes, toHex, type Hex } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadRuntimeConfig, type RuntimeConfig } from '../../config/index.js';
import {
  createEventIngestionOutput,
  createEventPersistenceTarget,
  ERC725Y_EVENT_ABI,
  LSP14_EVENT_ABI,
  LSP7_EVENT_ABI,
  LSP8_EVENT_ABI,
} from '../../events/index.js';
import {
  applyMetadataSourcePlan,
  cancelClaimedMetadataJob,
  claimMetadataJobs,
  completeMetadataJob,
  countMetadataJobs,
  failMetadataJob,
  loadClaimedMetadataSource,
  loadMetadataRecoveryCandidatePages,
} from '../../metadata/queue.js';
import { createDataValueMetadataSource } from '../../metadata/source.js';
import {
  applyProjectionMutations,
  assertProjectionReplayStart,
  collectProjectionCandidates,
  createProjectionPersistenceTarget,
  DATA_KEYS,
  ZERO_ADDRESS,
  type ProjectionBatch,
  type ProjectionMutations,
  type ProjectionVerification,
} from '../../projections/index.js';
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
  createDataValueId,
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
  MIGRATIONS_TABLE,
  quotePostgresIdentifier,
  SHARED_ENUMS,
  SHARED_SCHEMA,
} from '../names.js';
import { verifyDatabaseReadiness } from '../readiness.js';
import { createChainObjectOwnershipQuery, type ChainObjectOwnershipRow } from '../roleBoundary.js';
import {
  blocks,
  chillwhalesNfts,
  controllers,
  creators,
  dataValues,
  digitalAssets,
  eventFacts,
  indexedHeads,
  issuedAssets,
  metadataJobs,
  metadataRevisions,
  nfts,
  ownedAssets,
  ownedTokens,
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

async function waitForDatabaseClientsToClose(pool: Pool, database: string): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const result = await pool.query<{ connections: number }>(
      `SELECT count(*)::integer AS connections
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [database],
    );
    if (result.rows[0]?.connections === 0) return;
    await pool.query('SELECT pg_sleep(0.05)');
  }
  throw new Error(`Timed out waiting for PostgreSQL clients to leave database "${database}"`);
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

async function restoreRawOnlyProjectionBaseline(
  pool: Pool,
  network: DatabaseMigrationConfig['networks'][number],
): Promise<void> {
  const schema = quotePostgresIdentifier(network.schema);
  await executeAsRole(
    pool,
    API_OWNER_ROLE,
    `DROP SCHEMA ${quotePostgresIdentifier(API_SCHEMA)} CASCADE`,
  );
  await pool.query(
    `DROP SCHEMA ${schema} CASCADE;
     CREATE SCHEMA ${schema} AUTHORIZATION ${quotePostgresIdentifier(network.role)}`,
  );

  const migrations = readMigrationFiles({
    migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url)),
  }).slice(0, 8);
  const migrationTable = `${schema}.${quotePostgresIdentifier(MIGRATIONS_TABLE)}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL ROLE ${quotePostgresIdentifier(network.role)}`);
    await client.query(
      `SET LOCAL search_path TO ${schema}, ${quotePostgresIdentifier(SHARED_SCHEMA)}, ${quotePostgresIdentifier('public')}`,
    );
    await client.query(`
      CREATE TABLE ${migrationTable} (
        id serial PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint NOT NULL
      )
    `);
    for (const migration of migrations) {
      for (const statement of migration.sql) {
        if (statement.trim().length > 0) await client.query(statement);
      }
      await client.query(`INSERT INTO ${migrationTable} (hash, created_at) VALUES ($1, $2)`, [
        migration.hash,
        migration.folderMillis,
      ]);
    }
    await client.query(
      `INSERT INTO ${schema}.network_config (network, chain_id, schema_version)
       VALUES ($1, $2, $3)`,
      [network.network.key, network.network.chainId, DATABASE_SCHEMA_VERSION],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
    await waitForDatabaseClientsToClose(controlPool, testDatabaseName);
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
    expect(tableCounts.rows.every(({ count }) => Number(count) === 19)).toBe(true);

    const views = await testAdminPool.query<{ count: string }>(
      `SELECT count(*) AS count FROM pg_views WHERE schemaname = 'api'`,
    );
    expect(Number(views.rows[0]?.count)).toBe(15);

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

  it('atomically resets raw-only v3 state so projections replay from the configured range', async () => {
    const scratchDatabaseName = `lsp_v3_projection_upgrade_${suiteSuffix}`;
    const scratchUrl = databaseUrl(sourceDatabaseUrl, scratchDatabaseName);
    const network = migrationConfig.networks.find(
      ({ network: configuredNetwork }) => configuredNetwork.key === 'ethereum-mainnet',
    );
    if (network == null) throw new Error('Expected the Ethereum migration network');
    const scratchConfig = { connectionString: scratchUrl, networks: [network] };
    let scratchPool: Pool | undefined;
    let scratchRuntimePool: Pool | undefined;

    await controlPool.query(`CREATE DATABASE ${quotePostgresIdentifier(scratchDatabaseName)}`);
    try {
      await migrateDatabase(scratchConfig);
      scratchPool = new Pool({ connectionString: scratchUrl, max: 1 });
      await restoreRawOnlyProjectionBaseline(scratchPool, network);
      const schema = quotePostgresIdentifier(network.schema);
      await scratchPool.query(
        `INSERT INTO ${schema}.blocks (
           id, network, chain_id, number, hash, parent_hash, timestamp
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          createBlockId(network.network.chainId, 10),
          network.network.key,
          network.network.chainId,
          10,
          hashFor(10),
          hashFor(9),
          new Date(1_700_000_010_000),
        ],
      );
      await scratchPool.query(
        `INSERT INTO ${schema}.event_facts (
           id, network, chain_id, block_number, block_hash, parent_hash, block_timestamp,
           transaction_hash, transaction_index, log_index, address, topic0, topics, data
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10, $11, '0x')`,
        [
          createEventId(network.network.chainId, 10, 0, 0),
          network.network.key,
          network.network.chainId,
          10,
          hashFor(10),
          hashFor(9),
          new Date(1_700_000_010_000),
          hashFor(110),
          testAddress,
          topic0,
          [topic0],
        ],
      );
      await scratchPool.query(
        `INSERT INTO ${schema}.universal_profiles (
           id, network, chain_id, address, verification, last_block_number, last_block_hash
         ) VALUES ($1, $2, $3, $4, 'verified', 10, $5)`,
        [
          createAddressId('profile', network.network.chainId, testAddress),
          network.network.key,
          network.network.chainId,
          testAddress,
          hashFor(10),
        ],
      );
      await scratchPool.query(
        `INSERT INTO ${schema}.indexed_heads (
           network, chain_id, block_number, block_hash, block_timestamp
         ) VALUES ($1, $2, 10, $3, $4)`,
        [network.network.key, network.network.chainId, hashFor(10), new Date(1_700_000_010_000)],
      );
      await scratchPool.query(
        `INSERT INTO ${schema}.sqd_cursor (id, current_number, current_hash)
         VALUES ($1, 10, $2)`,
        [network.network.key, hashFor(10)],
      );
      await executeAsRole(
        scratchPool,
        network.role,
        `CREATE TABLE ${schema}.blocks__snapshots AS
           SELECT block.*, 'INSERT'::text AS "___sqd__operation",
                  10::bigint AS "___sqd__block_number"
           FROM ${schema}.blocks block;
         ALTER TABLE ${schema}.blocks__snapshots
           ADD PRIMARY KEY ("___sqd__block_number", id);
         CREATE FUNCTION ${schema}.maybe_snapshot_blocks() RETURNS trigger AS $$
         BEGIN
           RETURN NULL;
         END;
         $$ LANGUAGE plpgsql;
         CREATE TRIGGER blocks_snapshot_trigger
           AFTER INSERT OR UPDATE OR DELETE ON ${schema}.blocks
           FOR EACH ROW EXECUTE FUNCTION ${schema}.maybe_snapshot_blocks();`,
      );
      expect(await countRows(scratchPool, `${schema}.blocks__snapshots`)).toBe(1);

      await migrateDatabase(scratchConfig);

      for (const table of [
        'blocks',
        'event_facts',
        'universal_profiles',
        'indexed_heads',
        'sqd_cursor',
      ]) {
        expect(await countRows(scratchPool, `${schema}.${quotePostgresIdentifier(table)}`)).toBe(0);
      }
      expect(await countRows(scratchPool, `${schema}.network_config`)).toBe(1);
      expect(await countRows(scratchPool, `${schema}.__drizzle_migrations`)).toBe(migrationCount);

      const removedArtifacts = await scratchPool.query<{
        functions: string;
        snapshots: string;
        triggers: string;
      }>(`
        SELECT
          count(DISTINCT relation.oid) FILTER (
            WHERE relation.relkind = 'r' AND relation.relname LIKE '%\\_\\_snapshots'
          ) AS snapshots,
          count(DISTINCT routine.oid) FILTER (
            WHERE routine.proname LIKE 'maybe\\_snapshot\\_%'
          ) AS functions,
          count(DISTINCT trigger.oid) FILTER (
            WHERE trigger.tgname LIKE '%\\_snapshot\\_trigger'
          ) AS triggers
        FROM pg_namespace namespace
        LEFT JOIN pg_class relation ON relation.relnamespace = namespace.oid
        LEFT JOIN pg_proc routine ON routine.pronamespace = namespace.oid
        LEFT JOIN pg_trigger trigger
          ON trigger.tgrelid = relation.oid AND NOT trigger.tgisinternal
        WHERE namespace.nspname = '${network.schema}'
      `);
      expect(removedArtifacts.rows[0]).toEqual({
        snapshots: '0',
        functions: '0',
        triggers: '0',
      });

      const scratchRuntime = loadRuntimeConfig({ INDEXER_NETWORK: network.network.key });
      const scratchDatabaseConfig = loadNetworkDatabaseConfig(scratchRuntime, {
        DATABASE_URL: databaseUrl(
          sourceDatabaseUrl,
          scratchDatabaseName,
          runtimeLogins['ethereum-mainnet'],
          runtimePassword,
        ),
        DATABASE_POOL_MAX: '2',
        DATABASE_UNFINALIZED_BLOCKS_RETENTION: '100',
      });
      scratchRuntimePool = createNetworkPool(scratchDatabaseConfig);
      const scratchTarget = createPersistenceTarget<TestBlock[]>({
        runtime: scratchRuntime,
        databaseConfig: scratchDatabaseConfig,
        db: createNetworkDatabase(scratchRuntimePool),
        async onData({ tx }, batch): Promise<void> {
          for (const block of batch) {
            await tx
              .insert(blocks)
              .values({
                id: createBlockId(scratchRuntime.network.chainId, block.header.number),
                network: scratchRuntime.network.key,
                chainId: scratchRuntime.network.chainId,
                number: block.header.number,
                hash: block.header.hash,
                parentHash: block.header.parentHash,
                timestamp: new Date(block.header.timestamp),
              })
              .onConflictDoNothing();
          }
        },
      });
      await runBlocks(scratchTarget, [block1]);

      const recreatedArtifacts = await scratchPool.query<{
        functions: string;
        snapshots: string;
        triggers: string;
      }>(`
        SELECT
          count(DISTINCT relation.oid) FILTER (
            WHERE relation.relkind = 'r' AND relation.relname LIKE '%\\_\\_snapshots'
          ) AS snapshots,
          count(DISTINCT routine.oid) FILTER (
            WHERE routine.proname LIKE 'maybe\\_snapshot\\_%'
          ) AS functions,
          count(DISTINCT trigger.oid) FILTER (
            WHERE trigger.tgname LIKE '%\\_snapshot\\_trigger'
          ) AS triggers
        FROM pg_namespace namespace
        LEFT JOIN pg_class relation ON relation.relnamespace = namespace.oid
        LEFT JOIN pg_proc routine ON routine.pronamespace = namespace.oid
        LEFT JOIN pg_trigger trigger
          ON trigger.tgrelid = relation.oid AND NOT trigger.tgisinternal
        WHERE namespace.nspname = '${network.schema}'
      `);
      expect(recreatedArtifacts.rows[0]).toEqual({
        snapshots: String(rollbackTables.length),
        functions: String(rollbackTables.length),
        triggers: String(rollbackTables.length),
      });
      const recreatedClaimSchedule = await scratchPool.query<{ exists: boolean }>(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${network.schema}'
            AND table_name = 'chillwhales_nfts__snapshots'
            AND column_name = 'claim_check_after_block'
        ) AS exists
      `);
      expect(recreatedClaimSchedule.rows[0]?.exists).toBe(true);
    } finally {
      await scratchRuntimePool?.end();
      await scratchPool?.end();
      await waitForDatabaseClientsToClose(controlPool, scratchDatabaseName);
      await controlPool.query(
        `DROP DATABASE IF EXISTS ${quotePostgresIdentifier(scratchDatabaseName)}`,
      );
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

  it('requires raw topics to be canonical and consistent with topic0', async () => {
    const client = await ethereumPool.connect();
    const insertEvent = `INSERT INTO event_facts (
      id,
      network,
      chain_id,
      block_number,
      block_hash,
      parent_hash,
      block_timestamp,
      transaction_hash,
      transaction_index,
      log_index,
      address,
      topic0,
      topics,
      data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`;
    const eventValues = [
      createEventId(ethereumRuntime.network.chainId, block0.header.number, 0, 0),
      ethereumRuntime.network.key,
      ethereumRuntime.network.chainId,
      block0.header.number,
      block0.header.hash,
      block0.header.parentHash,
      new Date(block0.header.timestamp),
      hashFor(220),
      0,
      0,
      testAddress,
      topic0,
    ];
    const malformedTopics: (string | null)[][] = [
      [],
      [hashFor(212)],
      [topic0, '0x01'],
      [topic0, hashFor(213).toUpperCase()],
      [topic0, null],
    ];
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
      for (const topics of malformedTopics) {
        await client.query('SAVEPOINT invalid_event_topics');
        try {
          await expect(
            client.query(insertEvent, [...eventValues, topics, '0x']),
          ).rejects.toMatchObject({ constraint: 'event_facts_topics_check' });
        } finally {
          await client.query('ROLLBACK TO SAVEPOINT invalid_event_topics');
          await client.query('RELEASE SAVEPOINT invalid_event_topics');
        }
      }
      await expect(
        client.query(insertEvent, [...eventValues, [topic0, hashFor(214)], '0x']),
      ).resolves.toBeDefined();
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
      await waitForDatabaseClientsToClose(controlPool, scratchDatabaseName);
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
      expect(viewsAfterFailure.rows).toHaveLength(15);
    } finally {
      await scratchPool?.end();
      await waitForDatabaseClientsToClose(controlPool, scratchDatabaseName);
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
      await ethereumDb.insert(controllers).values({
        id: 'large-controller-array-index',
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        profileAddress: issuerAddress,
        controllerAddress: creatorAddress,
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
            .from(controllers)
            .where(eq(controllers.id, 'large-controller-array-index'))
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

  it('swaps creator, issued-asset, and controller indices without unique collisions', async () => {
    const issuerAddress = addressFor(240);
    const firstAssetAddress = addressFor(241);
    const secondAssetAddress = addressFor(242);
    const firstRelatedAddress = addressFor(243);
    const secondRelatedAddress = addressFor(244);
    const blockHash = hashFor(240);
    const provenance = {
      lastBlockNumber: 0,
      lastBlockHash: blockHash,
      lastTransactionHash: null,
      lastTransactionIndex: null,
      lastLogIndex: null,
    };

    await ethereumDb.insert(universalProfiles).values({
      id: createAddressId('profile', ethereumRuntime.network.chainId, issuerAddress),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: issuerAddress,
      ...provenance,
    });
    await ethereumDb.insert(digitalAssets).values([
      {
        id: createAddressId('asset', ethereumRuntime.network.chainId, firstAssetAddress),
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: firstAssetAddress,
        ...provenance,
      },
      {
        id: createAddressId('asset', ethereumRuntime.network.chainId, secondAssetAddress),
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: secondAssetAddress,
        ...provenance,
      },
    ]);
    try {
      await ethereumDb.insert(creators).values([
        {
          id: 'swap-creator-1',
          network: ethereumRuntime.network.key,
          chainId: ethereumRuntime.network.chainId,
          assetAddress: firstAssetAddress,
          creatorAddress: firstRelatedAddress,
          arrayIndex: 0n,
          ...provenance,
        },
        {
          id: 'swap-creator-2',
          network: ethereumRuntime.network.key,
          chainId: ethereumRuntime.network.chainId,
          assetAddress: firstAssetAddress,
          creatorAddress: secondRelatedAddress,
          arrayIndex: 1n,
          ...provenance,
        },
      ]);
      await ethereumDb.insert(issuedAssets).values([
        {
          id: 'swap-issued-1',
          network: ethereumRuntime.network.key,
          chainId: ethereumRuntime.network.chainId,
          issuerAddress,
          assetAddress: firstAssetAddress,
          arrayIndex: 0n,
          ...provenance,
        },
        {
          id: 'swap-issued-2',
          network: ethereumRuntime.network.key,
          chainId: ethereumRuntime.network.chainId,
          issuerAddress,
          assetAddress: secondAssetAddress,
          arrayIndex: 1n,
          ...provenance,
        },
      ]);
      await ethereumDb.insert(controllers).values([
        {
          id: 'swap-controller-1',
          network: ethereumRuntime.network.key,
          chainId: ethereumRuntime.network.chainId,
          profileAddress: issuerAddress,
          controllerAddress: firstRelatedAddress,
          arrayIndex: 0n,
          ...provenance,
        },
        {
          id: 'swap-controller-2',
          network: ethereumRuntime.network.key,
          chainId: ethereumRuntime.network.chainId,
          profileAddress: issuerAddress,
          controllerAddress: secondRelatedAddress,
          arrayIndex: 1n,
          ...provenance,
        },
      ]);

      const swapIndex = <T extends { arrayIndex: bigint | null }>(row: T): T => ({
        ...row,
        arrayIndex: row.arrayIndex === 0n ? 1n : 0n,
      });
      const mutations: ProjectionMutations = {
        universalProfiles: [],
        digitalAssets: [],
        nfts: [],
        ownedAssets: [],
        ownedTokens: [],
        followerEdges: [],
        creators: (
          await ethereumDb
            .select()
            .from(creators)
            .where(eq(creators.assetAddress, firstAssetAddress))
        ).map(swapIndex),
        issuedAssets: (
          await ethereumDb
            .select()
            .from(issuedAssets)
            .where(eq(issuedAssets.issuerAddress, issuerAddress))
        ).map(swapIndex),
        controllers: (
          await ethereumDb
            .select()
            .from(controllers)
            .where(eq(controllers.profileAddress, issuerAddress))
        ).map(swapIndex),
        chillwhalesNfts: [],
        dataValues: [],
        deletedOwnedAssetIds: [],
        deletedOwnedTokenIds: [],
        deletedNftCollections: [],
        deletedCreatorIds: [],
        deletedIssuedAssetIds: [],
        deletedControllerIds: [],
      };

      await ethereumDb.transaction((tx) => applyProjectionMutations(tx, mutations));

      expect(
        (
          await ethereumDb
            .select()
            .from(creators)
            .where(eq(creators.assetAddress, firstAssetAddress))
            .orderBy(creators.id)
        ).map(({ id, arrayIndex }) => ({ id, arrayIndex })),
      ).toEqual([
        { id: 'swap-creator-1', arrayIndex: 1n },
        { id: 'swap-creator-2', arrayIndex: 0n },
      ]);
      expect(
        (
          await ethereumDb
            .select()
            .from(issuedAssets)
            .where(eq(issuedAssets.issuerAddress, issuerAddress))
            .orderBy(issuedAssets.id)
        ).map(({ id, arrayIndex }) => ({ id, arrayIndex })),
      ).toEqual([
        { id: 'swap-issued-1', arrayIndex: 1n },
        { id: 'swap-issued-2', arrayIndex: 0n },
      ]);
      expect(
        (
          await ethereumDb
            .select()
            .from(controllers)
            .where(eq(controllers.profileAddress, issuerAddress))
            .orderBy(controllers.id)
        ).map(({ id, arrayIndex }) => ({ id, arrayIndex })),
      ).toEqual([
        { id: 'swap-controller-1', arrayIndex: 1n },
        { id: 'swap-controller-2', arrayIndex: 0n },
      ]);
    } finally {
      await ethereumDb
        .delete(universalProfiles)
        .where(eq(universalProfiles.address, issuerAddress));
      await ethereumDb.delete(digitalAssets).where(eq(digitalAssets.address, firstAssetAddress));
      await ethereumDb.delete(digitalAssets).where(eq(digitalAssets.address, secondAssetAddress));
    }
  });

  it('deletes an LSP8 collection and its dependent ownership and extension rows', async () => {
    const assetAddress = addressFor(245);
    const ownerAddress = addressFor(246);
    const tokenId = hashFor(245);
    const blockHash = hashFor(246);
    const provenance = {
      lastBlockNumber: 0,
      lastBlockHash: blockHash,
      lastTransactionHash: null,
      lastTransactionIndex: null,
      lastLogIndex: null,
    };

    await ethereumDb.insert(universalProfiles).values({
      id: createAddressId('profile', ethereumRuntime.network.chainId, ownerAddress),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: ownerAddress,
      ...provenance,
    });
    await ethereumDb.insert(digitalAssets).values({
      id: createAddressId('asset', ethereumRuntime.network.chainId, assetAddress),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: assetAddress,
      standard: 'lsp8',
      verification: 'verified',
      ...provenance,
    });

    try {
      await ethereumDb.insert(nfts).values({
        id: 'reclassified-nft',
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: assetAddress,
        tokenId,
        ownerAddress,
        verification: 'verified',
        ...provenance,
      });
      await ethereumDb.insert(ownedTokens).values({
        id: 'reclassified-owned-token',
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        ownerAddress,
        assetAddress,
        tokenId,
        balance: '1',
        ...provenance,
      });
      await ethereumDb.insert(chillwhalesNfts).values({
        id: 'reclassified-extension',
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: assetAddress,
        tokenId,
        ...provenance,
      });

      const mutations: ProjectionMutations = {
        universalProfiles: [],
        digitalAssets: [],
        nfts: [],
        ownedAssets: [],
        ownedTokens: [],
        followerEdges: [],
        creators: [],
        issuedAssets: [],
        controllers: [],
        chillwhalesNfts: [],
        dataValues: [],
        deletedOwnedAssetIds: [],
        deletedOwnedTokenIds: [],
        deletedNftCollections: [
          { chainId: ethereumRuntime.network.chainId, address: assetAddress },
        ],
        deletedCreatorIds: [],
        deletedIssuedAssetIds: [],
        deletedControllerIds: [],
      };
      await ethereumDb.transaction((tx) => applyProjectionMutations(tx, mutations));

      expect(await ethereumDb.select().from(nfts).where(eq(nfts.address, assetAddress))).toEqual(
        [],
      );
      expect(
        await ethereumDb
          .select()
          .from(ownedTokens)
          .where(eq(ownedTokens.assetAddress, assetAddress)),
      ).toEqual([]);
      expect(
        await ethereumDb
          .select()
          .from(chillwhalesNfts)
          .where(eq(chillwhalesNfts.address, assetAddress)),
      ).toEqual([]);
      expect(
        await ethereumDb
          .select()
          .from(digitalAssets)
          .where(eq(digitalAssets.address, assetAddress)),
      ).toHaveLength(1);
    } finally {
      await ethereumDb.delete(digitalAssets).where(eq(digitalAssets.address, assetAddress));
      await ethereumDb.delete(universalProfiles).where(eq(universalProfiles.address, ownerAddress));
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

  it('revalidates every runtime login capability during migration and startup', async () => {
    const runtimeLogin = runtimeLogins['ethereum-mainnet'];
    const mutations: { disable: string; enable: string }[] = [
      { enable: 'NOLOGIN', disable: 'LOGIN' },
      { enable: 'SUPERUSER', disable: 'NOSUPERUSER' },
      { enable: 'CREATEDB', disable: 'NOCREATEDB' },
      { enable: 'CREATEROLE', disable: 'NOCREATEROLE' },
      { enable: 'REPLICATION', disable: 'NOREPLICATION' },
      { enable: 'BYPASSRLS', disable: 'NOBYPASSRLS' },
    ];

    for (const { disable, enable } of mutations) {
      await controlPool.query(`ALTER ROLE ${quotePostgresIdentifier(runtimeLogin)} ${enable}`);
      try {
        await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
          `Configured runtime login "${runtimeLogin}" must be LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS`,
        );
        await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
          `Database session user "${runtimeLogin}" must be LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS`,
        );
      } finally {
        await controlPool.query(`ALTER ROLE ${quotePostgresIdentifier(runtimeLogin)} ${disable}`);
      }
    }
  });

  it('revalidates every writer role capability during migration and startup', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const mutations: { disable: string; enable: string }[] = [
      { enable: 'LOGIN', disable: 'NOLOGIN' },
      { enable: 'INHERIT', disable: 'NOINHERIT' },
      { enable: 'SUPERUSER', disable: 'NOSUPERUSER' },
      { enable: 'CREATEDB', disable: 'NOCREATEDB' },
      { enable: 'CREATEROLE', disable: 'NOCREATEROLE' },
      { enable: 'REPLICATION', disable: 'NOREPLICATION' },
      { enable: 'BYPASSRLS', disable: 'NOBYPASSRLS' },
    ];

    for (const { disable, enable } of mutations) {
      await controlPool.query(
        `ALTER ROLE ${quotePostgresIdentifier(ethereumNetwork.role)} ${enable}`,
      );
      try {
        await expect(migrateDatabase(migrationConfig)).rejects.toThrow(
          `Existing database role "${ethereumNetwork.role}" must be NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS`,
        );
        await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
          `Database writer role "${ethereumNetwork.role}" must be NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS`,
        );
      } finally {
        await controlPool.query(
          `ALTER ROLE ${quotePostgresIdentifier(ethereumNetwork.role)} ${disable}`,
        );
      }
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
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        `Database session user "${runtimeLogin}" must not hold ADMIN OPTION on "${ethereumRole}"`,
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

  it('rejects chain-schema grants held by an unapproved role', async () => {
    const ethereumNetwork = migrationConfig.networks.find(
      ({ network }) => network.key === 'ethereum-mainnet',
    );
    if (ethereumNetwork == null) throw new Error('Expected the Ethereum migration network');
    const unexpectedRole = `v3_test_chain_grantee_${suiteSuffix}`;
    const qualifiedRole = quotePostgresIdentifier(unexpectedRole);
    const qualifiedSchema = quotePostgresIdentifier(ethereumNetwork.schema);
    const qualifiedBlocks = `${qualifiedSchema}.${quotePostgresIdentifier('blocks')}`;
    await controlPool.query(`CREATE ROLE ${qualifiedRole} NOLOGIN`);
    await testAdminPool.query(`GRANT USAGE ON SCHEMA ${qualifiedSchema} TO ${qualifiedRole}`);
    await testAdminPool.query(`GRANT INSERT ON ${qualifiedBlocks} TO ${qualifiedRole}`);
    try {
      const expectedError = `Database schema "${ethereumNetwork.schema}" grants privileges to unapproved roles`;
      await expect(migrateDatabase(migrationConfig)).rejects.toThrow(expectedError);
      await expect(verifyDatabaseReadiness(ethereumDb, ethereumRuntime)).rejects.toThrow(
        expectedError,
      );
    } finally {
      await testAdminPool.query(`REVOKE INSERT ON ${qualifiedBlocks} FROM ${qualifiedRole}`);
      await testAdminPool.query(`REVOKE USAGE ON SCHEMA ${qualifiedSchema} FROM ${qualifiedRole}`);
      await controlPool.query(`DROP ROLE ${qualifiedRole}`);
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
    const publicRoutinePrivileges = await testAdminPool.query<{ count: string }>(`
      SELECT count(*)
      FROM pg_proc routine
      JOIN pg_namespace namespace ON namespace.oid = routine.pronamespace
      CROSS JOIN LATERAL aclexplode(
        COALESCE(routine.proacl, acldefault('f', routine.proowner))
      ) acl
      WHERE namespace.nspname = 'chain_ethereum_mainnet'
        AND routine.proname LIKE 'maybe_snapshot_%'
        AND acl.grantee = 0
        AND acl.privilege_type = 'EXECUTE'
    `);
    expect(publicRoutinePrivileges.rows[0]?.count).toBe('0');
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

  it('persists, replays, and rolls back decoded and malformed raw events end to end', async () => {
    const eventRuntime = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_FROM_BLOCK: '10',
      INDEXER_TO_BLOCK: '10',
    });
    const validLog = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: testAddress,
      args: { dataKey, dataValue: '0x1234' },
    });
    const bridgeBlocks: PortalBlock[] = [];
    let parentHash = block1.header.hash;
    for (let number = 2; number < 10; number += 1) {
      const block = mockBlock({
        number,
        timestamp: 1_700_000_000_000 + number * 1_000,
        hash: hashFor(300 + number),
        parentHash,
      });
      bridgeBlocks.push(block);
      parentHash = block.header.hash;
    }
    const eventBlock = mockBlock({
      number: 10,
      timestamp: 1_700_000_010_000,
      hash: hashFor(110),
      parentHash,
      transactions: [{ logs: [validLog, { ...validLog, data: '0x00' }] }],
    });
    const eventTarget = createEventPersistenceTarget({
      runtime: eventRuntime,
      databaseConfig: ethereumDatabaseConfig,
      db: ethereumDb,
    });

    async function runEventFixture(
      selectedBlock: PortalBlock = eventBlock,
      includeBridge = true,
    ): Promise<void> {
      const portal = await mockEvmPortalStream({
        blocks: includeBridge ? [...bridgeBlocks, selectedBlock] : [selectedBlock],
        finalized: { number: block1.header.number, hash: block1.header.hash },
      });
      try {
        const stream = evmPortalStream({
          id: eventRuntime.streamId,
          portal: portal.url,
          outputs: createEventIngestionOutput(eventRuntime),
          logger: 'error',
          profiler: false,
        }).pipe((data, ctx) => createPersistenceBatch(eventRuntime, data, ctx));
        await stream.pipeTo(eventTarget);
      } finally {
        await portal.close();
      }
    }

    await runEventFixture();
    const firstRows = await ethereumDb
      .select()
      .from(eventFacts)
      .where(eq(eventFacts.blockNumber, eventBlock.header.number))
      .orderBy(eventFacts.logIndex);
    expect(firstRows).toHaveLength(2);
    expect(firstRows[0]).toMatchObject({
      id: 'eip155:1:log:10:0:0',
      network: 'ethereum-mainnet',
      chainId: 1,
      blockNumber: 10,
      blockHash: eventBlock.header.hash,
      parentHash: eventBlock.header.parentHash,
      transactionHash: eventBlock.logs[0]?.transactionHash,
      transactionIndex: 0,
      logIndex: 0,
      address: testAddress,
      eventName: 'DataChanged',
      eventDomain: 'erc725y',
      decoded: { dataKey, dataValue: '0x1234' },
    });
    expect(firstRows[1]).toMatchObject({
      id: 'eip155:1:log:10:0:1',
      eventName: 'DataChanged',
      eventDomain: 'erc725y',
      decoded: null,
      data: '0x00',
    });

    const firstDigest = await testAdminPool.query<{ digest: string }>(`
      SELECT md5(jsonb_agg(to_jsonb(e) ORDER BY e.log_index)::text) AS digest
      FROM chain_ethereum_mainnet.event_facts e
      WHERE e.block_number = 10
    `);
    await ethereumPool.query('DELETE FROM sqd_cursor');

    const conflictingLog = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: testAddress,
      args: { dataKey, dataValue: '0xbeef' },
    });
    const conflictingBlock = mockBlock({
      number: eventBlock.header.number,
      timestamp: eventBlock.header.timestamp,
      hash: eventBlock.header.hash,
      parentHash: eventBlock.header.parentHash,
      transactions: [{ logs: [conflictingLog, { ...validLog, data: '0x00' }] }],
    });
    await expect(runEventFixture(conflictingBlock, false)).rejects.toThrow(
      'Conflicting persisted event for deterministic ID eip155:1:log:10:0:0',
    );
    expect(await countRows(ethereumPool, 'sqd_cursor')).toBe(0);

    await runEventFixture(eventBlock, false);
    const replayDigest = await testAdminPool.query<{ digest: string }>(`
      SELECT md5(jsonb_agg(to_jsonb(e) ORDER BY e.log_index)::text) AS digest
      FROM chain_ethereum_mainnet.event_facts e
      WHERE e.block_number = 10
    `);
    expect(replayDigest.rows[0]?.digest).toBe(firstDigest.rows[0]?.digest);
    expect(
      await ethereumDb
        .select()
        .from(eventFacts)
        .where(eq(eventFacts.blockNumber, eventBlock.header.number)),
    ).toHaveLength(2);

    if (eventTarget.resolveFork == null) throw new Error('Event target must support forks');
    const cursor = await eventTarget.resolveFork([
      {
        number: block1.header.number,
        hash: block1.header.hash,
        timestamp: block1.header.timestamp,
      },
    ]);
    expect(cursor).toMatchObject({ number: block1.header.number, hash: block1.header.hash });
    expect(await countRows(ethereumPool, 'blocks')).toBe(1);
    expect(await countRows(ethereumPool, 'event_facts')).toBe(1);
    expect(await countRows(ethereumPool, 'sqd_cursor')).toBe(0);
  });

  it('keeps projections idempotent on replay and restores ownership across a fork', async () => {
    const partialRuntime = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_FROM_BLOCK: '20',
      INDEXER_TO_BLOCK: '21',
    });
    await expect(assertProjectionReplayStart(ethereumDb, partialRuntime)).rejects.toThrow(
      'has no cursor and must start at block 0',
    );

    const projectionRuntime = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_FROM_BLOCK: '0',
      INDEXER_TO_BLOCK: '21',
    });
    const mintLog = encodeEvent({
      abi: LSP7_EVENT_ABI,
      eventName: 'Transfer',
      address: testAddress,
      args: {
        operator: firstOwner,
        from: '0x0000000000000000000000000000000000000000',
        to: firstOwner,
        amount: 10n,
        force: true,
        data: '0x',
      },
    });
    const transferLog = encodeEvent({
      abi: LSP7_EVENT_ABI,
      eventName: 'Transfer',
      address: testAddress,
      args: {
        operator: firstOwner,
        from: firstOwner,
        to: secondOwner,
        amount: 4n,
        force: true,
        data: '0x',
      },
    });
    const projectionBridgeBlocks: PortalBlock[] = [];
    let projectionParentHash = block1.header.hash;
    for (let number = 2; number < 20; number += 1) {
      const block = mockBlock({
        number,
        timestamp: 1_700_000_000_000 + number * 1_000,
        hash: hashFor(400 + number),
        parentHash: projectionParentHash,
      });
      projectionBridgeBlocks.push(block);
      projectionParentHash = block.header.hash;
    }
    const mintBlock = mockBlock({
      number: 20,
      timestamp: 1_700_000_020_000,
      hash: hashFor(120),
      parentHash: projectionParentHash,
      transactions: [{ logs: [mintLog] }],
    });
    const transferBlock = mockBlock({
      number: 21,
      timestamp: 1_700_000_021_000,
      hash: hashFor(121),
      parentHash: mintBlock.header.hash,
      transactions: [{ logs: [transferLog] }],
    });
    const projectionTarget = createProjectionPersistenceTarget({
      runtime: projectionRuntime,
      databaseConfig: ethereumDatabaseConfig,
      db: ethereumDb,
    });

    async function runProjectionFixture(includeBridge = true): Promise<void> {
      const portal = await mockEvmPortalStream({
        blocks: includeBridge
          ? [...projectionBridgeBlocks, mintBlock, transferBlock]
          : [transferBlock],
        finalized: { number: block1.header.number, hash: block1.header.hash },
      });
      try {
        const outputs = createEventIngestionOutput(projectionRuntime).pipe({
          transform(facts): ProjectionBatch {
            const verifications: ProjectionVerification[] = collectProjectionCandidates(facts).map(
              (candidate) => ({
                ...candidate,
                status: 'verified',
                standard: candidate.category === 'digitalAsset' ? 'lsp7' : null,
                decimals: candidate.category === 'digitalAsset' ? 18 : null,
              }),
            );
            return { facts, verifications, claimStatusUpdates: [] };
          },
        });
        const stream = evmPortalStream({
          id: projectionRuntime.streamId,
          portal: portal.url,
          outputs,
          logger: 'error',
          profiler: false,
        }).pipe((data, ctx) => createPersistenceBatch(projectionRuntime, data, ctx));
        await stream.pipeTo(projectionTarget);
      } finally {
        await portal.close();
      }
    }

    await runProjectionFixture();
    expect(await ethereumDb.select().from(digitalAssets)).toEqual([
      expect.objectContaining({ address: testAddress, totalSupply: '10' }),
    ]);
    expect(await ethereumDb.select().from(ownedAssets).orderBy(ownedAssets.ownerAddress)).toEqual([
      expect.objectContaining({ ownerAddress: firstOwner, balance: '6' }),
      expect.objectContaining({ ownerAddress: secondOwner, balance: '4' }),
    ]);

    await ethereumPool.query('DELETE FROM sqd_cursor WHERE current_number = 21');
    await runProjectionFixture(false);
    expect(await ethereumDb.select().from(ownedAssets).orderBy(ownedAssets.ownerAddress)).toEqual([
      expect.objectContaining({ ownerAddress: firstOwner, balance: '6' }),
      expect.objectContaining({ ownerAddress: secondOwner, balance: '4' }),
    ]);

    if (projectionTarget.resolveFork == null) {
      throw new Error('Projection target must support forks');
    }
    await projectionTarget.resolveFork([
      {
        number: mintBlock.header.number,
        hash: mintBlock.header.hash,
        timestamp: mintBlock.header.timestamp,
      },
    ]);
    expect(await ethereumDb.select().from(ownedAssets)).toEqual([
      expect.objectContaining({ ownerAddress: firstOwner, balance: '10' }),
    ]);
    expect(
      await ethereumDb.select().from(eventFacts).where(eq(eventFacts.blockNumber, 20)),
    ).toHaveLength(1);

    await projectionTarget.resolveFork([
      {
        number: block1.header.number,
        hash: block1.header.hash,
        timestamp: block1.header.timestamp,
      },
    ]);
    expect(await countRows(ethereumPool, 'digital_assets')).toBe(0);
    expect(await countRows(ethereumPool, 'owned_assets')).toBe(0);
    expect(
      await ethereumDb.select().from(eventFacts).where(eq(eventFacts.blockNumber, 20)),
    ).toHaveLength(0);
  });

  it('creates and rolls back a metadata job in the same projection transaction', async () => {
    const metadataTestAddress = addressFor(222);
    const [previousBlock] = await ethereumDb
      .select({ number: blocks.number, hash: blocks.hash, timestamp: blocks.timestamp })
      .from(blocks)
      .orderBy(desc(blocks.number))
      .limit(1);
    if (previousBlock == null) throw new Error('Expected a canonical predecessor block');
    const metadataBlockNumber = 90;
    if (previousBlock.number >= metadataBlockNumber) {
      throw new Error('Metadata rollback fixture must advance beyond existing canonical history');
    }
    const metadataRuntime = loadRuntimeConfig({
      INDEXER_NETWORK: 'ethereum-mainnet',
      INDEXER_FROM_BLOCK: '0',
      INDEXER_TO_BLOCK: String(metadataBlockNumber),
    });
    const metadataValue = encodeVerifiableUri(
      { LSP3Profile: { name: 'Metadata profile' } },
      'ipfs://metadata-profile',
    );
    const metadataLog = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: metadataTestAddress,
      args: { dataKey: DATA_KEYS.lsp3Profile, dataValue: metadataValue },
    });
    const metadataBlocks: PortalBlock[] = [];
    let parentHash = previousBlock.hash;
    let rollbackNumber = previousBlock.number;
    let rollbackHash = previousBlock.hash;
    let rollbackTimestamp = previousBlock.timestamp.getTime();
    for (let number = previousBlock.number + 1; number <= metadataBlockNumber; number += 1) {
      const isMetadataBlock = number === metadataBlockNumber;
      const block = mockBlock({
        number,
        timestamp: 1_700_000_000 + number,
        hash: hashFor(1_000 + number),
        parentHash,
        ...(isMetadataBlock ? { transactions: [{ logs: [metadataLog] }] } : {}),
      });
      metadataBlocks.push(block);
      parentHash = block.header.hash;
      if (!isMetadataBlock) {
        rollbackNumber = block.header.number;
        rollbackHash = block.header.hash;
        rollbackTimestamp = block.header.timestamp;
      }
    }
    const metadataBlock = metadataBlocks.at(-1);
    if (metadataBlock == null) throw new Error('Expected metadata block fixture');
    const metadataTarget = createProjectionPersistenceTarget({
      runtime: metadataRuntime,
      databaseConfig: ethereumDatabaseConfig,
      db: ethereumDb,
    });
    const portal = await mockEvmPortalStream({
      blocks: metadataBlocks,
      finalized: { number: rollbackNumber, hash: rollbackHash },
    });
    try {
      const outputs = createEventIngestionOutput(metadataRuntime).pipe({
        transform(facts): ProjectionBatch {
          const verifications: ProjectionVerification[] = collectProjectionCandidates(facts).map(
            (candidate) => ({
              ...candidate,
              status: candidate.category === 'universalProfile' ? 'verified' : 'invalid',
              standard: null,
              decimals: null,
            }),
          );
          return { facts, verifications, claimStatusUpdates: [] };
        },
      });
      const stream = evmPortalStream({
        id: metadataRuntime.streamId,
        portal: portal.url,
        outputs,
        logger: 'error',
        profiler: false,
      }).pipe((data, ctx) => createPersistenceBatch(metadataRuntime, data, ctx));
      await stream.pipeTo(metadataTarget);
    } finally {
      await portal.close();
    }

    expect(
      await ethereumDb.select().from(dataValues).where(eq(dataValues.address, metadataTestAddress)),
    ).toEqual([
      expect.objectContaining({
        address: metadataTestAddress,
        dataKey: DATA_KEYS.lsp3Profile,
        dataValue: metadataValue,
        lastBlockNumber: metadataBlockNumber,
      }),
    ]);
    expect(
      await ethereumDb
        .select()
        .from(metadataJobs)
        .where(eq(metadataJobs.address, metadataTestAddress)),
    ).toEqual([
      expect.objectContaining({
        kind: 'lsp3_profile',
        status: 'pending',
        address: metadataTestAddress,
        sourceBlockNumber: metadataBlockNumber,
      }),
    ]);

    if (metadataTarget.resolveFork == null) {
      throw new Error('Metadata projection target must support forks');
    }
    await metadataTarget.resolveFork([
      {
        number: rollbackNumber,
        hash: rollbackHash,
        timestamp: rollbackTimestamp,
      },
    ]);
    expect(
      await ethereumDb.select().from(dataValues).where(eq(dataValues.address, metadataTestAddress)),
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dataValue: metadataValue,
          lastBlockNumber: metadataBlockNumber,
        }),
      ]),
    );
    expect(
      await ethereumDb
        .select()
        .from(metadataJobs)
        .where(eq(metadataJobs.address, metadataTestAddress)),
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contentUri: 'ipfs://metadata-profile',
          sourceBlockNumber: metadataBlockNumber,
        }),
      ]),
    );
  });

  it('queues stored metadata when a later unrelated event verifies its target', async () => {
    const metadataAddress = addressFor(223);
    const newOwner = addressFor(224);
    const [previousBlock] = await ethereumDb
      .select({ number: blocks.number, hash: blocks.hash })
      .from(blocks)
      .orderBy(desc(blocks.number))
      .limit(1);
    if (previousBlock == null) throw new Error('Expected a canonical predecessor block');

    const metadataValue = encodeVerifiableUri(
      { LSP3Profile: { name: 'Eventually verified profile' } },
      'ipfs://eventually-verified-profile',
    );
    const metadataLog = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: metadataAddress,
      args: { dataKey: DATA_KEYS.lsp3Profile, dataValue: metadataValue },
    });
    const verificationLog = encodeEvent({
      abi: LSP14_EVENT_ABI,
      eventName: 'OwnershipTransferred',
      address: metadataAddress,
      args: { previousOwner: ZERO_ADDRESS, newOwner },
    });
    const metadataBlock = mockBlock({
      number: previousBlock.number + 1,
      timestamp: 1_700_001_000,
      hash: hashFor(1_201),
      parentHash: previousBlock.hash,
      transactions: [{ logs: [metadataLog] }],
    });
    const verificationBlock = mockBlock({
      number: metadataBlock.header.number + 1,
      timestamp: 1_700_001_001,
      hash: hashFor(1_202),
      parentHash: metadataBlock.header.hash,
      transactions: [{ logs: [verificationLog] }],
    });
    const repeatedMetadataBlock = mockBlock({
      number: verificationBlock.header.number + 1,
      timestamp: 1_700_001_002,
      hash: hashFor(1_203),
      parentHash: verificationBlock.header.hash,
      transactions: [{ logs: [metadataLog] }],
    });

    async function persistVerificationFixture(
      block: PortalBlock,
      verified: boolean,
      finalized = { number: block.header.number, hash: block.header.hash },
    ): Promise<void> {
      const runtime = loadRuntimeConfig({
        INDEXER_NETWORK: 'ethereum-mainnet',
        INDEXER_FROM_BLOCK: '0',
        INDEXER_TO_BLOCK: String(block.header.number),
      });
      const target = createProjectionPersistenceTarget({
        runtime,
        databaseConfig: ethereumDatabaseConfig,
        db: ethereumDb,
      });
      const portal = await mockEvmPortalStream({ blocks: [block], finalized });
      try {
        const outputs = createEventIngestionOutput(runtime).pipe({
          transform(facts): ProjectionBatch {
            const verifications: ProjectionVerification[] = collectProjectionCandidates(facts).map(
              (candidate) => ({
                ...candidate,
                status:
                  verified &&
                  candidate.address === metadataAddress &&
                  candidate.category === 'universalProfile'
                    ? 'verified'
                    : 'invalid',
                standard: null,
                decimals: null,
              }),
            );
            return { facts, verifications, claimStatusUpdates: [] };
          },
        });
        const stream = evmPortalStream({
          id: runtime.streamId,
          portal: portal.url,
          outputs,
          logger: 'error',
          profiler: false,
        }).pipe((data, ctx) => createPersistenceBatch(runtime, data, ctx));
        await stream.pipeTo(target);
      } finally {
        await portal.close();
      }
    }

    await persistVerificationFixture(metadataBlock, false);
    expect(
      await ethereumDb.select().from(dataValues).where(eq(dataValues.address, metadataAddress)),
    ).toHaveLength(1);
    expect(
      await ethereumDb.select().from(metadataJobs).where(eq(metadataJobs.address, metadataAddress)),
    ).toEqual([]);

    const metadataFinality = {
      number: metadataBlock.header.number,
      hash: metadataBlock.header.hash,
    };
    await persistVerificationFixture(verificationBlock, true, metadataFinality);
    await persistVerificationFixture(repeatedMetadataBlock, true, metadataFinality);
    expect(
      await ethereumDb.select().from(dataValues).where(eq(dataValues.address, metadataAddress)),
    ).toEqual([
      expect.objectContaining({
        dataValue: metadataValue,
        lastBlockNumber: metadataBlock.header.number,
        lastBlockHash: metadataBlock.header.hash,
      }),
    ]);
    expect(
      await ethereumDb.select().from(metadataJobs).where(eq(metadataJobs.address, metadataAddress)),
    ).toEqual([
      expect.objectContaining({
        kind: 'lsp3_profile',
        status: 'pending',
        contentUri: 'ipfs://eventually-verified-profile',
        sourceBlockNumber: verificationBlock.header.number,
        sourceBlockHash: verificationBlock.header.hash,
      }),
    ]);
    const claimTime = new Date('2030-01-01T00:00:00Z');
    expect(
      await claimMetadataJobs(ethereumDb, ethereumRuntime, {
        limit: 1,
        leaseTimeoutMs: 2_000,
        now: claimTime,
      }),
    ).toEqual([]);

    await ethereumDb
      .update(indexedHeads)
      .set({
        finalizedBlockNumber: verificationBlock.header.number,
        finalizedBlockHash: verificationBlock.header.hash,
      })
      .where(eq(indexedHeads.chainId, ethereumRuntime.network.chainId));
    const [verifiedClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 1,
      leaseTimeoutMs: 2_000,
      now: claimTime,
    });
    expect(verifiedClaim).toMatchObject({ sourceBlockNumber: verificationBlock.header.number });
  });

  it('reapplies stored LSP8 locations and NFT verification during collection recovery', async () => {
    const collectionAddress = addressFor(227);
    const tokenId = toHex(42n, { size: 32 });
    const baseUriValue = concatHex([
      '0x0000000000000000',
      stringToHex('ipfs://recovered-collection/'),
    ]);
    const [previousBlock] = await ethereumDb
      .select({ number: blocks.number, hash: blocks.hash })
      .from(blocks)
      .orderBy(desc(blocks.number))
      .limit(1);
    if (previousBlock == null) throw new Error('Expected a canonical predecessor block');

    await ethereumDb.insert(digitalAssets).values({
      id: createAddressId('digital-asset', ethereumRuntime.network.chainId, collectionAddress),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: collectionAddress,
      standard: 'lsp8',
      tokenIdFormat: null,
      baseUri: null,
      verification: 'invalid',
      lastBlockNumber: previousBlock.number,
      lastBlockHash: previousBlock.hash,
      lastTransactionHash: null,
      lastTransactionIndex: null,
      lastLogIndex: null,
    });
    await ethereumDb.insert(nfts).values({
      id: 'recovered-location-nft',
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: collectionAddress,
      tokenId,
      formattedTokenId: null,
      tokenUri: null,
      verification: 'verified',
      lastBlockNumber: previousBlock.number,
      lastBlockHash: previousBlock.hash,
      lastTransactionHash: null,
      lastTransactionIndex: null,
      lastLogIndex: null,
    });
    const directContent = { LSP4Metadata: { name: 'Recovered direct token metadata' } };
    await ethereumDb.insert(dataValues).values([
      {
        id: createDataValueId(
          ethereumRuntime.network.chainId,
          collectionAddress,
          DATA_KEYS.lsp8MetadataBaseUri,
        ),
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: collectionAddress,
        tokenId: null,
        dataKey: DATA_KEYS.lsp8MetadataBaseUri,
        dataValue: baseUriValue,
        lastBlockNumber: previousBlock.number,
        lastBlockHash: previousBlock.hash,
        lastTransactionHash: null,
        lastTransactionIndex: null,
        lastLogIndex: null,
      },
      {
        id: createDataValueId(
          ethereumRuntime.network.chainId,
          collectionAddress,
          DATA_KEYS.lsp8TokenIdFormat,
        ),
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: collectionAddress,
        tokenId: null,
        dataKey: DATA_KEYS.lsp8TokenIdFormat,
        dataValue: toHex(0, { size: 1 }),
        lastBlockNumber: previousBlock.number,
        lastBlockHash: previousBlock.hash,
        lastTransactionHash: null,
        lastTransactionIndex: null,
        lastLogIndex: null,
      },
      {
        id: createDataValueId(
          ethereumRuntime.network.chainId,
          collectionAddress,
          DATA_KEYS.lsp4Metadata,
          tokenId,
        ),
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: collectionAddress,
        tokenId,
        dataKey: DATA_KEYS.lsp4Metadata,
        dataValue: encodeVerifiableUri(directContent, 'ipfs://recovered-direct-token'),
        lastBlockNumber: previousBlock.number,
        lastBlockHash: previousBlock.hash,
        lastTransactionHash: null,
        lastTransactionIndex: null,
        lastLogIndex: null,
      },
    ]);

    const verificationBlock = mockBlock({
      number: previousBlock.number + 1,
      timestamp: 1_700_001_050,
      hash: hashFor(1_250),
      parentHash: previousBlock.hash,
      transactions: [
        {
          logs: [
            encodeEvent({
              abi: LSP14_EVENT_ABI,
              eventName: 'OwnershipTransferred',
              address: collectionAddress,
              args: { previousOwner: ZERO_ADDRESS, newOwner: addressFor(228) },
            }),
          ],
        },
      ],
    });
    async function persistCollectionBlock(block: PortalBlock): Promise<void> {
      const runtime = loadRuntimeConfig({
        INDEXER_NETWORK: 'ethereum-mainnet',
        INDEXER_FROM_BLOCK: '0',
        INDEXER_TO_BLOCK: String(block.header.number),
      });
      const target = createProjectionPersistenceTarget({
        runtime,
        databaseConfig: ethereumDatabaseConfig,
        db: ethereumDb,
      });
      const portal = await mockEvmPortalStream({
        blocks: [block],
        finalized: { number: block.header.number, hash: block.header.hash },
      });
      try {
        const outputs = createEventIngestionOutput(runtime).pipe({
          transform(facts): ProjectionBatch {
            const verifications: ProjectionVerification[] = collectProjectionCandidates(facts).map(
              (candidate) => ({
                ...candidate,
                status:
                  candidate.address === collectionAddress && candidate.category === 'digitalAsset'
                    ? 'verified'
                    : 'invalid',
                standard: candidate.category === 'digitalAsset' ? 'lsp8' : null,
                decimals: null,
              }),
            );
            return { facts, verifications, claimStatusUpdates: [] };
          },
        });
        const stream = evmPortalStream({
          id: runtime.streamId,
          portal: portal.url,
          outputs,
          logger: 'error',
          profiler: false,
        }).pipe((data, ctx) => createPersistenceBatch(runtime, data, ctx));
        await stream.pipeTo(target);
      } finally {
        await portal.close();
      }
    }
    await persistCollectionBlock(verificationBlock);

    expect(
      await ethereumDb
        .select()
        .from(digitalAssets)
        .where(eq(digitalAssets.address, collectionAddress)),
    ).toEqual([
      expect.objectContaining({
        verification: 'verified',
        standard: 'lsp8',
        tokenIdFormat: 0,
        baseUri: 'ipfs://recovered-collection/',
      }),
    ]);
    expect(await ethereumDb.select().from(nfts).where(eq(nfts.address, collectionAddress))).toEqual(
      [
        expect.objectContaining({
          formattedTokenId: '42',
          tokenUri: 'ipfs://recovered-collection/42',
          lastBlockNumber: verificationBlock.header.number,
        }),
      ],
    );
    expect(
      await ethereumDb
        .select()
        .from(metadataJobs)
        .where(eq(metadataJobs.address, collectionAddress)),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dataKey: DATA_KEYS.lsp4Metadata,
          contentUri: 'ipfs://recovered-direct-token',
          sourceBlockNumber: verificationBlock.header.number,
        }),
        expect.objectContaining({
          dataKey: DATA_KEYS.lsp8MetadataBaseUri,
          contentUri: 'ipfs://recovered-collection/42',
          sourceBlockNumber: verificationBlock.header.number,
        }),
      ]),
    );

    const repeatedLocationBlock = mockBlock({
      number: verificationBlock.header.number + 1,
      timestamp: 1_700_001_051,
      hash: hashFor(1_251),
      parentHash: verificationBlock.header.hash,
      transactions: [
        {
          logs: [
            encodeEvent({
              abi: ERC725Y_EVENT_ABI,
              eventName: 'DataChanged',
              address: collectionAddress,
              args: { dataKey: DATA_KEYS.lsp8MetadataBaseUri, dataValue: baseUriValue },
            }),
            encodeEvent({
              abi: ERC725Y_EVENT_ABI,
              eventName: 'DataChanged',
              address: collectionAddress,
              args: {
                dataKey: DATA_KEYS.lsp8TokenIdFormat,
                dataValue: toHex(0, { size: 1 }),
              },
            }),
            encodeEvent({
              abi: LSP8_EVENT_ABI,
              eventName: 'Transfer',
              address: collectionAddress,
              args: {
                operator: addressFor(229),
                from: addressFor(229),
                to: addressFor(230),
                tokenId,
                force: true,
                data: '0x',
              },
            }),
          ],
        },
      ],
    });
    await persistCollectionBlock(repeatedLocationBlock);

    const locationRows = await ethereumDb
      .select({ dataKey: dataValues.dataKey, lastBlockNumber: dataValues.lastBlockNumber })
      .from(dataValues)
      .where(
        and(
          eq(dataValues.address, collectionAddress),
          inArray(dataValues.dataKey, [DATA_KEYS.lsp8MetadataBaseUri, DATA_KEYS.lsp8TokenIdFormat]),
        ),
      );
    expect(locationRows).toHaveLength(2);
    expect(
      locationRows.every(({ lastBlockNumber }) => lastBlockNumber === previousBlock.number),
    ).toBe(true);
    expect(await ethereumDb.select().from(nfts).where(eq(nfts.address, collectionAddress))).toEqual(
      [
        expect.objectContaining({
          ownerAddress: addressFor(230),
          lastBlockNumber: repeatedLocationBlock.header.number,
        }),
      ],
    );
    expect(
      await ethereumDb
        .select()
        .from(metadataJobs)
        .where(
          and(
            eq(metadataJobs.address, collectionAddress),
            eq(metadataJobs.dataKey, DATA_KEYS.lsp8MetadataBaseUri),
          ),
        ),
    ).toEqual([
      expect.objectContaining({
        status: 'pending',
        sourceBlockNumber: verificationBlock.header.number,
      }),
    ]);
  });

  it('cancels LSP29 jobs when the authoritative array length shrinks', async () => {
    const metadataAddress = addressFor(225);
    const [previousBlock] = await ethereumDb
      .select({ number: blocks.number, hash: blocks.hash })
      .from(blocks)
      .orderBy(desc(blocks.number))
      .limit(1);
    if (previousBlock == null) throw new Error('Expected a canonical predecessor block');

    const indexKey = concatHex([DATA_KEYS.lsp29EncryptedAssetsIndex, toHex(1n, { size: 16 })]);
    const encryptedValue = encodeLsp31Uri(
      [
        { backend: 'ipfs', cid: 'bafy-encrypted-asset' },
        { backend: 'arweave', transactionId: 'encrypted-asset' },
      ],
      computeContentHash(toBytes('encrypted asset')),
    );
    const initialBlock = mockBlock({
      number: previousBlock.number + 1,
      timestamp: 1_700_001_100,
      hash: hashFor(1_301),
      parentHash: previousBlock.hash,
      transactions: [
        {
          logs: [
            encodeEvent({
              abi: ERC725Y_EVENT_ABI,
              eventName: 'DataChanged',
              address: metadataAddress,
              args: {
                dataKey: DATA_KEYS.lsp29EncryptedAssetsLength,
                dataValue: toHex(2n, { size: 16 }),
              },
            }),
            encodeEvent({
              abi: ERC725Y_EVENT_ABI,
              eventName: 'DataChanged',
              address: metadataAddress,
              args: { dataKey: indexKey, dataValue: encryptedValue },
            }),
          ],
        },
      ],
    });
    const shrinkBlock = mockBlock({
      number: initialBlock.header.number + 1,
      timestamp: 1_700_001_101,
      hash: hashFor(1_302),
      parentHash: initialBlock.header.hash,
      transactions: [
        {
          logs: [
            encodeEvent({
              abi: ERC725Y_EVENT_ABI,
              eventName: 'DataChanged',
              address: metadataAddress,
              args: {
                dataKey: DATA_KEYS.lsp29EncryptedAssetsLength,
                dataValue: toHex(1n, { size: 16 }),
              },
            }),
          ],
        },
      ],
    });

    async function persistLsp29Block(
      block: PortalBlock,
      finalized: { number: number; hash: string },
    ): Promise<void> {
      const runtime = loadRuntimeConfig({
        INDEXER_NETWORK: 'ethereum-mainnet',
        INDEXER_FROM_BLOCK: '0',
        INDEXER_TO_BLOCK: String(block.header.number),
      });
      const target = createProjectionPersistenceTarget({
        runtime,
        databaseConfig: ethereumDatabaseConfig,
        db: ethereumDb,
      });
      const portal = await mockEvmPortalStream({ blocks: [block], finalized });
      try {
        const outputs = createEventIngestionOutput(runtime).pipe({
          transform(facts): ProjectionBatch {
            const verifications: ProjectionVerification[] = collectProjectionCandidates(facts).map(
              (candidate) => ({
                ...candidate,
                status:
                  candidate.address === metadataAddress && candidate.category === 'universalProfile'
                    ? 'verified'
                    : 'invalid',
                standard: null,
                decimals: null,
              }),
            );
            return { facts, verifications, claimStatusUpdates: [] };
          },
        });
        const stream = evmPortalStream({
          id: runtime.streamId,
          portal: portal.url,
          outputs,
          logger: 'error',
          profiler: false,
        }).pipe((data, ctx) => createPersistenceBatch(runtime, data, ctx));
        await stream.pipeTo(target);
      } finally {
        await portal.close();
      }
    }

    await persistLsp29Block(initialBlock, {
      number: initialBlock.header.number,
      hash: initialBlock.header.hash,
    });
    const claimTime = new Date('2030-01-01T01:00:00Z');
    const initialClaims = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 100,
      leaseTimeoutMs: 2_000,
      now: claimTime,
    });
    const encryptedClaim = initialClaims.find(
      ({ address, kind }) => address === metadataAddress && kind === 'lsp29_encrypted_asset',
    );
    if (encryptedClaim == null) throw new Error('Expected current LSP29 slot to be claimable');
    for (const unrelatedClaim of initialClaims) {
      if (unrelatedClaim.id !== encryptedClaim.id) {
        await cancelClaimedMetadataJob(ethereumDb, unrelatedClaim, claimTime);
      }
    }
    expect(
      await loadClaimedMetadataSource(ethereumDb, ethereumRuntime, encryptedClaim),
    ).not.toBeNull();

    await persistLsp29Block(shrinkBlock, {
      number: initialBlock.header.number,
      hash: initialBlock.header.hash,
    });
    expect(await loadClaimedMetadataSource(ethereumDb, ethereumRuntime, encryptedClaim)).toBeNull();
    expect(
      await ethereumDb.select().from(metadataJobs).where(eq(metadataJobs.id, encryptedClaim.id)),
    ).toEqual([
      expect.objectContaining({
        status: 'cancelled',
        claimedAt: null,
        sourceBlockNumber: initialBlock.header.number,
      }),
    ]);
  });

  it('pages collection-wide metadata recovery at the write bound', async () => {
    const collectionAddress = addressFor(226);
    const blockNumber = 1_400;
    const blockHash = hashFor(blockNumber);
    await ethereumDb.insert(digitalAssets).values({
      id: createAddressId('digital-asset', ethereumRuntime.network.chainId, collectionAddress),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: collectionAddress,
      standard: 'lsp8',
      verification: 'verified',
      lastBlockNumber: blockNumber,
      lastBlockHash: blockHash,
      lastTransactionHash: null,
      lastTransactionIndex: null,
      lastLogIndex: null,
    });

    const tokenIds = Array.from({ length: 501 }, (_, index) =>
      toHex(BigInt(index + 1), { size: 32 }),
    );
    await ethereumDb.insert(nfts).values(
      tokenIds.map((currentTokenId, index): typeof nfts.$inferInsert => ({
        id: `pagination-nft-${index}`,
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: collectionAddress,
        tokenId: currentTokenId,
        verification: 'verified',
        lastBlockNumber: blockNumber,
        lastBlockHash: blockHash,
        lastTransactionHash: null,
        lastTransactionIndex: null,
        lastLogIndex: null,
      })),
    );
    await ethereumDb.insert(dataValues).values(
      tokenIds.map((currentTokenId) => ({
        id: createDataValueId(
          ethereumRuntime.network.chainId,
          collectionAddress,
          DATA_KEYS.lsp4Metadata,
          currentTokenId,
        ),
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        address: collectionAddress,
        tokenId: currentTokenId,
        dataKey: DATA_KEYS.lsp4Metadata,
        dataValue: '0x',
        lastBlockNumber: blockNumber,
        lastBlockHash: blockHash,
        lastTransactionHash: null,
        lastTransactionIndex: null,
        lastLogIndex: null,
      })),
    );

    const pageSizes = await ethereumDb.transaction(async (tx): Promise<number[]> => {
      const sizes: number[] = [];
      for await (const page of loadMetadataRecoveryCandidatePages(tx, ethereumRuntime, {
        profileTargets: [],
        assetTargets: [],
        tokenCollectionTargets: [
          {
            address: collectionAddress,
            eligibleBlockNumber: blockNumber,
            eligibleBlockHash: blockHash,
          },
        ],
        nftTargets: [],
        lsp29Targets: [],
      })) {
        sizes.push(page.dataValues.length + page.nfts.length);
      }
      return sizes;
    });
    expect(pageSizes).toEqual([500, 1, 500, 1]);
  });

  it('restores a superseded processing lease across rollback and safely republishes it', async () => {
    const [previousBlock] = await ethereumDb
      .select({ number: blocks.number, hash: blocks.hash })
      .from(blocks)
      .orderBy(desc(blocks.number))
      .limit(1);
    if (previousBlock == null) throw new Error('Expected a canonical predecessor block');
    const metadataAddress = addressFor(221);
    const firstContent = { LSP3Profile: { name: 'Finalized revision A' } };
    const secondContent = { LSP3Profile: { name: 'Unfinalized revision B' } };
    const firstValue = encodeVerifiableUri(firstContent, 'ipfs://finalized-revision-a');
    const secondValue = encodeVerifiableUri(secondContent, 'ipfs://unfinalized-revision-b');
    const firstLog = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: metadataAddress,
      args: { dataKey: DATA_KEYS.lsp3Profile, dataValue: firstValue },
    });
    const secondLog = encodeEvent({
      abi: ERC725Y_EVENT_ABI,
      eventName: 'DataChanged',
      address: metadataAddress,
      args: { dataKey: DATA_KEYS.lsp3Profile, dataValue: secondValue },
    });
    const firstBlock = mockBlock({
      number: previousBlock.number + 1,
      timestamp: 1_700_000_101,
      hash: hashFor(141),
      parentHash: previousBlock.hash,
      transactions: [{ logs: [firstLog] }],
    });
    const secondBlock = mockBlock({
      number: firstBlock.header.number + 1,
      timestamp: 1_700_000_102,
      hash: hashFor(142),
      parentHash: firstBlock.header.hash,
      transactions: [{ logs: [secondLog] }],
    });

    async function persistMetadataBlock(
      block: PortalBlock,
      finalized: { number: number; hash: string },
    ): Promise<ReturnType<typeof createProjectionPersistenceTarget>> {
      const metadataRuntime = loadRuntimeConfig({
        INDEXER_NETWORK: 'ethereum-mainnet',
        INDEXER_FROM_BLOCK: '0',
        INDEXER_TO_BLOCK: String(block.header.number),
      });
      const metadataTarget = createProjectionPersistenceTarget({
        runtime: metadataRuntime,
        databaseConfig: ethereumDatabaseConfig,
        db: ethereumDb,
      });
      const portal = await mockEvmPortalStream({ blocks: [block], finalized });
      try {
        const outputs = createEventIngestionOutput(metadataRuntime).pipe({
          transform(facts): ProjectionBatch {
            const verifications: ProjectionVerification[] = collectProjectionCandidates(facts).map(
              (candidate) => ({
                ...candidate,
                status: candidate.category === 'universalProfile' ? 'verified' : 'invalid',
                standard: null,
                decimals: null,
              }),
            );
            return { facts, verifications, claimStatusUpdates: [] };
          },
        });
        const stream = evmPortalStream({
          id: metadataRuntime.streamId,
          portal: portal.url,
          outputs,
          logger: 'error',
          profiler: false,
        }).pipe((data, ctx) => createPersistenceBatch(metadataRuntime, data, ctx));
        await stream.pipeTo(metadataTarget);
      } finally {
        await portal.close();
      }
      return metadataTarget;
    }

    await persistMetadataBlock(firstBlock, {
      number: firstBlock.header.number,
      hash: firstBlock.header.hash,
    });
    const leaseStartedAt = new Date('2030-01-02T00:00:00Z');
    const firstClaims = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 100,
      leaseTimeoutMs: 2_000,
      now: leaseStartedAt,
    });
    const firstClaim = firstClaims.find(({ address }) => address === metadataAddress);
    if (firstClaim == null) throw new Error('Expected revision A to be claimable after finality');
    for (const unrelatedClaim of firstClaims) {
      if (unrelatedClaim.id !== firstClaim.id) {
        await cancelClaimedMetadataJob(ethereumDb, unrelatedClaim, leaseStartedAt);
      }
    }
    expect(firstClaim).toMatchObject({ status: 'processing', attempts: 1 });

    const secondTarget = await persistMetadataBlock(secondBlock, {
      number: firstBlock.header.number,
      hash: firstBlock.header.hash,
    });
    const jobsAfterSecondRevision = await ethereumDb
      .select()
      .from(metadataJobs)
      .where(eq(metadataJobs.address, metadataAddress));
    expect(jobsAfterSecondRevision).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstClaim.id, status: 'cancelled', claimedAt: null }),
        expect.objectContaining({
          status: 'pending',
          sourceBlockNumber: secondBlock.header.number,
        }),
      ]),
    );
    expect(
      await completeMetadataJob(ethereumDb, ethereumRuntime, firstClaim, {
        content: firstContent,
        contentUri: firstClaim.contentUri,
        contentHash: firstClaim.contentHash ?? hashFor(0),
        contentType: 'application/json',
        contentLength: JSON.stringify(firstContent).length,
        fetchedAt: new Date(leaseStartedAt.getTime() + 500),
      }),
    ).toBe('lost_claim');
    expect(
      await ethereumDb
        .select()
        .from(metadataRevisions)
        .where(eq(metadataRevisions.address, metadataAddress)),
    ).toEqual([]);

    if (secondTarget.resolveFork == null) {
      throw new Error('Metadata projection target must support forks');
    }
    await secondTarget.resolveFork([
      {
        number: firstBlock.header.number,
        hash: firstBlock.header.hash,
        timestamp: firstBlock.header.timestamp,
      },
    ]);
    const jobsAfterRollback = await ethereumDb
      .select()
      .from(metadataJobs)
      .where(eq(metadataJobs.address, metadataAddress));
    expect(jobsAfterRollback).toEqual([
      expect.objectContaining({
        id: firstClaim.id,
        status: 'processing',
        attempts: 1,
        claimedAt: leaseStartedAt,
      }),
    ]);
    expect(
      await claimMetadataJobs(ethereumDb, ethereumRuntime, {
        limit: 1,
        leaseTimeoutMs: 2_000,
        now: new Date(leaseStartedAt.getTime() + 1_999),
      }),
    ).toEqual([]);

    const [recoveredClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 1,
      leaseTimeoutMs: 2_000,
      now: new Date(leaseStartedAt.getTime() + 2_000),
    });
    if (recoveredClaim == null) throw new Error('Expected revision A lease recovery');
    expect(recoveredClaim).toMatchObject({ id: firstClaim.id, attempts: 2 });
    expect(
      await completeMetadataJob(ethereumDb, ethereumRuntime, recoveredClaim, {
        content: firstContent,
        contentUri: recoveredClaim.contentUri,
        contentHash: recoveredClaim.contentHash ?? hashFor(0),
        contentType: 'application/json',
        contentLength: JSON.stringify(firstContent).length,
        fetchedAt: new Date(leaseStartedAt.getTime() + 2_001),
      }),
    ).toBe('succeeded');
    expect(
      await ethereumDb
        .select()
        .from(metadataRevisions)
        .where(eq(metadataRevisions.address, metadataAddress)),
    ).toEqual([
      expect.objectContaining({
        id: firstClaim.id,
        content: firstContent,
        lastBlockNumber: firstBlock.header.number,
      }),
    ]);
  });

  it('claims only finalized metadata and prevents stale or duplicate settlements', async () => {
    const metadataAddress = addressFor(220);
    const profileId = createAddressId('profile', ethereumRuntime.network.chainId, metadataAddress);
    const dataValueId = createDataValueId(
      ethereumRuntime.network.chainId,
      metadataAddress,
      DATA_KEYS.lsp3Profile,
    );
    const firstContent = { LSP3Profile: { name: 'First profile revision' } };
    const firstValue = encodeVerifiableUri(firstContent, 'ipfs://first-profile');
    const firstRow = {
      id: dataValueId,
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: metadataAddress,
      tokenId: null,
      dataKey: DATA_KEYS.lsp3Profile,
      dataValue: firstValue,
      lastBlockNumber: 101,
      lastBlockHash: hashFor(201),
      lastTransactionHash: hashFor(211),
      lastTransactionIndex: 0,
      lastLogIndex: 0,
    };
    const firstSource = createDataValueMetadataSource(ethereumRuntime, firstRow);
    if (firstSource == null) throw new Error('Expected first metadata source fixture');
    const createdAt = new Date('2026-01-01T00:00:00Z');

    await ethereumDb.insert(blocks).values(
      [100, 101, 102, 103].map((number) => ({
        id: createBlockId(ethereumRuntime.network.chainId, number),
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        number,
        hash: hashFor(number + 100),
        parentHash: hashFor(number + 99),
        timestamp: new Date(createdAt.getTime() + number * 1_000),
      })),
    );

    await ethereumDb.insert(universalProfiles).values({
      id: profileId,
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: metadataAddress,
      ownerAddress: null,
      verification: 'verified',
      lastBlockNumber: 101,
      lastBlockHash: hashFor(201),
      lastTransactionHash: hashFor(211),
      lastTransactionIndex: 0,
      lastLogIndex: 0,
    });
    await ethereumDb.insert(dataValues).values(firstRow);
    await ethereumDb
      .insert(indexedHeads)
      .values({
        network: ethereumRuntime.network.key,
        chainId: ethereumRuntime.network.chainId,
        blockNumber: 101,
        blockHash: hashFor(201),
        blockTimestamp: createdAt,
        finalizedBlockNumber: 100,
        finalizedBlockHash: hashFor(200),
        updatedAt: createdAt,
      })
      .onConflictDoUpdate({
        target: [indexedHeads.network, indexedHeads.chainId],
        set: {
          blockNumber: 101,
          blockHash: hashFor(201),
          blockTimestamp: createdAt,
          finalizedBlockNumber: 100,
          finalizedBlockHash: hashFor(200),
          updatedAt: createdAt,
        },
      });
    await ethereumDb.transaction((tx) =>
      applyMetadataSourcePlan(
        tx,
        {
          scopes: [firstSource],
          sources: [firstSource],
          rejected: [],
        },
        createdAt,
      ),
    );

    expect(
      await claimMetadataJobs(ethereumDb, ethereumRuntime, {
        limit: 2,
        leaseTimeoutMs: 2_000,
        now: createdAt,
      }),
    ).toEqual([]);

    await ethereumDb
      .update(indexedHeads)
      .set({ finalizedBlockNumber: 101, finalizedBlockHash: hashFor(201) })
      .where(eq(indexedHeads.chainId, ethereumRuntime.network.chainId));
    const [firstClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 2,
      leaseTimeoutMs: 2_000,
      now: createdAt,
    });
    if (firstClaim == null) throw new Error('Expected finalized metadata claim');
    expect(firstClaim).toMatchObject({ status: 'processing', attempts: 1, claimedAt: createdAt });
    expect(await loadClaimedMetadataSource(ethereumDb, ethereumRuntime, firstClaim)).toEqual(
      firstSource,
    );
    expect(
      await claimMetadataJobs(ethereumDb, ethereumRuntime, {
        limit: 2,
        leaseTimeoutMs: 2_000,
        now: new Date(createdAt.getTime() + 1),
      }),
    ).toEqual([]);

    const retryAt = new Date(createdAt.getTime() + 1_000);
    expect(
      await failMetadataJob(ethereumDb, ethereumRuntime, firstClaim, {
        error: 'HTTP 503',
        retryable: true,
        nextAttemptAt: retryAt,
        now: createdAt,
        maxAttempts: 3,
      }),
    ).toBe('retry');
    expect(
      await claimMetadataJobs(ethereumDb, ethereumRuntime, {
        limit: 2,
        leaseTimeoutMs: 2_000,
        now: new Date(retryAt.getTime() - 1),
      }),
    ).toEqual([]);
    const [retryClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 2,
      leaseTimeoutMs: 2_000,
      now: retryAt,
    });
    if (retryClaim == null) throw new Error('Expected due metadata retry');
    expect(retryClaim.attempts).toBe(2);
    expect(
      await completeMetadataJob(ethereumDb, ethereumRuntime, retryClaim, {
        content: firstContent,
        contentUri: retryClaim.contentUri,
        contentHash: firstSource.contentHash ?? hashFor(0),
        contentType: 'application/json',
        contentLength: JSON.stringify(firstContent).length,
        fetchedAt: retryAt,
      }),
    ).toBe('succeeded');
    expect(
      await ethereumDb
        .select()
        .from(metadataRevisions)
        .where(eq(metadataRevisions.address, metadataAddress)),
    ).toEqual([
      expect.objectContaining({
        id: firstSource.id,
        content: firstContent,
        lastBlockNumber: 101,
        lastTransactionHash: firstRow.lastTransactionHash,
      }),
    ]);

    const repeatedAt = new Date(retryAt.getTime() + 1);
    await ethereumDb.transaction((tx) =>
      applyMetadataSourcePlan(
        tx,
        { scopes: [firstSource], sources: [firstSource], rejected: [] },
        repeatedAt,
      ),
    );
    const [repeatedClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 2,
      leaseTimeoutMs: 2_000,
      now: repeatedAt,
    });
    if (repeatedClaim == null) throw new Error('Expected repeated metadata source claim');
    expect(
      await completeMetadataJob(ethereumDb, ethereumRuntime, repeatedClaim, {
        content: { LSP3Profile: { name: 'Mutable endpoint response' } },
        contentUri: repeatedClaim.contentUri,
        contentHash: repeatedClaim.contentHash ?? hashFor(0),
        contentType: 'application/json',
        contentLength: 10,
        fetchedAt: new Date(repeatedAt.getTime() + 1),
      }),
    ).toBe('succeeded');
    expect(
      await ethereumDb
        .select({ content: metadataRevisions.content, fetchedAt: metadataRevisions.fetchedAt })
        .from(metadataRevisions)
        .where(eq(metadataRevisions.id, firstSource.id)),
    ).toEqual([{ content: firstContent, fetchedAt: retryAt }]);

    const secondValue = encodeVerifiableUri(
      { LSP3Profile: { name: 'Second profile revision' } },
      'ipfs://second-profile',
    );
    const secondRow = {
      ...firstRow,
      dataValue: secondValue,
      lastBlockNumber: 102,
      lastBlockHash: hashFor(202),
      lastTransactionHash: hashFor(212),
    };
    const secondSource = createDataValueMetadataSource(ethereumRuntime, secondRow);
    if (secondSource == null) throw new Error('Expected second metadata source fixture');
    await ethereumDb.update(dataValues).set(secondRow).where(eq(dataValues.id, dataValueId));
    await ethereumDb.transaction((tx) =>
      applyMetadataSourcePlan(
        tx,
        { scopes: [secondSource], sources: [secondSource], rejected: [] },
        new Date(retryAt.getTime() + 1),
      ),
    );
    await ethereumDb
      .update(indexedHeads)
      .set({
        blockNumber: 102,
        blockHash: hashFor(202),
        finalizedBlockNumber: 102,
        finalizedBlockHash: hashFor(202),
      })
      .where(eq(indexedHeads.chainId, ethereumRuntime.network.chainId));
    const secondClaimedAt = new Date(retryAt.getTime() + 2);
    const [secondClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 2,
      leaseTimeoutMs: 2_000,
      now: secondClaimedAt,
    });
    if (secondClaim == null) throw new Error('Expected second metadata claim');

    const thirdValue = encodeVerifiableUri(
      { LSP3Profile: { name: 'Third profile revision' } },
      'ipfs://third-profile',
    );
    const thirdRow = {
      ...secondRow,
      dataValue: thirdValue,
      lastBlockNumber: 103,
      lastBlockHash: hashFor(203),
      lastTransactionHash: hashFor(213),
    };
    const thirdSource = createDataValueMetadataSource(ethereumRuntime, thirdRow);
    if (thirdSource == null) throw new Error('Expected third metadata source fixture');
    await ethereumDb.update(dataValues).set(thirdRow).where(eq(dataValues.id, dataValueId));
    expect(
      await completeMetadataJob(ethereumDb, ethereumRuntime, secondClaim, {
        content: { LSP3Profile: { name: 'Stale second revision' } },
        contentUri: secondClaim.contentUri,
        contentHash: secondSource.contentHash ?? hashFor(0),
        contentType: 'application/json',
        contentLength: 10,
        fetchedAt: new Date(secondClaimedAt.getTime() + 1),
      }),
    ).toBe('cancelled');
    expect(
      await ethereumDb
        .select()
        .from(metadataRevisions)
        .where(eq(metadataRevisions.address, metadataAddress)),
    ).toHaveLength(1);

    const thirdCreatedAt = new Date(secondClaimedAt.getTime() + 2);
    await ethereumDb.transaction((tx) =>
      applyMetadataSourcePlan(
        tx,
        { scopes: [thirdSource], sources: [thirdSource], rejected: [] },
        thirdCreatedAt,
      ),
    );
    await ethereumDb
      .update(indexedHeads)
      .set({
        blockNumber: 103,
        blockHash: hashFor(203),
        finalizedBlockNumber: 103,
        finalizedBlockHash: hashFor(203),
      })
      .where(eq(indexedHeads.chainId, ethereumRuntime.network.chainId));
    const [thirdClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 2,
      leaseTimeoutMs: 2_000,
      now: thirdCreatedAt,
    });
    if (thirdClaim == null) throw new Error('Expected third metadata claim');
    expect(
      await claimMetadataJobs(ethereumDb, ethereumRuntime, {
        limit: 2,
        leaseTimeoutMs: 2_000,
        now: new Date(thirdCreatedAt.getTime() + 1_999),
      }),
    ).toEqual([]);
    const [recoveredClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 2,
      leaseTimeoutMs: 2_000,
      now: new Date(thirdCreatedAt.getTime() + 2_000),
    });
    if (recoveredClaim == null) throw new Error('Expected recovered metadata lease');
    expect(recoveredClaim.attempts).toBe(2);
    expect(await cancelClaimedMetadataJob(ethereumDb, thirdClaim)).toBe('lost_claim');
    expect(
      await failMetadataJob(ethereumDb, ethereumRuntime, recoveredClaim, {
        error: 'x'.repeat(3_000),
        retryable: false,
        nextAttemptAt: new Date(thirdCreatedAt.getTime() + 3_000),
        now: new Date(thirdCreatedAt.getTime() + 2_001),
        maxAttempts: 3,
      }),
    ).toBe('failed');

    const thirdJob = (await ethereumDb.select().from(metadataJobs)).find(
      ({ id }) => id === thirdSource.id,
    );
    expect(thirdJob).toMatchObject({ status: 'failed', claimedAt: null, attempts: 2 });
    expect(thirdJob?.lastError).toHaveLength(2_000);
    const counts = await countMetadataJobs(ethereumDb, ethereumRuntime);
    const allJobs = await ethereumDb.select().from(metadataJobs);
    expect(counts.find(({ status }) => status === 'failed')?.count).toBe(
      allJobs.filter(({ status }) => status === 'failed').length,
    );
    expect(counts.find(({ status }) => status === 'succeeded')?.count).toBe(
      allJobs.filter(({ status }) => status === 'succeeded').length,
    );

    const revokedAt = new Date(thirdCreatedAt.getTime() + 4_000);
    await ethereumDb.transaction((tx) =>
      applyMetadataSourcePlan(
        tx,
        { scopes: [thirdSource], sources: [thirdSource], rejected: [] },
        revokedAt,
      ),
    );
    const [revokedClaim] = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 2,
      leaseTimeoutMs: 2_000,
      now: revokedAt,
    });
    if (revokedClaim == null) throw new Error('Expected metadata claim before verification loss');
    await ethereumDb
      .update(universalProfiles)
      .set({ verification: 'invalid' })
      .where(eq(universalProfiles.address, metadataAddress));
    expect(await loadClaimedMetadataSource(ethereumDb, ethereumRuntime, revokedClaim)).toBeNull();
    expect(
      await completeMetadataJob(ethereumDb, ethereumRuntime, revokedClaim, {
        content: { LSP3Profile: { name: 'Must not publish' } },
        contentUri: revokedClaim.contentUri,
        contentHash: revokedClaim.contentHash ?? hashFor(0),
        contentType: 'application/json',
        contentLength: 10,
        fetchedAt: new Date(revokedAt.getTime() + 1),
      }),
    ).toBe('cancelled');

    const collectionAddress = addressFor(219);
    const tokenId = hashFor(219);
    const tokenRow = {
      id: createDataValueId(
        ethereumRuntime.network.chainId,
        collectionAddress,
        DATA_KEYS.lsp4Metadata,
        tokenId,
      ),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: collectionAddress,
      tokenId,
      dataKey: DATA_KEYS.lsp4Metadata,
      dataValue: encodeVerifiableUri(
        { LSP4Metadata: { name: 'Parent-guarded token' } },
        'ipfs://parent-guarded-token',
      ),
      lastBlockNumber: 103,
      lastBlockHash: hashFor(203),
      lastTransactionHash: hashFor(214),
      lastTransactionIndex: 0,
      lastLogIndex: 0,
    };
    const tokenSource = createDataValueMetadataSource(ethereumRuntime, tokenRow);
    if (tokenSource == null) throw new Error('Expected token metadata source fixture');
    await ethereumDb.insert(digitalAssets).values({
      id: createAddressId('digital-asset', ethereumRuntime.network.chainId, collectionAddress),
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: collectionAddress,
      standard: 'lsp8',
      verification: 'verified',
      lastBlockNumber: 103,
      lastBlockHash: hashFor(203),
      lastTransactionHash: hashFor(214),
      lastTransactionIndex: 0,
      lastLogIndex: 0,
    });
    await ethereumDb.insert(nfts).values({
      id: 'parent-guarded-nft',
      network: ethereumRuntime.network.key,
      chainId: ethereumRuntime.network.chainId,
      address: collectionAddress,
      tokenId,
      verification: 'verified',
      lastBlockNumber: 103,
      lastBlockHash: hashFor(203),
      lastTransactionHash: hashFor(214),
      lastTransactionIndex: 0,
      lastLogIndex: 0,
    });
    await ethereumDb.insert(dataValues).values(tokenRow);
    const tokenCreatedAt = new Date(revokedAt.getTime() + 2);
    await ethereumDb.transaction((tx) =>
      applyMetadataSourcePlan(
        tx,
        { scopes: [tokenSource], sources: [tokenSource], rejected: [] },
        tokenCreatedAt,
      ),
    );
    const tokenClaims = await claimMetadataJobs(ethereumDb, ethereumRuntime, {
      limit: 2,
      leaseTimeoutMs: 2_000,
      now: tokenCreatedAt,
    });
    const tokenClaim = tokenClaims.find(({ id }) => id === tokenSource.id);
    if (tokenClaim == null) throw new Error('Expected token metadata claim');
    await ethereumDb
      .update(digitalAssets)
      .set({ verification: 'invalid' })
      .where(eq(digitalAssets.address, collectionAddress));
    expect(await loadClaimedMetadataSource(ethereumDb, ethereumRuntime, tokenClaim)).toBeNull();
    expect(
      await completeMetadataJob(ethereumDb, ethereumRuntime, tokenClaim, {
        content: { LSP4Metadata: { name: 'Must not publish' } },
        contentUri: tokenClaim.contentUri,
        contentHash: tokenClaim.contentHash ?? hashFor(0),
        contentType: 'application/json',
        contentLength: 10,
        fetchedAt: new Date(tokenCreatedAt.getTime() + 1),
      }),
    ).toBe('cancelled');
  });
});
