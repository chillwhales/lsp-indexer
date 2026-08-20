import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import type { NetworkDatabaseConfig } from '../db/config.js';
import {
  chillwhalesNfts,
  controllers,
  creators,
  dataValues,
  digitalAssets,
  followerEdges,
  issuedAssets,
  nfts,
  ownedAssets,
  ownedTokens,
  sqdCursor,
  universalProfiles,
} from '../db/schema.js';
import { createPersistenceTarget, type PersistenceHandlerContext } from '../db/target.js';
import { persistEventBatch } from '../events/persistence.js';
import { applyMetadataSourcePlan } from '../metadata/queue.js';
import { planMetadataSources } from '../metadata/source.js';
import type { ProjectionBatch } from './output.js';
import { reduceProjectionEvents, type ProjectionMutations } from './reducer.js';
import { loadProjectionState } from './state.js';

const WRITE_CHUNK_SIZE = 500;
type ProjectionTransaction = PersistenceHandlerContext['tx'];

export interface ProjectionPersistenceTargetOptions {
  runtime: RuntimeConfig;
  databaseConfig: NetworkDatabaseConfig;
  db: NetworkDatabase;
}

function chunks<T>(values: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += WRITE_CHUNK_SIZE) {
    result.push(values.slice(index, index + WRITE_CHUNK_SIZE));
  }
  return result;
}

/** Reject fresh or reset projection runs that would silently skip canonical history. */
export async function assertProjectionReplayStart(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
): Promise<void> {
  if (runtime.range.from === runtime.network.startBlock) return;

  const cursor = (
    await db
      .select({ currentNumber: sqdCursor.currentNumber })
      .from(sqdCursor)
      .where(eq(sqdCursor.id, runtime.streamId))
      .orderBy(desc(sqdCursor.currentNumber))
      .limit(1)
  )[0];
  if (cursor == null) {
    throw new Error(
      `Projection replay for ${runtime.network.key} has no cursor and must start at block ${runtime.network.startBlock}; received ${runtime.range.from}`,
    );
  }

  const currentNumber = Number(cursor.currentNumber);
  if (!Number.isSafeInteger(currentNumber) || currentNumber < runtime.network.startBlock) {
    throw new Error(`Projection cursor for ${runtime.network.key} has an invalid block number`);
  }
  if (runtime.range.from > currentNumber + 1) {
    throw new Error(
      `Projection replay for ${runtime.network.key} would skip blocks ${currentNumber + 1}-${runtime.range.from - 1}`,
    );
  }
}

async function deleteIds(
  tx: ProjectionTransaction,
  table:
    | typeof ownedTokens
    | typeof ownedAssets
    | typeof creators
    | typeof issuedAssets
    | typeof controllers,
  ids: readonly string[],
): Promise<void> {
  for (const chunk of chunks(ids)) await tx.delete(table).where(inArray(table.id, chunk));
}

async function deleteNftCollections(
  tx: ProjectionTransaction,
  collections: ProjectionMutations['deletedNftCollections'],
): Promise<void> {
  const addressesByChain = new Map<number, Set<string>>();
  for (const collection of collections) {
    const addresses = addressesByChain.get(collection.chainId) ?? new Set<string>();
    addresses.add(collection.address);
    addressesByChain.set(collection.chainId, addresses);
  }
  for (const [chainId, addresses] of addressesByChain) {
    for (const chunk of chunks([...addresses])) {
      await tx.delete(nfts).where(and(eq(nfts.chainId, chainId), inArray(nfts.address, chunk)));
    }
  }
}

async function applyDeletes(
  tx: ProjectionTransaction,
  mutations: ProjectionMutations,
): Promise<void> {
  await deleteIds(tx, ownedTokens, mutations.deletedOwnedTokenIds);
  await deleteNftCollections(tx, mutations.deletedNftCollections);
  await deleteIds(tx, ownedAssets, mutations.deletedOwnedAssetIds);
  await deleteIds(tx, creators, [
    ...new Set([...mutations.deletedCreatorIds, ...mutations.creators.map(({ id }) => id)]),
  ]);
  await deleteIds(tx, issuedAssets, [
    ...new Set([...mutations.deletedIssuedAssetIds, ...mutations.issuedAssets.map(({ id }) => id)]),
  ]);
  await deleteIds(tx, controllers, [
    ...new Set([...mutations.deletedControllerIds, ...mutations.controllers.map(({ id }) => id)]),
  ]);
}

