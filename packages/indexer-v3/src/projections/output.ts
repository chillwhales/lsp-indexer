import type { Transformer } from '@subsquid/pipes';
import type { RuntimeConfig } from '../config/index.js';
import type { NetworkDatabase } from '../db/client.js';
import { normalizeBytes32 } from '../db/identity.js';
import type { EventIngestionBatch } from '../events/decode.js';
import { createEventIngestionOutput } from '../events/output.js';
import type { EventIngestionData } from '../events/query.js';
import type { NetworkRpcClient } from '../rpc/index.js';
import { collectProjectionCandidates } from './candidates.js';
import {
  createClaimStatusCallExecutor,
  loadClaimStatusCandidates,
  resolveClaimStatusUpdates,
  type ClaimStatusUpdate,
} from './extensions.js';
import {
  createProjectionCallExecutor,
  resolveProjectionVerifications,
  type ProjectionVerification,
} from './rpc.js';

export interface ProjectionBatch {
  facts: EventIngestionBatch;
  verifications: ProjectionVerification[];
  claimStatusUpdates: ClaimStatusUpdate[];
}

/** Extend raw event decoding with all block-pinned reads required by the deterministic reducer. */
export function createProjectionOutput(
  runtime: RuntimeConfig,
  rpc: NetworkRpcClient,
  db: NetworkDatabase,
): Transformer<EventIngestionData, ProjectionBatch> {
  const execute = createProjectionCallExecutor(rpc, runtime);
  const executeClaims = createClaimStatusCallExecutor(rpc, runtime);
  return createEventIngestionOutput(runtime).pipe({
    profiler: { name: 'LSP projection reads' },
    async transform(facts, ctx): Promise<ProjectionBatch> {
      const candidates = collectProjectionCandidates(facts);
      const current = ctx.stream.state.current;
      const latest = ctx.stream.head.latest;
      const atHead = latest != null && current.number >= latest.number;
      if (atHead && current.hash == null) {
        throw new Error('Cannot pin product-extension reads without a current block hash');
      }
      const currentHash =
        current.hash == null ? null : normalizeBytes32(current.hash, 'current block hash');
      const claimStatusUpdates =
        atHead && currentHash != null
          ? loadClaimStatusCandidates(db, runtime, facts, current.number).then((claimCandidates) =>
              resolveClaimStatusUpdates(
                claimCandidates,
                { number: current.number, hash: currentHash },
                executeClaims,
              ),
            )
          : Promise.resolve([]);
      const [resolvedVerifications, resolvedClaimStatusUpdates] = await Promise.all([
        resolveProjectionVerifications(candidates, execute),
        claimStatusUpdates,
      ]);
      return {
        facts,
        verifications: resolvedVerifications,
        claimStatusUpdates: resolvedClaimStatusUpdates,
      };
    },
  });
}
