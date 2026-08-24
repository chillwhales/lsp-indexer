import { and, asc, eq, lte, or } from 'drizzle-orm';
import {
  decodeFunctionResult,
  encodeFunctionData,
  getAddress,
  hexToBytes,
  isHex,
  type Hex,
} from 'viem';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import { chillwhalesNfts } from '../db/schema.js';
import type { EventIngestionBatch } from '../events/decode.js';
import type { NetworkRpcClient } from '../rpc/index.js';
import { createMulticallBatches } from './batching.js';
import { readAtVerifiedBlock, type ProjectionBlockRef } from './block.js';
import { executeDirectContractCalls, type DirectContractCall } from './direct.js';
import { CHILLWHALES_EXTENSION, ZERO_ADDRESS } from './standards.js';

export const CLAIM_STATUS_PAGE_SIZE = 250;
export const CLAIM_STATUS_POLL_INTERVAL_BLOCKS = 720;
export const CLAIM_STATUS_RETRY_INTERVAL_BLOCKS = 30;

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
  nextCheckBlock: number;
}

export interface ClaimStatusCall {
  kind: 'chill' | 'orbs';
  tokenId: Hex;
}

export type ClaimStatusCallResult = { status: 'success'; value: boolean } | { status: 'failure' };

export type ClaimStatusCallExecutor = (
  _block: ProjectionBlockRef,
  _calls: readonly ClaimStatusCall[],
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
  blockNumber: number,
): Promise<ClaimStatusCandidate[]> {
  if (!runtime.network.extensions.includes('chillwhales')) return [];

  const candidates = new Map<string, ClaimStatusCandidate>();
  const mintCandidates = new Map<string, ClaimStatusCandidate>();
  for (const mint of collectMintCandidates(batch)) mintCandidates.set(mint.tokenId, mint);
  for (const mint of [...mintCandidates.values()]
    .sort((left, right) => left.tokenId.localeCompare(right.tokenId))
    .slice(0, CLAIM_STATUS_PAGE_SIZE)) {
    candidates.set(mint.tokenId, mint);
  }

  const remaining = CLAIM_STATUS_PAGE_SIZE - candidates.size;
  const rows =
    remaining <= 0
      ? []
      : await db
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
              lte(chillwhalesNfts.claimCheckAfterBlock, blockNumber),
            ),
          )
          .orderBy(asc(chillwhalesNfts.claimCheckAfterBlock), asc(chillwhalesNfts.tokenId))
          .limit(remaining);

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

function decodeChillClaim(data: Hex): boolean | undefined {
  try {
    const result = decodeFunctionResult({
      abi: CHILL_CLAIM_ABI,
      functionName: 'getClaimedStatusFor',
      data,
    });
    return typeof result === 'boolean' ? result : undefined;
  } catch {
    return undefined;
  }
}

function decodeOrbsClaim(data: Hex): boolean | undefined {
  try {
    const result = decodeFunctionResult({
      abi: ORBS_CLAIM_ABI,
      functionName: 'getChillwhaleClaimStatus',
      data,
    });
    return typeof result === 'boolean' ? result : undefined;
  } catch {
    return undefined;
  }
}

function createDirectClaimCall(call: ClaimStatusCall): DirectContractCall<boolean> {
  return call.kind === 'chill'
    ? {
        address: CHILLWHALES_EXTENSION.chillAddress,
        data: encodeFunctionData({
          abi: CHILL_CLAIM_ABI,
          functionName: 'getClaimedStatusFor',
          args: [call.tokenId],
        }),
        decode: decodeChillClaim,
      }
    : {
        address: CHILLWHALES_EXTENSION.orbsAddress,
        data: encodeFunctionData({
          abi: ORBS_CLAIM_ABI,
          functionName: 'getChillwhaleClaimStatus',
          args: [call.tokenId],
        }),
        decode: decodeOrbsClaim,
      };
}

/** Adapt viem to the small, block-pinned claim-status RPC boundary. */
export function createClaimStatusCallExecutor(
  rpc: NetworkRpcClient,
  runtime: RuntimeConfig,
): ClaimStatusCallExecutor {
  return async function executeClaimStatusCalls(
    block: ProjectionBlockRef,
    calls: readonly ClaimStatusCall[],
  ): Promise<readonly ClaimStatusCallResult[]> {
    if (block.number < runtime.network.multicall.fromBlock) {
      return readAtVerifiedBlock(rpc, block, () =>
        executeDirectContractCalls(
          rpc,
          block.number,
          calls.map(createDirectClaimCall),
          runtime.network.rpc.batchSize,
        ),
      );
    }

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
    const results: readonly unknown[] = await readAtVerifiedBlock(rpc, block, () =>
      rpc.multicall({
        contracts,
        blockNumber: BigInt(block.number),
        multicallAddress: runtime.network.multicall.address,
        allowFailure: true,
      }),
    );
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
  block: ProjectionBlockRef,
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

  const updates = new Map<string, ClaimStatusUpdate>(
    candidates.map((candidate) => [
      candidate.tokenId,
      {
        address: candidate.address,
        tokenId: candidate.tokenId,
        chillClaimed: false,
        orbsClaimed: false,
        blockNumber: block.number,
        blockHash: block.hash,
        nextCheckBlock: block.number + CLAIM_STATUS_POLL_INTERVAL_BLOCKS,
      },
    ]),
  );
  let resultOffset = 0;
  for (const plannedBatch of createMulticallBatches(planned)) {
    const results = await execute(
      block,
      plannedBatch.map(({ call }) => call),
    );
    if (results.length !== plannedBatch.length) {
      throw new Error(
        `Claim-status multicall at block ${block.number} returned ${results.length} results for ${plannedBatch.length} calls`,
      );
    }
    for (let index = 0; index < plannedBatch.length; index++) {
      const current = plannedBatch[index];
      const result = results[index];
      if (current == null || result == null) {
        throw new Error(
          `Claim-status multicall at block ${block.number} omitted result ${resultOffset + index}`,
        );
      }
      const update = updates.get(current.candidate.tokenId);
      if (update == null) throw new Error('Claim-status update plan is inconsistent');
      if (result.status === 'failure') {
        update.nextCheckBlock = block.number + CLAIM_STATUS_RETRY_INTERVAL_BLOCKS;
        continue;
      }
      if (!result.value) continue;
      if (current.call.kind === 'chill') update.chillClaimed = true;
      else update.orbsClaimed = true;
    }
    resultOffset += plannedBatch.length;
  }
  return [...updates.values()].sort((left, right) => left.tokenId.localeCompare(right.tokenId));
}
