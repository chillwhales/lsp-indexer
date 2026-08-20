import { and, eq, or } from 'drizzle-orm';
import { getAddress, hexToBytes, isHex, type Hex } from 'viem';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import { chillwhalesNfts } from '../db/schema.js';
import type { EventIngestionBatch } from '../events/decode.js';
import type { NetworkRpcClient } from '../rpc/index.js';
import { createMulticallBatches } from './batching.js';
import { CHILLWHALES_EXTENSION, ZERO_ADDRESS } from './standards.js';

const CHILL_CLAIM_ABI = [
  {
    type: 'function',
    name: 'getClaimedStatusFor',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const ORBS_CLAIM_ABI = [
  {
    type: 'function',
    name: 'getChillwhaleClaimStatus',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export interface ClaimStatusCandidate {
  address: string;
  tokenId: Hex;
  checkChill: boolean;
  checkOrbs: boolean;
}

export interface ClaimStatusUpdate {
  address: string;
  tokenId: Hex;
  chillClaimed: boolean;
  orbsClaimed: boolean;
  blockNumber: number;
  blockHash: string;
}

export interface ClaimStatusCall {
  kind: 'chill' | 'orbs';
  tokenId: Hex;
}

export type ClaimStatusCallResult = { status: 'success'; value: boolean } | { status: 'failure' };

// Codacy's standalone ESLint profile applies the base rule to type-only parameter names.
// eslint-disable-next-line no-unused-vars
export type ClaimStatusCallExecutor = (
  blockNumber: number,
  calls: readonly ClaimStatusCall[],
) => Promise<readonly ClaimStatusCallResult[]>;

function readString(value: Record<string, unknown> | null, key: string): string | null {
  const field = value?.[key];
  return typeof field === 'string' ? field : null;
}

function readTokenId(value: string | null): Hex | null {
  return value != null && isHex(value) && hexToBytes(value).length === 32 ? value : null;
}

function collectMintCandidates(batch: EventIngestionBatch): ClaimStatusCandidate[] {
  return batch.events.flatMap((event) => {
    if (
      event.eventName !== 'Transfer' ||
      event.eventDomain !== 'lsp8' ||
      event.address !== CHILLWHALES_EXTENSION.collectionAddress ||
      readString(event.decoded, 'from') !== ZERO_ADDRESS
    ) {
      return [];
    }
    const tokenId = readTokenId(readString(event.decoded, 'tokenId'));
    return tokenId == null
      ? []
      : [{ address: event.address, tokenId, checkChill: true, checkOrbs: true }];
  });
}

/** Load unresolved product-extension statuses and include same-batch Chillwhales mints. */
export async function loadClaimStatusCandidates(
  db: NetworkDatabase,
  runtime: RuntimeConfig,
  batch: EventIngestionBatch,
): Promise<ClaimStatusCandidate[]> {
  if (!runtime.network.extensions.includes('chillwhales')) return [];

  const rows = await db
    .select({
      address: chillwhalesNfts.address,
      tokenId: chillwhalesNfts.tokenId,
      chillClaimed: chillwhalesNfts.chillClaimed,
      orbsClaimed: chillwhalesNfts.orbsClaimed,
    })
    .from(chillwhalesNfts)
    .where(
      and(
        eq(chillwhalesNfts.chainId, runtime.network.chainId),
        eq(chillwhalesNfts.address, CHILLWHALES_EXTENSION.collectionAddress),
        or(eq(chillwhalesNfts.chillClaimed, false), eq(chillwhalesNfts.orbsClaimed, false)),
      ),
    );

  const candidates = new Map<string, ClaimStatusCandidate>();
  for (const row of rows) {
    const tokenId = readTokenId(row.tokenId);
    if (tokenId == null) {
      throw new Error(`Persisted Chillwhales token ID is malformed: ${row.tokenId}`);
    }
    candidates.set(row.tokenId, {
      address: row.address,
      tokenId,
      checkChill: !row.chillClaimed,
      checkOrbs: !row.orbsClaimed,
    });
  }
  for (const mint of collectMintCandidates(batch)) {
    const existing = candidates.get(mint.tokenId);
    candidates.set(mint.tokenId, {
      ...mint,
      checkChill: existing?.checkChill ?? true,
      checkOrbs: existing?.checkOrbs ?? true,
    });
  }
  return [...candidates.values()].sort((left, right) => left.tokenId.localeCompare(right.tokenId));
}

function normalizeResult(result: unknown): ClaimStatusCallResult {
  if (typeof result !== 'object' || result == null || !('status' in result)) {
    throw new Error('Claim-status multicall returned an invalid result');
  }
  if (result.status === 'failure') return { status: 'failure' };
  if (result.status !== 'success' || !('result' in result) || typeof result.result !== 'boolean') {
    throw new Error('Claim-status multicall returned an invalid success value');
  }
  return { status: 'success', value: result.result };
}

/** Adapt viem to the small, block-pinned claim-status RPC boundary. */
export function createClaimStatusCallExecutor(
  rpc: NetworkRpcClient,
  runtime: RuntimeConfig,
): ClaimStatusCallExecutor {
  return async function executeClaimStatusCalls(
    blockNumber: number,
    calls: readonly ClaimStatusCall[],
  ): Promise<readonly ClaimStatusCallResult[]> {
    const contracts = calls.map((call) =>
      call.kind === 'chill'
        ? {
            address: getAddress(CHILLWHALES_EXTENSION.chillAddress),
            abi: CHILL_CLAIM_ABI,
            functionName: 'getClaimedStatusFor' as const,
            args: [call.tokenId] as const,
          }
        : {
            address: getAddress(CHILLWHALES_EXTENSION.orbsAddress),
            abi: ORBS_CLAIM_ABI,
            functionName: 'getChillwhaleClaimStatus' as const,
            args: [call.tokenId] as const,
          },
    );
    const results: readonly unknown[] = await rpc.multicall({
      contracts,
      blockNumber: BigInt(blockNumber),
      multicallAddress: runtime.network.multicallAddress,
      allowFailure: true,
    });
    return results.map(normalizeResult);
  };
}

interface PlannedClaimCall {
  candidate: ClaimStatusCandidate;
  call: ClaimStatusCall;
}

/** Resolve monotonic false-to-true claim transitions at one exact chain head. */
export async function resolveClaimStatusUpdates(
  candidates: readonly ClaimStatusCandidate[],
  blockNumber: number,
  blockHash: string,
  execute: ClaimStatusCallExecutor,
): Promise<ClaimStatusUpdate[]> {
  const planned: PlannedClaimCall[] = candidates.flatMap((candidate) => [
    ...(candidate.checkChill
      ? [{ candidate, call: { kind: 'chill' as const, tokenId: candidate.tokenId } }]
      : []),
    ...(candidate.checkOrbs
      ? [{ candidate, call: { kind: 'orbs' as const, tokenId: candidate.tokenId } }]
      : []),
  ]);
  if (planned.length === 0) return [];

  const updates = new Map<string, ClaimStatusUpdate>();
  let resultOffset = 0;
  for (const plannedBatch of createMulticallBatches(planned)) {
    const results = await execute(
      blockNumber,
      plannedBatch.map(({ call }) => call),
    );
    if (results.length !== plannedBatch.length) {
      throw new Error(
        `Claim-status multicall at block ${blockNumber} returned ${results.length} results for ${plannedBatch.length} calls`,
      );
    }
    for (let index = 0; index < plannedBatch.length; index++) {
      const current = plannedBatch[index];
      const result = results[index];
      if (current == null || result == null) {
        throw new Error(
          `Claim-status multicall at block ${blockNumber} omitted result ${resultOffset + index}`,
        );
      }
      if (result.status !== 'success' || !result.value) continue;
      const update = updates.get(current.candidate.tokenId) ?? {
        address: current.candidate.address,
        tokenId: current.candidate.tokenId,
        chillClaimed: false,
        orbsClaimed: false,
        blockNumber,
        blockHash,
      };
      if (current.call.kind === 'chill') update.chillClaimed = true;
      else update.orbsClaimed = true;
      updates.set(current.candidate.tokenId, update);
    }
    resultOffset += plannedBatch.length;
  }
  return [...updates.values()];
}
