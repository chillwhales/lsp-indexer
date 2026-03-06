/**
 * Address verification module for the V2 indexer pipeline.
 *
 * Verifies blockchain addresses via supportsInterface() multicalls with
 * 3-level error fallback (parallel → per-batch → per-address). Uses an
 * LRU cache to avoid redundant on-chain calls across batches.
 *
 * Categories: UniversalProfile (LSP0), DigitalAsset (LSP7/LSP8), NFT (no-op).
 */

import { LSP0ERC725Account, LSP7DigitalAsset } from '@chillwhales/abi';
import { DigitalAsset, UniversalProfile } from '@chillwhales/typeorm';
import { INTERFACE_ID_LSP0 } from '@lukso/lsp0-contracts';
import { INTERFACE_ID_LSP7, INTERFACE_ID_LSP7_PREVIOUS } from '@lukso/lsp7-contracts';
import { INTERFACE_ID_LSP8, INTERFACE_ID_LSP8_PREVIOUS } from '@lukso/lsp8-contracts';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { type Hex, hexToBool, isHex } from 'viem';

import { Aggregate3StaticReturn } from '@chillwhales/abi/lib/abi/Multicall3';
import { aggregate3StaticLatest } from './multicall';
import { Context, EntityCategory, VerificationResult } from './types';

// ---------------------------------------------------------------------------
// Interface version constants
// ---------------------------------------------------------------------------

interface InterfaceVersion {
  interfaceId: string;
  callData: Hex;
}

const UP_VERSIONS: InterfaceVersion[] = [
  {
    interfaceId: INTERFACE_ID_LSP0,
    callData: LSP0ERC725Account.functions.supportsInterface.encode({
      interfaceId: INTERFACE_ID_LSP0,
    }) as Hex,
  },
];

const DA_VERSIONS: InterfaceVersion[] = [
  {
    interfaceId: INTERFACE_ID_LSP7,
    callData: LSP7DigitalAsset.functions.supportsInterface.encode({
      interfaceId: INTERFACE_ID_LSP7,
    }) as Hex,
  },
  {
    interfaceId: INTERFACE_ID_LSP8,
    callData: LSP7DigitalAsset.functions.supportsInterface.encode({
      interfaceId: INTERFACE_ID_LSP8,
    }) as Hex,
  },
  {
    interfaceId: INTERFACE_ID_LSP7_PREVIOUS['v0.14.0'],
    callData: LSP7DigitalAsset.functions.supportsInterface.encode({
      interfaceId: INTERFACE_ID_LSP7_PREVIOUS['v0.14.0'],
    }) as Hex,
  },
  {
    interfaceId: INTERFACE_ID_LSP8_PREVIOUS['v0.14.0'],
    callData: LSP7DigitalAsset.functions.supportsInterface.encode({
      interfaceId: INTERFACE_ID_LSP8_PREVIOUS['v0.14.0'],
    }) as Hex,
  },
  {
    interfaceId: INTERFACE_ID_LSP7_PREVIOUS['v0.12.0'],
    callData: LSP7DigitalAsset.functions.supportsInterface.encode({
      interfaceId: INTERFACE_ID_LSP7_PREVIOUS['v0.12.0'],
    }) as Hex,
  },
  {
    interfaceId: INTERFACE_ID_LSP8_PREVIOUS['v0.12.0'],
    callData: LSP7DigitalAsset.functions.supportsInterface.encode({
      interfaceId: INTERFACE_ID_LSP8_PREVIOUS['v0.12.0'],
    }) as Hex,
  },
];

// ---------------------------------------------------------------------------
// LRU Cache
// ---------------------------------------------------------------------------

/** Result of a single address verification: valid or invalid for a given category. */
type CachedResult = 'valid' | 'invalid';

/**
 * Simple LRU cache using a Map. Map insertion order is used for eviction:
 * accessing or inserting a key moves it to the "newest" position (re-insert).
 *
 * Key format: `${category}:${address}` — e.g. `UniversalProfile:0xabc...`
 */
export class VerificationCache {
  private cache = new Map<string, CachedResult>();
  readonly maxSize: number;

  constructor(maxSize = 50_000) {
    this.maxSize = maxSize;
  }

  private key(category: EntityCategory, address: string): string {
    return `${category}:${address}`;
  }

  get(category: EntityCategory, address: string): CachedResult | undefined {
    const k = this.key(category, address);
    const value = this.cache.get(k);
    if (value === undefined) return undefined;

    // Move to end (most recently used)
    this.cache.delete(k);
    this.cache.set(k, value);
    return value;
  }

  set(category: EntityCategory, address: string, result: CachedResult): void {
    const k = this.key(category, address);
    // If already present, delete first to refresh position
    if (this.cache.has(k)) {
      this.cache.delete(k);
    }
    this.cache.set(k, result);
    this.evict();
  }

