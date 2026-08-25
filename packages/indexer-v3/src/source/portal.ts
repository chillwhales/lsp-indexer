import { z } from 'zod';
import type { RuntimeConfig } from '../config/index.js';

const PortalMetadataSchema = z.object({
  dataset: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  real_time: z.boolean(),
  start_block: z.number().int().nonnegative(),
});

const PORTAL_METADATA_TIMEOUT_MS = 10_000;

export interface PortalMetadata {
  dataset: string;
  aliases: string[];
  realTime: boolean;
  startBlock: number;
}

export interface PortalReadiness {
  dataset: string;
  realTime: boolean;
  bounded: boolean;
}

/** Fetch and validate the Portal dataset metadata document. */
export async function fetchPortalMetadata(
  portalUrl: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<PortalMetadata> {
  const response = await fetchImplementation(`${portalUrl.replace(/\/+$/, '')}/metadata`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(PORTAL_METADATA_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Portal metadata request failed with HTTP ${response.status}`);
  }

  const parsed = PortalMetadataSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`Portal metadata response is invalid: ${z.prettifyError(parsed.error)}`);
  }

  return {
    dataset: parsed.data.dataset,
    aliases: parsed.data.aliases,
    realTime: parsed.data.real_time,
    startBlock: parsed.data.start_block,
  };
}

/** Assert that a Portal dataset can safely serve the configured run. */
export function assertPortalReadiness(
  runtime: RuntimeConfig,
  metadata: PortalMetadata,
): PortalReadiness {
  if (
    metadata.dataset !== runtime.network.portal.dataset &&
    !metadata.aliases.includes(runtime.network.portal.dataset)
  ) {
    throw new Error(
      `Portal dataset mismatch: expected ${runtime.network.portal.dataset}, received ${metadata.dataset}`,
    );
  }

  if (runtime.range.from < metadata.startBlock) {
    throw new Error(
      `Portal dataset starts at block ${metadata.startBlock}, after configured block ${runtime.range.from}`,
    );
  }

  const bounded = runtime.range.to != null;
  if (
    runtime.sourceMode === 'portal' &&
    !metadata.realTime &&
    !bounded &&
    !runtime.allowHistoricalSource
  ) {
    throw new Error(
      `Portal dataset ${metadata.dataset} is not real-time. Set INDEXER_TO_BLOCK for a bounded backfill or explicitly set INDEXER_ALLOW_HISTORICAL_SOURCE=true.`,
    );
  }

  return {
    dataset: metadata.dataset,
    realTime: metadata.realTime,
    bounded,
  };
}
