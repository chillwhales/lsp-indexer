import { getAddress, type Hex } from 'viem';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkRpcClient } from '../rpc/index.js';
import type { VerificationCandidate, VerificationCategory } from './candidates.js';
import { INTERFACE_IDS } from './standards.js';

const SUPPORTS_INTERFACE_ABI = [
  {
    type: 'function',
    name: 'supportsInterface',
    stateMutability: 'view',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const DECIMALS_ABI = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

export type AssetStandard = 'lsp7' | 'lsp8';

export type ProjectionContractCall =
  | { address: string; functionName: 'supportsInterface'; interfaceId: Hex }
  | { address: string; functionName: 'decimals' };

export type ProjectionContractCallResult =
  | { status: 'success'; value: unknown }
  | { status: 'failure' };

// Codacy's standalone ESLint profile applies the base rule to type-only parameter names.
// eslint-disable-next-line no-unused-vars
export type ProjectionCallExecutor = (
  blockNumber: number,
  calls: readonly ProjectionContractCall[],
) => Promise<readonly ProjectionContractCallResult[]>;

export interface ProjectionVerification {
  blockNumber: number;
  address: string;
  category: VerificationCategory;
  status: 'verified' | 'invalid';
  standard: AssetStandard | null;
  decimals: number | null;
}

interface PlannedCall {
  candidate: VerificationCandidate;
  call: ProjectionContractCall;
  standard: AssetStandard | null;
}

interface CandidateAccumulator {
  candidate: VerificationCandidate;
  lsp7: boolean;
  lsp8: boolean;
  lsp0: boolean;
  decimals: number | null;
}

/** Stable lookup key for a block-pinned verification result. */
export function verificationKey(
  blockNumber: number,
  category: VerificationCategory,
  address: string,
): string {
  return `${blockNumber}:${category}:${address}`;
}

function planCandidate(candidate: VerificationCandidate): PlannedCall[] {
  if (candidate.category === 'universalProfile') {
    return [
      {
        candidate,
        standard: null,
        call: {
          address: candidate.address,
          functionName: 'supportsInterface',
          interfaceId: INTERFACE_IDS.lsp0,
        },
      },
    ];
  }

  return [
    ...INTERFACE_IDS.lsp7.map(
      (interfaceId): PlannedCall => ({
        candidate,
        standard: 'lsp7',
        call: { address: candidate.address, functionName: 'supportsInterface', interfaceId },
      }),
    ),
    ...INTERFACE_IDS.lsp8.map(
      (interfaceId): PlannedCall => ({
        candidate,
        standard: 'lsp8',
        call: { address: candidate.address, functionName: 'supportsInterface', interfaceId },
      }),
    ),
    {
      candidate,
      standard: null,
      call: { address: candidate.address, functionName: 'decimals' },
    },
  ];
}

function normalizeViemResult(result: unknown): ProjectionContractCallResult {
  if (typeof result !== 'object' || result == null || !('status' in result)) {
    throw new Error('RPC multicall returned an invalid result');
  }
  if (result.status === 'failure') return { status: 'failure' };
  if (result.status !== 'success' || !('result' in result)) {
    throw new Error('RPC multicall returned an unknown result status');
  }
  return { status: 'success', value: result.result };
}

/** Adapt the configured viem client to the projection reader's small testable boundary. */
export function createProjectionCallExecutor(
  rpc: NetworkRpcClient,
  runtime: RuntimeConfig,
): ProjectionCallExecutor {
  return async function executeProjectionCalls(
    blockNumber: number,
    calls: readonly ProjectionContractCall[],
  ): Promise<readonly ProjectionContractCallResult[]> {
    const contracts = calls.map((call) =>
      call.functionName === 'supportsInterface'
        ? {
            address: getAddress(call.address),
            abi: SUPPORTS_INTERFACE_ABI,
            functionName: 'supportsInterface' as const,
            args: [call.interfaceId] as const,
          }
        : {
            address: getAddress(call.address),
            abi: DECIMALS_ABI,
            functionName: 'decimals' as const,
          },
    );
    const results: readonly unknown[] = await rpc.multicall({
      contracts,
      blockNumber: BigInt(blockNumber),
      multicallAddress: runtime.network.multicallAddress,
      allowFailure: true,
    });
    return results.map(normalizeViemResult);
  };
}

function createAccumulator(candidate: VerificationCandidate): CandidateAccumulator {
  return { candidate, lsp7: false, lsp8: false, lsp0: false, decimals: null };
}

function decodeDecimals(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255) {
    return value;
  }
  if (typeof value === 'bigint' && value >= 0n && value <= 255n) return Number(value);
  return null;
}

function accumulateResult(
  accumulator: CandidateAccumulator,
  planned: PlannedCall,
  result: ProjectionContractCallResult,
): void {
  if (result.status !== 'success') return;
  if (planned.call.functionName === 'decimals') {
    accumulator.decimals = decodeDecimals(result.value);
  } else if (result.value === true) {
    if (planned.candidate.category === 'universalProfile') accumulator.lsp0 = true;
    else if (planned.standard === 'lsp7') accumulator.lsp7 = true;
    else if (planned.standard === 'lsp8') accumulator.lsp8 = true;
  }
}

function finalizeAccumulator(accumulator: CandidateAccumulator): ProjectionVerification {
  const { candidate } = accumulator;
  const verified =
    candidate.category === 'universalProfile'
      ? accumulator.lsp0
      : accumulator.lsp7 || accumulator.lsp8;
  const standard = accumulator.lsp7 ? 'lsp7' : accumulator.lsp8 ? 'lsp8' : null;
  return {
    ...candidate,
    status: verified ? 'verified' : 'invalid',
    standard,
    decimals: verified && standard === 'lsp7' ? accumulator.decimals : null,
  };
}

/** Execute one deterministic multicall per triggering block and classify every candidate. */
export async function resolveProjectionVerifications(
  candidates: readonly VerificationCandidate[],
  execute: ProjectionCallExecutor,
): Promise<ProjectionVerification[]> {
  const candidatesByBlock = new Map<number, VerificationCandidate[]>();
  for (const candidate of candidates) {
    const blockCandidates = candidatesByBlock.get(candidate.blockNumber) ?? [];
    blockCandidates.push(candidate);
    candidatesByBlock.set(candidate.blockNumber, blockCandidates);
  }

  const verifications: ProjectionVerification[] = [];
  for (const [blockNumber, blockCandidates] of [...candidatesByBlock.entries()].sort(
    ([left], [right]) => left - right,
  )) {
    const planned = blockCandidates.flatMap(planCandidate);
    const results = await execute(
      blockNumber,
      planned.map(({ call }) => call),
    );
    if (results.length !== planned.length) {
      throw new Error(
        `RPC multicall at block ${blockNumber} returned ${results.length} results for ${planned.length} calls`,
      );
    }

    const accumulators = new Map<string, CandidateAccumulator>();
    for (let index = 0; index < planned.length; index++) {
      const current = planned[index];
      const result = results[index];
      if (current == null || result == null) {
        throw new Error(`RPC multicall at block ${blockNumber} omitted result ${index}`);
      }
      const key = verificationKey(
        current.candidate.blockNumber,
        current.candidate.category,
        current.candidate.address,
      );
      const accumulator = accumulators.get(key) ?? createAccumulator(current.candidate);
      accumulateResult(accumulator, current, result);
      accumulators.set(key, accumulator);
    }
    verifications.push(...[...accumulators.values()].map(finalizeAccumulator));
  }
  return verifications;
}
