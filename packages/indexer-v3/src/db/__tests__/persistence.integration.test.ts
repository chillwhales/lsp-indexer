import { evmPortalStream, evmQuery } from '@subsquid/pipes/evm';
import { mockBlock, mockEvmPortalStream, type PortalBlock } from '@subsquid/pipes/testing/evm';
import { eq } from 'drizzle-orm';
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
} from '../config.js';
import {
  createAddressId,
  createBlockId,
  createEventId,
  createMetadataRevisionId,
} from '../identity.js';
import { migrateDatabase } from '../migrate.js';
import { DATABASE_SCHEMA_VERSION, quotePostgresIdentifier, SHARED_SCHEMA } from '../names.js';
import { verifyDatabaseReadiness } from '../readiness.js';
import {
  blocks,
  eventFacts,
  indexedHeads,
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
  timestamp: 1_700_000_000,
  hash: hashFor(0),
  parentHash: hashFor(255),
});
const block1 = mockBlock({
  number: 1,
  timestamp: 1_700_000_001,
  hash: hashFor(1),
  parentHash: block0.header.hash,
});
const block2 = mockBlock({
  number: 2,
  timestamp: 1_700_000_002,
  hash: hashFor(2),
  parentHash: block1.header.hash,
});
const block3 = mockBlock({
  number: 3,
  timestamp: 1_700_000_003,
  hash: hashFor(3),
  parentHash: block2.header.hash,
});

let controlPool: Pool;
let testAdminPool: Pool;
let migrationConfig: DatabaseMigrationConfig;
let ethereumRuntime: RuntimeConfig;
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

function runtimeDatabaseUrl(network: keyof typeof runtimeLogins): string {
  return databaseUrl(sourceDatabaseUrl, testDatabaseName, runtimeLogins[network], runtimePassword);
}

function createRuntimeDatabase(network: keyof typeof runtimeLogins): {
  runtime: RuntimeConfig;
  pool: Pool;
  db: NetworkDatabase;
} {
  const runtime = loadRuntimeConfig({ INDEXER_NETWORK: network });
  const config = loadNetworkDatabaseConfig(runtime, {
    DATABASE_URL: runtimeDatabaseUrl(network),
    DATABASE_POOL_MAX: '2',
  });
  const pool = createNetworkPool(config);
  return { runtime, pool, db: createNetworkDatabase(pool) };
}

function createTestTarget(failAtBlock?: number): TestTarget {
  return createPersistenceTarget<TestBlock[]>({
    runtime: ethereumRuntime,
    db: ethereumDb,
    unfinalizedBlocksRetention: 100,
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
            timestamp: new Date(timestamp * 1_000),
          })
          .onConflictDoNothing();
        await tx
          .insert(eventFacts)
          .values({
            id: createEventId(ethereumRuntime.network.chainId, number, 0, 0),
            network: ethereumRuntime.network.key,
            chainId: ethereumRuntime.network.chainId,
            blockNumber: number,
            blockHash: hash,
            parentHash,
            blockTimestamp: new Date(timestamp * 1_000),
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

async function runBlocks(currentTarget: TestTarget, selectedBlocks: PortalBlock[]): Promise<void> {
  const first = selectedBlocks.at(0);
  const last = selectedBlocks.at(-1);
  if (first == null || last == null) throw new Error('At least one test block is required');
  const portal = await mockEvmPortalStream({
    blocks: selectedBlocks,
    finalized: { number: block0.header.number, hash: block0.header.hash },
  });
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
      ).toBe(2);
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
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'lsp-v3-migrations-'));
    const migrationsDirectory = join(temporaryDirectory, 'drizzle');
    try {
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
        tag: '0002_test_schema_change',
        breakpoints: true,
      });
      await writeFile(journalPath, `${JSON.stringify(journal, null, 2)}\n`);
      await writeFile(
        join(migrationsDirectory, '0002_test_schema_change.sql'),
        'ALTER TABLE universal_profiles ADD COLUMN forbidden_schema_change text;\n',
      );

      const ethereumMigration = {
        connectionString: migrationConfig.connectionString,
        networks: migrationConfig.networks.filter(
          ({ network }) => network.key === 'ethereum-mainnet',
        ),
      };
      await expect(migrateDatabase(ethereumMigration, { migrationsDirectory })).rejects.toThrow(
        'rollback snapshots contain data',
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
    await runBlocks(target, [block1, block2]);
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
        number: block0.header.number,
        hash: block0.header.hash,
        timestamp: block0.header.timestamp,
      },
    ]);
    expect(cursor).toMatchObject({ number: 0, hash: block0.header.hash });

    expect(await countRows(ethereumPool, 'blocks')).toBe(0);
    expect(await countRows(ethereumPool, 'event_facts')).toBe(0);
    expect(await countRows(ethereumPool, 'metadata_jobs')).toBe(0);
    expect(await countRows(ethereumPool, 'sqd_cursor')).toBe(0);
    expect(await countRows(ethereumPool, 'indexed_heads')).toBe(0);
    const targetProfile = await ethereumDb
      .select()
      .from(universalProfiles)
      .where(eq(universalProfiles.address, testAddress));
    expect(targetProfile).toHaveLength(0);

    const sepoliaCollision = await sepoliaDb
      .select()
      .from(universalProfiles)
      .where(eq(universalProfiles.address, collisionAddress));
    expect(sepoliaCollision).toHaveLength(1);
  });
});
