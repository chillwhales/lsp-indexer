/**
 * Post-pipeline FK resolution for non-core entity relationships.
 *
 * The enrichment queue (Step 6) resolves FK references to core entities
 * (UniversalProfile, DigitalAsset, NFT) because those are the only
 * categories it supports. However, some core entities have "reverse" FKs
 * pointing to metadata entities (e.g., UniversalProfile.lsp3Profile,
 * DigitalAsset.lsp4Metadata) that the enrichment queue cannot handle.
 *
 * This module runs as Step 7 (RESOLVE) after enrichment. It uses a
 * declarative rule registry to find entities with null FK fields where
 * the target entity exists, then populates the FK.
 *
 * Bidirectional resolution per rule:
 *   - Forward pass: Source entities in the current batch -> check if
 *     target entity exists (batch context first, then DB)
 *   - Reverse pass: Target entities in the current batch -> find source
 *     entities in DB with null FK and update them
 */

import { Store } from '@subsquid/typeorm-store';
import { In, IsNull } from 'typeorm';

import { BatchContext } from './batchContext';
import { ENTITY_CONSTRUCTORS, type EntityRegistry, type RegisteredEntity } from './entityRegistry';
import { createStepLogger } from './logger';
import { EntityCategory } from './types';

import type { Logger } from '@subsquid/logger';

// ---------------------------------------------------------------------------
// FK Resolution rule definition
// ---------------------------------------------------------------------------

/**
 * Defines how a single FK field on a source entity maps to a target entity.
 *
 * Each rule describes:
 * - Which source entity type has a null FK field to populate
 * - Which target entity class to look up
 * - How to derive the target entity ID from the source entity
 * - How to derive the source entity ID from the target entity (for reverse pass)
 */
interface FKResolutionRule {
  /** Human-readable name for logging */
  readonly name: string;

  /** BatchContext entity type key for source entities (e.g., 'UniversalProfile') */
  readonly sourceType: keyof EntityRegistry;

  /** FK field name on the source entity to populate */
  readonly fkField: string;

  /** BatchContext entity type key for target entities */
  readonly targetType: keyof EntityRegistry;

  /** Given a source entity ID, derive the target entity ID */
  readonly resolveTargetId: (sourceId: string) => string;

  /**
   * Given a target entity ID, derive the source entity ID.
   * Returns null if the target ID doesn't match the expected pattern
   * (e.g., non-BaseURI metadata should not match the BaseUri rule).
   */
  readonly resolveSourceId: (targetId: string) => string | null;
}

// ---------------------------------------------------------------------------
// Rule registry
// ---------------------------------------------------------------------------

/**
 * All FK resolution rules.
 *
 * Each rule defines a bidirectional mapping between a source entity's FK field
 * and the target entity that should populate it. The ID derivation functions
 * encode the deterministic relationship between source and target IDs.
 *
 * ID relationships:
 * - UniversalProfile.id === LSP3Profile.id  (both are the contract address)
 * - DigitalAsset.id === LSP4Metadata.id     (both are the contract address, for contract-level metadata)
 * - NFT.id === LSP4Metadata.id              (both are "{address} - {tokenId}", for per-token metadata)
 * - "BaseURI - " + NFT.id === LSP4Metadata.id  (for BaseURI-derived per-token metadata)
 */
const FK_RESOLUTION_RULES: readonly FKResolutionRule[] = [
  {
    name: 'UniversalProfile.lsp3Profile',
    sourceType: 'UniversalProfile',
    fkField: 'lsp3Profile',
    targetType: 'LSP3Profile',
    resolveTargetId: (sourceId: string) => sourceId,
    resolveSourceId: (targetId: string) => targetId,
  },
  {
    name: 'DigitalAsset.lsp4Metadata',
    sourceType: 'DigitalAsset',
    fkField: 'lsp4Metadata',
    targetType: 'LSP4Metadata',
    resolveTargetId: (sourceId: string) => sourceId,
    resolveSourceId: (targetId: string) => targetId,
  },
  {
    name: 'NFT.lsp4Metadata',
    sourceType: 'NFT',
    fkField: 'lsp4Metadata',
    targetType: 'LSP4Metadata',
    resolveTargetId: (sourceId: string) => sourceId,
    resolveSourceId: (targetId: string) => targetId,
  },
  {
    name: 'NFT.lsp4MetadataBaseUri',
    sourceType: 'NFT',
    fkField: 'lsp4MetadataBaseUri',
    targetType: 'LSP4Metadata',
    resolveTargetId: (sourceId: string) => `BaseURI - ${sourceId}`,
    resolveSourceId: (targetId: string) =>
      targetId.startsWith('BaseURI - ') ? targetId.slice('BaseURI - '.length) : null,
  },
];