  has(category: EntityCategory, address: string): boolean {
    return this.cache.has(this.key(category, address));
  }

  get size(): number {
    return this.cache.size;
  }

  private evict(): void {
    while (this.cache.size > this.maxSize) {
      // Map.keys().next() returns the oldest entry
      const oldest: string | undefined = this.cache.keys().next().value as string | undefined;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public config type
// ---------------------------------------------------------------------------

export interface VerificationConfig {
  /** LRU cache max size. Default: 50_000 */
  cacheMaxSize?: number;
  /** Multicall batch size. Default: 100 */
  batchSize?: number;
}

// ---------------------------------------------------------------------------
// Multicall helpers
// ---------------------------------------------------------------------------

const DEFAULT_BATCH_SIZE = 100;

type MulticallResult = Aggregate3StaticReturn[number];

/**
 * Batch-verify a list of addresses against a single interface version
 * using Multicall3 with 3-level error fallback.
 *
 * Returns a boolean array parallel to `addresses`:
 *   true = supportsInterface returned true
 *   false = call failed or returned false
 */
async function multicallVerify(
  context: Context,
  addresses: string[],
  callData: Hex,
  batchSize: number,
): Promise<boolean[]> {
  if (addresses.length === 0) return [];

  // Build batched multicall promises
  const promises: Promise<Aggregate3StaticReturn>[] = [];
  const batchCount = Math.ceil(addresses.length / batchSize);
  for (let i = 0; i < batchCount; i++) {
    const start = i * batchSize;
    const batch = addresses.slice(start, start + batchSize);
    promises.push(
      aggregate3StaticLatest(
        context,
        batch.map((target) => ({ target, allowFailure: true, callData })),
      ),
    );
  }

  // Execute with 3-level fallback (same as v1)
  const result: MulticallResult[] = [];
  try {
    // Level 1: All batches in parallel
    result.push(...(await Promise.all(promises)).flatMap((arr) => arr));
  } catch {
    // Level 2: Try each batch individually
    for (let i = 0; i < promises.length; i++) {
      try {
        result.push(...(await promises[i]));
      } catch {
        // Level 3: Try one-by-one for the failed batch
        const start = i * batchSize;
        const batch = addresses.slice(start, start + batchSize);
        for (const target of batch) {
          try {
            result.push(
              ...(await aggregate3StaticLatest(context, [
                { target, allowFailure: true, callData },
              ])),
            );
          } catch {
            // Address verification failed entirely — treat as invalid
            result.push({ success: false, returnData: '0x' });
          }
        }
      }
    }
  }

  // Interpret results (same criteria as v1)
  return addresses.map((_, index) => {
    const r = result[index];
    return !!(
      r &&
      r.success &&
      isHex(r.returnData) &&
      r.returnData !== '0x' &&
      hexToBool(r.returnData)
    );
  });
}

// ---------------------------------------------------------------------------
// Internal verification result type (before mapping to public API)
// ---------------------------------------------------------------------------

interface InternalVerificationResult {
  newAddresses: Set<string>;
  validAddresses: Set<string>;
  invalidAddresses: Set<string>;
  newEntities: Map<string, { id: string }>;
}

// ---------------------------------------------------------------------------
// Category-specific verification strategies
// ---------------------------------------------------------------------------

/**
 * Verify addresses for categories that use supportsInterface (UP, DA).
 * Tries multiple interface versions sequentially; once an address passes
 * any version, it's removed from subsequent checks.
 */
async function verifyWithInterface(
  context: Context,
  store: Store,
  addresses: Set<string>,
  category: EntityCategory,
  versions: InterfaceVersion[],
  cache: VerificationCache,
  batchSize: number,
): Promise<InternalVerificationResult> {
  const addressArray = [...addresses];

  // Step 1: Check LRU cache
  const cachedValid = new Set<string>();
  const cachedInvalid = new Set<string>();
  const uncached: string[] = [];

  for (const addr of addressArray) {
    const cached = cache.get(category, addr);
    if (cached === 'valid') {
      cachedValid.add(addr);
    } else if (cached === 'invalid') {
      cachedInvalid.add(addr);
    } else {
      uncached.push(addr);
    }
  }

  if (uncached.length === 0) {
    return {
      newAddresses: new Set(),
      validAddresses: cachedValid,
      invalidAddresses: cachedInvalid,
      newEntities: new Map(),
    };
  }

  // Step 2: Check DB for persisted entities
  const knownEntities =
    category === EntityCategory.UniversalProfile
      ? await store
          .findBy(UniversalProfile, { id: In(uncached) })
          .then((rows) => new Set(rows.map((r) => r.id)))
      : await store
          .findBy(DigitalAsset, { id: In(uncached) })
          .then((rows) => new Set(rows.map((r) => r.id)));

  // Cache DB hits
  for (const addr of knownEntities) {
    cache.set(category, addr, 'valid');
  }

  const needsOnChain = uncached.filter((addr) => !knownEntities.has(addr));
  if (needsOnChain.length === 0) {
    return {
      newAddresses: new Set(),
      validAddresses: new Set([...cachedValid, ...knownEntities]),
      invalidAddresses: cachedInvalid,
      newEntities: new Map(),
    };
  }

  // Step 3: On-chain verification via Multicall3
  const newlyVerified = new Set<string>();
  let unverified = needsOnChain;

  for (const { interfaceId, callData } of versions) {
    if (unverified.length === 0) break;

    // Structured logging: step=VERIFY is added inline since this is a helper
    // module called from the pipeline's VERIFY step
    context.log.info(
      { step: 'VERIFY', interfaceId, unverifiedCount: unverified.length },
      `Verifying supportsInterface for ${category}`,
    );

    const results = await multicallVerify(context, unverified, callData, batchSize);
    const stillUnverified: string[] = [];

    for (let i = 0; i < unverified.length; i++) {
      if (results[i]) {
        newlyVerified.add(unverified[i]);
        cache.set(category, unverified[i], 'valid');
      } else {
        stillUnverified.push(unverified[i]);
      }
    }
    unverified = stillUnverified;
  }

  // Remaining unverified addresses are invalid
  const newlyInvalid = new Set(unverified);
  for (const addr of newlyInvalid) {
    cache.set(category, addr, 'invalid');
  }

  // Build entity instances for newly verified addresses
  const newEntities = new Map<string, { id: string }>();
  if (category === EntityCategory.UniversalProfile) {
    for (const addr of newlyVerified) {
      newEntities.set(addr, new UniversalProfile({ id: addr, address: addr }));
    }
  } else if (category === EntityCategory.DigitalAsset) {
    for (const addr of newlyVerified) {
      newEntities.set(addr, new DigitalAsset({ id: addr, address: addr }));
    }
  }

  return {
    newAddresses: newlyVerified,
    validAddresses: new Set([...cachedValid, ...knownEntities, ...newlyVerified]),
    invalidAddresses: new Set([...cachedInvalid, ...newlyInvalid]),
    newEntities,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates the `verifyAddresses` function that the Pipeline Orchestrator injects.
 *
 * The returned function closes over a `VerificationCache` that persists
 * across batches, eliminating redundant supportsInterface multicalls.
 *
 * Usage:
 * ```ts
 * const verifyAddresses = createVerifyFn({ cacheMaxSize: 50_000 });
 * // Pass to PipelineConfig.verifyAddresses
 * ```
 */
export function createVerifyFn(
  config: VerificationConfig = {},
): (
  category: EntityCategory,
  addresses: Set<string>,
  store: Store,
  context: Context,
) => Promise<VerificationResult> {
  const cache = new VerificationCache(config.cacheMaxSize ?? 50_000);
  const batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE;

  /**
   * Verify addresses for a given EntityCategory.
   * Matches the `VerifyFn` type from `core/pipeline.ts`.
   *
   * For UP and DA: cache → DB → Multicall3 supportsInterface
   * For NFT: NFTs are verified by their parent DA's LSP8 check, not individually.
   *          This function is a no-op for NFTs — NFT verification is handled
   *          by the NFT plugin directly via DB lookup.
   *
   * Newly verified entity instances are returned in `result.newEntities`
   * for the pipeline to persist. No side-effects on the BatchContext.
   */
  return async function verifyAddresses(
    category: EntityCategory,
    addresses: Set<string>,
    store: Store,
    context: Context,
  ): Promise<VerificationResult> {
    if (addresses.size === 0) {
      return { new: new Set(), valid: new Set(), invalid: new Set(), newEntities: new Map() };
    }

    // NFTs don't use supportsInterface — their parent DA handles verification.
    // The NFT plugin handles DB-based verification internally.
    if (category === EntityCategory.NFT) {
      return {
        new: new Set(),
        valid: new Set(addresses),
        invalid: new Set(),
        newEntities: new Map(),
      };
    }

    const versions = category === EntityCategory.UniversalProfile ? UP_VERSIONS : DA_VERSIONS;

    const { newAddresses, validAddresses, invalidAddresses, newEntities } =
      await verifyWithInterface(context, store, addresses, category, versions, cache, batchSize);

    return {
      new: newAddresses,
      valid: validAddresses,
      invalid: invalidAddresses,
      newEntities,
    };
  };
}

/**
 * Expose the cache class for testing purposes.
 */
export { VerificationCache as _VerificationCacheForTesting };