async function upsertUniversalProfiles(
  tx: ProjectionTransaction,
  records: ProjectionMutations['universalProfiles'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(universalProfiles)
      .values(chunk)
      .onConflictDoUpdate({
        target: universalProfiles.id,
        set: {
          ownerAddress: sql`excluded.owner_address`,
          verification: sql`excluded.verification`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertDigitalAssets(
  tx: ProjectionTransaction,
  records: ProjectionMutations['digitalAssets'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(digitalAssets)
      .values(chunk)
      .onConflictDoUpdate({
        target: digitalAssets.id,
        set: {
          ownerAddress: sql`excluded.owner_address`,
          standard: sql`excluded.standard`,
          tokenType: sql`excluded.token_type`,
          name: sql`excluded.name`,
          symbol: sql`excluded.symbol`,
          decimals: sql`excluded.decimals`,
          totalSupply: sql`excluded.total_supply`,
          tokenIdFormat: sql`excluded.token_id_format`,
          tokenIdReferenceContract: sql`excluded.token_id_reference_contract`,
          baseUri: sql`excluded.base_uri`,
          verification: sql`excluded.verification`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertNfts(
  tx: ProjectionTransaction,
  records: ProjectionMutations['nfts'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(nfts)
      .values(chunk)
      .onConflictDoUpdate({
        target: nfts.id,
        set: {
          formattedTokenId: sql`excluded.formatted_token_id`,
          isMinted: sql`excluded.is_minted`,
          isBurned: sql`excluded.is_burned`,
          ownerAddress: sql`excluded.owner_address`,
          tokenUri: sql`excluded.token_uri`,
          verification: sql`excluded.verification`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertOwnedAssets(
  tx: ProjectionTransaction,
  records: ProjectionMutations['ownedAssets'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(ownedAssets)
      .values(chunk)
      .onConflictDoUpdate({
        target: ownedAssets.id,
        set: {
          balance: sql`excluded.balance`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertOwnedTokens(
  tx: ProjectionTransaction,
  records: ProjectionMutations['ownedTokens'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(ownedTokens)
      .values(chunk)
      .onConflictDoUpdate({
        target: ownedTokens.id,
        set: {
          balance: sql`excluded.balance`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertFollowerEdges(
  tx: ProjectionTransaction,
  records: ProjectionMutations['followerEdges'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(followerEdges)
      .values(chunk)
      .onConflictDoUpdate({
        target: followerEdges.id,
        set: {
          isFollowing: sql`excluded.is_following`,
          followedAt: sql`excluded.followed_at`,
          unfollowedAt: sql`excluded.unfollowed_at`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertCreators(
  tx: ProjectionTransaction,
  records: ProjectionMutations['creators'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(creators)
      .values(chunk)
      .onConflictDoUpdate({
        target: creators.id,
        set: {
          arrayIndex: sql`excluded.array_index`,
          interfaceId: sql`excluded.interface_id`,
          verified: sql`excluded.verified`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertIssuedAssets(
  tx: ProjectionTransaction,
  records: ProjectionMutations['issuedAssets'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(issuedAssets)
      .values(chunk)
      .onConflictDoUpdate({
        target: issuedAssets.id,
        set: {
          arrayIndex: sql`excluded.array_index`,
          interfaceId: sql`excluded.interface_id`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertControllers(
  tx: ProjectionTransaction,
  records: ProjectionMutations['controllers'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(controllers)
      .values(chunk)
      .onConflictDoUpdate({
        target: controllers.id,
        set: {
          arrayIndex: sql`excluded.array_index`,
          permissions: sql`excluded.permissions`,
          allowedCalls: sql`excluded.allowed_calls`,
          allowedDataKeys: sql`excluded.allowed_data_keys`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertChillwhalesNfts(
  tx: ProjectionTransaction,
  records: ProjectionMutations['chillwhalesNfts'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(chillwhalesNfts)
      .values(chunk)
      .onConflictDoUpdate({
        target: chillwhalesNfts.id,
        set: {
          chillClaimed: sql`excluded.chill_claimed`,
          orbsClaimed: sql`excluded.orbs_claimed`,
          claimCheckAfterBlock: sql`excluded.claim_check_after_block`,
          level: sql`excluded.level`,
          cooldownExpiry: sql`excluded.cooldown_expiry`,
          faction: sql`excluded.faction`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function upsertDataValues(
  tx: ProjectionTransaction,
  records: ProjectionMutations['dataValues'],
): Promise<void> {
  for (const chunk of chunks(records)) {
    await tx
      .insert(dataValues)
      .values(chunk)
      .onConflictDoUpdate({
        target: dataValues.id,
        set: {
          dataValue: sql`excluded.data_value`,
          lastBlockNumber: sql`excluded.last_block_number`,
          lastBlockHash: sql`excluded.last_block_hash`,
          lastTransactionHash: sql`excluded.last_transaction_hash`,
          lastTransactionIndex: sql`excluded.last_transaction_index`,
          lastLogIndex: sql`excluded.last_log_index`,
        },
      });
  }
}

async function applyUpserts(
  tx: ProjectionTransaction,
  mutations: ProjectionMutations,
): Promise<void> {
  await upsertUniversalProfiles(tx, mutations.universalProfiles);
  await upsertDigitalAssets(tx, mutations.digitalAssets);
  await upsertNfts(tx, mutations.nfts);
  await upsertOwnedAssets(tx, mutations.ownedAssets);
  await upsertOwnedTokens(tx, mutations.ownedTokens);
  await upsertFollowerEdges(tx, mutations.followerEdges);
  await upsertCreators(tx, mutations.creators);
  await upsertIssuedAssets(tx, mutations.issuedAssets);
  await upsertControllers(tx, mutations.controllers);
  await upsertChillwhalesNfts(tx, mutations.chillwhalesNfts);
  await upsertDataValues(tx, mutations.dataValues);
}

/** Apply one already-reduced mutation set inside an existing Pipes transaction. */
export async function applyProjectionMutations(
  tx: ProjectionTransaction,
  mutations: ProjectionMutations,
): Promise<void> {
  await applyDeletes(tx, mutations);
  await applyUpserts(tx, mutations);
}

/** Persist new facts and all resulting projections atomically, skipping reductions on exact replay. */
export async function persistProjectionBatch(
  context: Pick<PersistenceHandlerContext, 'tx'>,
  batch: ProjectionBatch,
  runtime: RuntimeConfig,
): Promise<void> {
  const { insertedEventIds } = await persistEventBatch(context, batch.facts);
  const events = batch.facts.events.filter(({ id }) => insertedEventIds.has(id));
  if (events.length === 0 && batch.claimStatusUpdates.length === 0) return;
  const state = await loadProjectionState(
    context.tx,
    runtime.network.chainId,
    events,
    batch.claimStatusUpdates,
  );
  const mutations = reduceProjectionEvents(
    runtime,
    state,
    events,
    batch.verifications,
    batch.claimStatusUpdates,
  );
  await applyProjectionMutations(context.tx, mutations);
  await applyMetadataSourcePlan(context.tx, planMetadataSources(runtime, state, mutations, events));
}

/** Create the rollback-aware target for raw facts and v3 current-state projections. */
export function createProjectionPersistenceTarget(
  options: ProjectionPersistenceTargetOptions,
): ReturnType<typeof createPersistenceTarget<ProjectionBatch>> {
  return createPersistenceTarget<ProjectionBatch>({
    runtime: options.runtime,
    databaseConfig: options.databaseConfig,
    db: options.db,
    onStart: () => assertProjectionReplayStart(options.db, options.runtime),
    onData: (context, batch) => persistProjectionBatch(context, batch, options.runtime),
  });
}