// ---------------------------------------------------------------------------
// Execution engine
// ---------------------------------------------------------------------------

/**
 * Resolve non-core FK references after the enrichment phase.
 *
 * For each resolution rule, performs bidirectional resolution:
 *
 * 1. Forward pass — Source entities created/updated in this batch:
 *    For each source entity in the batch context, derive the expected target ID.
 *    Check if the target exists (batch context first, then DB). If found, set
 *    the FK to a stub reference.
 *
 * 2. Reverse pass — Target entities created in this batch:
 *    For each target entity in the batch context, derive which source entity
 *    should reference it. Query the DB for source entities with a null FK.
 *    If found, set the FK and upsert.
 *
 * Both passes are needed to handle cross-batch dependencies regardless of
 * which entity (source or target) was created first.
 */
export async function resolveForeignKeys(
  store: Store,
  batchCtx: BatchContext,
  log: Logger,
  blockRange?: { from: number; to: number },
): Promise<void> {
  const resolveLog = createStepLogger(log, 'RESOLVE', blockRange);

  for (const rule of FK_RESOLUTION_RULES) {
    const entitiesToUpdate: RegisteredEntity[] = [];

    // ----- Forward pass: source entities in batch → find target -----
    const sourceEntities = getSourceEntitiesFromBatch(batchCtx, rule);

    if (sourceEntities.length > 0) {
      const forwardResolved = await resolveForward(store, batchCtx, rule, sourceEntities);
      entitiesToUpdate.push(...forwardResolved);
    }

    // ----- Reverse pass: target entities in batch → find source in DB -----
    const targetEntities = getTargetEntitiesFromBatch(batchCtx, rule);

    if (targetEntities.length > 0) {
      // Exclude source IDs already resolved in the forward pass to avoid
      // duplicate upserts for the same entity
      const alreadyResolved = new Set(entitiesToUpdate.map((e) => e.id));
      const reverseResolved = await resolveReverse(store, rule, targetEntities, alreadyResolved);
      entitiesToUpdate.push(...reverseResolved);
    }

    // Persist all resolved entities in a single upsert per rule
    if (entitiesToUpdate.length > 0) {
      await store.upsert(entitiesToUpdate);
      resolveLog.info(
        { rule: rule.name, count: entitiesToUpdate.length },
        'Resolved FK references',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Get source entities from the batch context for a given rule.
 *
 * For UniversalProfile and DigitalAsset, these are created during verification
 * (Step 5) and exist in the batch context's verification results, not as
 * regular entity bag entries. For NFT, they are created by handlers in Step 3.
 *
 * We also check the verification results for newly created UP/DA entities.
 */
function getSourceEntitiesFromBatch(
  batchCtx: BatchContext,
  rule: FKResolutionRule,
): RegisteredEntity[] {
  // Check regular entity bag first
  const bagEntities = batchCtx.getEntities(rule.sourceType);
  const entities: RegisteredEntity[] = [...bagEntities.values()];

  // For core entities (UP, DA), also check verification results
  // since new UP/DA entities are stored there, not in the entity bag.
  if (rule.sourceType === 'UniversalProfile') {
    const verified = batchCtx.getVerified(EntityCategory.UniversalProfile);
    for (const entity of verified.newEntities.values()) {
      if (!bagEntities.has(entity.id)) {
        entities.push(entity);
      }
    }
  } else if (rule.sourceType === 'DigitalAsset') {
    const verified = batchCtx.getVerified(EntityCategory.DigitalAsset);
    for (const entity of verified.newEntities.values()) {
      if (!bagEntities.has(entity.id)) {
        entities.push(entity);
      }
    }
  }

  return entities;
}

/**
 * Get target entities from the batch context for a given rule.
 */
function getTargetEntitiesFromBatch(
  batchCtx: BatchContext,
  rule: FKResolutionRule,
): RegisteredEntity[] {
  const entities = batchCtx.getEntities(rule.targetType);
  return [...entities.values()];
}

/**
 * Forward pass: For source entities in the batch, find their target and set FK.
 *
 * Checks batch context first (target created in same batch), then falls back
 * to a single batched DB query for remaining targets.
 */
async function resolveForward(
  store: Store,
  batchCtx: BatchContext,
  rule: FKResolutionRule,
  sourceEntities: RegisteredEntity[],
): Promise<RegisteredEntity[]> {
  const resolved: RegisteredEntity[] = [];

  // Separate sources into those whose target is in-batch vs needs DB lookup
  const needsDbLookup: Array<{ source: RegisteredEntity; targetId: string }> = [];

  const batchTargets = batchCtx.getEntities(rule.targetType);

  for (const source of sourceEntities) {
    // Skip if FK is already set
    const currentFk = source[rule.fkField];
    if (currentFk != null) continue;

    const targetId = rule.resolveTargetId(source.id);

    // Check batch context first
    if (batchTargets.has(targetId)) {
      setFkStub(source, rule);
      resolved.push(source);
    } else {
      needsDbLookup.push({ source, targetId });
    }
  }

  // Batch DB lookup for remaining targets
  if (needsDbLookup.length > 0) {
    const targetIds = [...new Set(needsDbLookup.map((item) => item.targetId))];
    // Constructor resolved from registry; cast needed because TypeORM's EntityClass<T>
    // expects a single concrete type, not the union from ENTITY_CONSTRUCTORS[K]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetClass = ENTITY_CONSTRUCTORS[rule.targetType] as any;
    const existingTargets = await store.findBy(targetClass, {
      id: In(targetIds),
    });
    const existingIds = new Set(existingTargets.map((e) => e.id));

    for (const { source, targetId } of needsDbLookup) {
      if (existingIds.has(targetId)) {
        setFkStub(source, rule);
        resolved.push(source);
      }
    }
  }

  return resolved;
}

/**
 * Reverse pass: For target entities in the batch, find source entities in DB
 * that have a null FK and should reference the target.
 *
 * This handles the cross-batch case: source was created in a previous batch
 * and the target is being created now.
 */
async function resolveReverse(
  store: Store,
  rule: FKResolutionRule,
  targetEntities: RegisteredEntity[],
  alreadyResolved: Set<string>,
): Promise<RegisteredEntity[]> {
  const resolved: RegisteredEntity[] = [];

  // Derive source IDs from target entities, excluding:
  // - null returns (target ID doesn't match this rule's pattern)
  // - IDs already resolved in the forward pass
  const sourceIds = [
    ...new Set(
      targetEntities
        .map((target) => rule.resolveSourceId(target.id))
        .filter(
          (sourceId): sourceId is string => sourceId !== null && !alreadyResolved.has(sourceId),
        ),
    ),
  ];

  if (sourceIds.length === 0) return resolved;

  // Query DB for source entities with null FK
  // Constructor resolved from registry; cast needed because TypeORM's EntityClass<T>
  // expects a single concrete type, not the union from ENTITY_CONSTRUCTORS[K]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceClass = ENTITY_CONSTRUCTORS[rule.sourceType] as any;
  const sources = await store.find(sourceClass, {
    where: {
      id: In(sourceIds),
      [rule.fkField]: IsNull(),
    },
  });

  for (const source of sources as RegisteredEntity[]) {
    setFkStub(source, rule);
    resolved.push(source);
  }

  return resolved;
}

/**
 * Set a FK stub on a source entity. Creates a minimal target entity instance
 * with only the `id` field set, which TypeORM uses as a FK reference.
 */
function setFkStub(source: RegisteredEntity, rule: FKResolutionRule): void {
  const targetId = rule.resolveTargetId(source.id);
  const targetClass = ENTITY_CONSTRUCTORS[rule.targetType];
  const stub = new targetClass({ id: targetId });
  source[rule.fkField] = stub;
}
