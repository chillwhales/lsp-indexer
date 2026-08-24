import {
  and,
  asc,
  count,
  eq,
  inArray,
  isNotNull,
  isNull,
  lte,
  max,
  min,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import {
  dataValues,
  digitalAssets,
  indexedHeads,
  metadataJobs,
  metadataRevisions,
  nfts,
  universalProfiles,
} from '../db/schema.js';
import type { PersistenceHandlerContext } from '../db/target.js';
import { DATA_KEYS } from '../projections/standards.js';
import {
  createDataValueMetadataSource,
  createNftMetadataSource,
  matchesMetadataJob,
  type MetadataRecoveryCandidates,
  type MetadataSource,
  type MetadataSourcePlan,
  type MetadataSourceScope,
  type MetadataVerificationTransitions,
} from './source.js';

const ACTIVE_JOB_STATUSES = ['pending', 'retry'] as const;
const ALL_JOB_STATUSES = [
  'pending',
  'processing',
  'retry',
  'succeeded',
  'failed',
  'cancelled',
] as const;
const LAST_ERROR_MAX_LENGTH = 2_000;
const WRITE_CHUNK_SIZE = 500;

type MetadataTransaction = Parameters<Parameters<NetworkDatabase['transaction']>[0]>[0];
type MetadataQueryExecutor = NetworkDatabase | MetadataTransaction;
type ProjectionTransaction = PersistenceHandlerContext['tx'];
type DataValueRow = typeof dataValues.$inferSelect;
type NftRow = typeof nfts.$inferSelect;
export type MetadataJob = typeof metadataJobs.$inferSelect;
export type MetadataJobStatus = MetadataJob['status'];

export interface ClaimMetadataJobsOptions {
  limit: number;
  leaseTimeoutMs: number;
  now?: Date;
}

export interface CompletedMetadataContent {
  content: Record<string, unknown>;
  contentUri: string;
  contentHash: string;
  contentType: string | null;
  contentLength: number;
  fetchedAt: Date;
}

export interface MetadataBacklogCount {
  status: MetadataJobStatus;
  count: number;
  oldestCreatedAt: Date | null;
  maximumAttempts: number;
}

export type MetadataSettlement = 'succeeded' | 'retry' | 'failed' | 'cancelled' | 'lost_claim';

function truncateError(value: string): string {
  return value.length <= LAST_ERROR_MAX_LENGTH
    ? value
    : `${value.slice(0, LAST_ERROR_MAX_LENGTH - 1)}…`;
}

function chunks<T>(values: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += WRITE_CHUNK_SIZE) {
    result.push(values.slice(index, index + WRITE_CHUNK_SIZE));
  }
  return result;
}

function scopeCondition(scope: MetadataSourceScope): SQL {
  const condition = and(
    eq(metadataJobs.chainId, scope.chainId),
    eq(metadataJobs.address, scope.address),
    scope.tokenId == null ? isNull(metadataJobs.tokenId) : eq(metadataJobs.tokenId, scope.tokenId),
    eq(metadataJobs.dataKey, scope.dataKey),
  );
  if (condition == null) throw new Error('Metadata scope must not be empty');
  return condition;
}

/** Reload metadata rows only for targets whose verification became usable in this transaction. */
export async function loadMetadataRecoveryCandidates(
  tx: ProjectionTransaction,
  runtime: RuntimeConfig,
  transitions: MetadataVerificationTransitions,
): Promise<MetadataRecoveryCandidates> {
  const recoveredDataValues = new Map<string, DataValueRow>();
  const recoveredNfts = new Map<string, NftRow>();
  const contractAddresses = [
    ...new Set([...transitions.profileAddresses, ...transitions.assetAddresses]),
  ];

  for (const addressChunk of chunks(contractAddresses)) {
    const rows = await tx
      .select()
      .from(dataValues)
      .where(
        and(
          eq(dataValues.chainId, runtime.network.chainId),
          inArray(dataValues.address, addressChunk),
          isNull(dataValues.tokenId),
        ),
      );
    for (const row of rows) recoveredDataValues.set(row.id, row);
  }

  for (const addressChunk of chunks(transitions.tokenCollectionAddresses)) {
    const [tokenRows, nftRows] = await Promise.all([
      tx
        .select()
        .from(dataValues)
        .where(
          and(
            eq(dataValues.chainId, runtime.network.chainId),
            inArray(dataValues.address, addressChunk),
            isNotNull(dataValues.tokenId),
            eq(dataValues.dataKey, DATA_KEYS.lsp4Metadata),
          ),
        ),
      tx
        .select()
        .from(nfts)
        .where(and(eq(nfts.chainId, runtime.network.chainId), inArray(nfts.address, addressChunk))),
    ]);
    for (const row of tokenRows) recoveredDataValues.set(row.id, row);
    for (const row of nftRows) recoveredNfts.set(row.id, row);
  }

  for (const targetChunk of chunks(transitions.nftTargets)) {
    const dataValueScope = or(
      ...targetChunk.map(({ address, tokenId }) =>
        and(eq(dataValues.address, address), eq(dataValues.tokenId, tokenId)),
      ),
    );
    const nftScope = or(
      ...targetChunk.map(({ address, tokenId }) =>
        and(eq(nfts.address, address), eq(nfts.tokenId, tokenId)),
      ),
    );
    if (dataValueScope == null || nftScope == null) {
      throw new Error('Metadata NFT recovery scope must not be empty');
    }
    const [tokenRows, nftRows] = await Promise.all([
      tx
        .select()
        .from(dataValues)
        .where(
          and(
            eq(dataValues.chainId, runtime.network.chainId),
            eq(dataValues.dataKey, DATA_KEYS.lsp4Metadata),
            dataValueScope,
          ),
        ),
      tx
        .select()
        .from(nfts)
        .where(and(eq(nfts.chainId, runtime.network.chainId), nftScope)),
    ]);
    for (const row of tokenRows) recoveredDataValues.set(row.id, row);
    for (const row of nftRows) recoveredNfts.set(row.id, row);
  }

  return { dataValues: [...recoveredDataValues.values()], nfts: [...recoveredNfts.values()] };
}

/** Replace durable jobs for every metadata source changed by one Pipes transaction. */
export async function applyMetadataSourcePlan(
  tx: ProjectionTransaction,
  plan: MetadataSourcePlan,
  now = new Date(),
): Promise<void> {
  const sources = new Map(
    plan.sources.map((source) => [
      `${source.chainId}:${source.address}:${source.tokenId ?? 'contract'}:${source.dataKey}`,
      source,
    ]),
  );

  const cancellationConditions = plan.scopes.map((scope) => {
    const key = `${scope.chainId}:${scope.address}:${scope.tokenId ?? 'contract'}:${scope.dataKey}`;
    const source = sources.get(key);
    const condition =
      source == null
        ? scopeCondition(scope)
        : and(scopeCondition(scope), ne(metadataJobs.sourceRevision, source.sourceRevision));
    if (condition == null) throw new Error('Metadata cancellation scope must not be empty');
    return condition;
  });
  for (const conditionChunk of chunks(cancellationConditions)) {
    await tx
      .update(metadataJobs)
      .set({
        status: 'cancelled',
        claimedAt: null,
        lastError: 'Superseded by a newer or invalid chain metadata source',
        updatedAt: now,
      })
      .where(or(...conditionChunk));
  }

  const jobRows = plan.sources.map((source): typeof metadataJobs.$inferInsert => ({
    id: source.id,
    network: source.network,
    chainId: source.chainId,
    kind: source.kind,
    status: 'pending',
    address: source.address,
    tokenId: source.tokenId,
    dataKey: source.dataKey,
    sourceRevision: source.sourceRevision,
    contentUri: source.contentUri,
    contentHash: source.contentHash,
    sourceBlockNumber: source.lastBlockNumber,
    sourceBlockHash: source.lastBlockHash,
    attempts: 0,
    nextAttemptAt: now,
    claimedAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  }));
  for (const rowChunk of chunks(jobRows)) {
    await tx
      .insert(metadataJobs)
      .values(rowChunk)
      .onConflictDoUpdate({
        target: metadataJobs.id,
        set: {
          kind: sql`excluded.kind`,
          status: 'pending',
          contentUri: sql`excluded.content_uri`,
          contentHash: sql`excluded.content_hash`,
          sourceBlockNumber: sql`excluded.source_block_number`,
          sourceBlockHash: sql`excluded.source_block_hash`,
          attempts: 0,
          nextAttemptAt: sql`excluded.next_attempt_at`,
          claimedAt: null,
          lastError: null,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }
}

/** Atomically claim finalized jobs without blocking another network worker. */
export async function claimMetadataJobs(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
  options: ClaimMetadataJobsOptions,
): Promise<MetadataJob[]> {
  const now = options.now ?? new Date();
  const staleBefore = new Date(now.getTime() - options.leaseTimeoutMs);
  return db.transaction(async (tx): Promise<MetadataJob[]> => {
    const [head] = await tx
      .select({ finalizedBlockNumber: indexedHeads.finalizedBlockNumber })
      .from(indexedHeads)
      .where(
        and(
          eq(indexedHeads.network, runtime.network.key),
          eq(indexedHeads.chainId, runtime.network.chainId),
        ),
      )
      .limit(1);
    if (head?.finalizedBlockNumber == null) return [];

    const selected = await tx
      .select()
      .from(metadataJobs)
      .where(
        and(
          eq(metadataJobs.network, runtime.network.key),
          eq(metadataJobs.chainId, runtime.network.chainId),
          lte(metadataJobs.sourceBlockNumber, head.finalizedBlockNumber),
          or(
            and(
              inArray(metadataJobs.status, ACTIVE_JOB_STATUSES),
              lte(metadataJobs.nextAttemptAt, now),
            ),
            and(
              eq(metadataJobs.status, 'processing'),
              or(isNull(metadataJobs.claimedAt), lte(metadataJobs.claimedAt, staleBefore)),
            ),
          ),
        ),
      )
      .orderBy(asc(metadataJobs.sourceBlockNumber), asc(metadataJobs.id))
      .limit(options.limit)
      .for('update', { skipLocked: true });
    if (selected.length === 0) return [];

    const claimed = await tx
      .update(metadataJobs)
      .set({
        status: 'processing',
        attempts: sql`${metadataJobs.attempts} + 1`,
        claimedAt: now,
        updatedAt: now,
      })
      .where(
        inArray(
          metadataJobs.id,
          selected.map(({ id }) => id),
        ),
      )
      .returning();
    const order = new Map(selected.map(({ id }, index) => [id, index]));
    return claimed.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
  });
}

async function loadCurrentSource(
  db: MetadataQueryExecutor,
  runtime: RuntimeConfig,
  job: MetadataJob,
  forUpdate: boolean,
): Promise<MetadataSource | null> {
  if (job.kind === 'lsp3_profile' || job.kind === 'lsp29_encrypted_asset') {
    const profileQuery = db
      .select({ verification: universalProfiles.verification })
      .from(universalProfiles)
      .where(
        and(
          eq(universalProfiles.chainId, runtime.network.chainId),
          eq(universalProfiles.address, job.address),
        ),
      )
      .limit(1);
    const profiles = forUpdate ? await profileQuery.for('update') : await profileQuery;
    if (profiles[0]?.verification !== 'verified') return null;
  } else if (job.kind === 'lsp4_asset' || job.kind === 'lsp4_token') {
    const assetQuery = db
      .select({
        verification: digitalAssets.verification,
        standard: digitalAssets.standard,
      })
      .from(digitalAssets)
      .where(
        and(
          eq(digitalAssets.chainId, runtime.network.chainId),
          eq(digitalAssets.address, job.address),
        ),
      )
      .limit(1);
    const assets = forUpdate ? await assetQuery.for('update') : await assetQuery;
    if (assets[0]?.verification !== 'verified') return null;
    if (job.kind === 'lsp4_token' && assets[0].standard !== 'lsp8') return null;
  } else {
    return null;
  }

  if (job.kind === 'lsp4_token') {
    const nftQuery = db
      .select()
      .from(nfts)
      .where(
        and(
          eq(nfts.chainId, runtime.network.chainId),
          eq(nfts.address, job.address),
          job.tokenId == null ? sql`false` : eq(nfts.tokenId, job.tokenId),
        ),
      )
      .limit(1);
    const rows = forUpdate ? await nftQuery.for('update') : await nftQuery;
    const nft = rows[0];
    if (nft?.verification !== 'verified') return null;
    if (job.dataKey === DATA_KEYS.lsp8MetadataBaseUri) {
      try {
        return createNftMetadataSource(runtime, nft);
      } catch {
        return null;
      }
    }
  }

  const query = db
    .select()
    .from(dataValues)
    .where(
      and(
        eq(dataValues.chainId, runtime.network.chainId),
        eq(dataValues.address, job.address),
        job.tokenId == null ? isNull(dataValues.tokenId) : eq(dataValues.tokenId, job.tokenId),
        eq(dataValues.dataKey, job.dataKey),
      ),
    )
    .limit(1);
  const rows = forUpdate ? await query.for('update') : await query;
  const row = rows[0];
  if (row == null) return null;
  try {
    return createDataValueMetadataSource(runtime, row);
  } catch {
    return null;
  }
}

/** Reload a claimed job's exact source before performing an external request. */
export async function loadClaimedMetadataSource(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
  job: MetadataJob,
): Promise<MetadataSource | null> {
  const source = await loadCurrentSource(db, runtime, job, false);
  return matchesMetadataJob(job, source) ? source : null;
}

async function lockClaimedJob(
  tx: MetadataTransaction,
  job: MetadataJob,
): Promise<MetadataJob | null> {
  if (job.claimedAt == null) return null;
  const [current] = await tx
    .select()
    .from(metadataJobs)
    .where(
      and(
        eq(metadataJobs.id, job.id),
        eq(metadataJobs.status, 'processing'),
        eq(metadataJobs.claimedAt, job.claimedAt),
      ),
    )
    .limit(1)
    .for('update');
  return current ?? null;
}

async function cancelLockedJob(
  tx: MetadataTransaction,
  job: MetadataJob,
  now: Date,
): Promise<'cancelled'> {
  await tx
    .update(metadataJobs)
    .set({
      status: 'cancelled',
      claimedAt: null,
      lastError: 'Metadata source changed before the claimed result could be published',
      updatedAt: now,
    })
    .where(eq(metadataJobs.id, job.id));
  return 'cancelled';
}

/** Cancel a claim whose source changed before its request began. */
export async function cancelClaimedMetadataJob(
  db: NetworkDatabase,
  job: MetadataJob,
  now = new Date(),
): Promise<MetadataSettlement> {
  return db.transaction(async (tx): Promise<MetadataSettlement> => {
    const locked = await lockClaimedJob(tx, job);
    return locked == null ? 'lost_claim' : cancelLockedJob(tx, locked, now);
  });
}

/** Publish validated content only while both the claim and exact chain source remain current. */
export async function completeMetadataJob(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
  job: MetadataJob,
  result: CompletedMetadataContent,
): Promise<MetadataSettlement> {
  return db.transaction(
    async (tx): Promise<MetadataSettlement> => {
      const source = await loadCurrentSource(tx, runtime, job, true);
      const locked = await lockClaimedJob(tx, job);
      if (locked == null) return 'lost_claim';
      if (
        source == null ||
        !matchesMetadataJob(locked, source) ||
        !source.contentUris.includes(result.contentUri)
      ) {
        return cancelLockedJob(tx, locked, result.fetchedAt);
      }

      const derivedSource =
        locked.kind === 'lsp4_token' && locked.dataKey === DATA_KEYS.lsp8MetadataBaseUri;
      const values = {
        id: locked.id,
        network: locked.network,
        chainId: locked.chainId,
        kind: locked.kind,
        address: locked.address,
        tokenId: locked.tokenId,
        dataKey: locked.dataKey,
        sourceRevision: locked.sourceRevision,
        contentUri: result.contentUri,
        contentHash: result.contentHash,
        content: result.content,
        contentType: result.contentType,
        contentLength: result.contentLength,
        fetchedAt: result.fetchedAt,
        lastBlockNumber: derivedSource ? locked.sourceBlockNumber : source.lastBlockNumber,
        lastBlockHash: derivedSource ? locked.sourceBlockHash : source.lastBlockHash,
        lastTransactionHash: derivedSource ? null : source.lastTransactionHash,
        lastTransactionIndex: derivedSource ? null : source.lastTransactionIndex,
        lastLogIndex: derivedSource ? null : source.lastLogIndex,
      };
      await tx
        .insert(metadataRevisions)
        .values(values)
        .onConflictDoNothing({ target: metadataRevisions.id });
      await tx
        .update(metadataJobs)
        .set({ status: 'succeeded', claimedAt: null, lastError: null, updatedAt: result.fetchedAt })
        .where(eq(metadataJobs.id, locked.id));
      return 'succeeded';
    },
    { isolationLevel: 'serializable' },
  );
}

/** Record a bounded retry or terminal failure while preserving claim ownership. */
export async function failMetadataJob(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
  job: MetadataJob,
  failure: {
    error: string;
    retryable: boolean;
    nextAttemptAt: Date;
    now: Date;
    maxAttempts: number;
  },
): Promise<MetadataSettlement> {
  return db.transaction(
    async (tx): Promise<MetadataSettlement> => {
      const source = await loadCurrentSource(tx, runtime, job, true);
      const locked = await lockClaimedJob(tx, job);
      if (locked == null) return 'lost_claim';
      if (!matchesMetadataJob(locked, source)) return cancelLockedJob(tx, locked, failure.now);

      const retry = failure.retryable && locked.attempts < failure.maxAttempts;
      await tx
        .update(metadataJobs)
        .set({
          status: retry ? 'retry' : 'failed',
          claimedAt: null,
          nextAttemptAt: retry ? failure.nextAttemptAt : failure.now,
          lastError: truncateError(failure.error),
          updatedAt: failure.now,
        })
        .where(eq(metadataJobs.id, locked.id));
      return retry ? 'retry' : 'failed';
    },
    { isolationLevel: 'serializable' },
  );
}

/** Count every lifecycle state for one network's backlog metrics. */
export async function countMetadataJobs(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
): Promise<MetadataBacklogCount[]> {
  const rows = await db
    .select({
      status: metadataJobs.status,
      value: count(),
      oldestCreatedAt: min(metadataJobs.createdAt),
      maximumAttempts: max(metadataJobs.attempts),
    })
    .from(metadataJobs)
    .where(
      and(
        eq(metadataJobs.network, runtime.network.key),
        eq(metadataJobs.chainId, runtime.network.chainId),
      ),
    )
    .groupBy(metadataJobs.status);
  const values = new Map(rows.map((row) => [row.status, row]));
  return ALL_JOB_STATUSES.map((status) => {
    const row = values.get(status);
    return {
      status,
      count: row?.value ?? 0,
      oldestCreatedAt: row?.oldestCreatedAt ?? null,
      maximumAttempts: row?.maximumAttempts ?? 0,
    };
  });
}
