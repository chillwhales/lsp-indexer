/**
 * Address verification and enrichment types.
 *
 * These types support the pipeline's verification and enrichment flow:
 * - EntityCategory: Categories of addresses to verify (UP, DA, NFT)
 * - VerificationResult: Result of batch supportsInterface() checks
 * - EnrichmentRequest: Deferred FK resolution request for verified addresses
 */

import { Entity, FKFields } from './entity';

/**
 * Categories of blockchain entities that require verification via supportsInterface().
 */
export enum EntityCategory {
  UniversalProfile = 'UniversalProfile',
  DigitalAsset = 'DigitalAsset',
  NFT = 'NFT',
}

/**
 * Result of verifying a set of addresses for a given EntityCategory.
 *
 * The `new` set and `newEntities` map always have the same keys — both
 * represent the addresses that were verified for the first time in this batch.
 * `new` provides fast Set-based lookups; `newEntities` provides the actual
 * entity instances to persist in Step 5 (VERIFY).
 */
export interface VerificationResult {
  /** Addresses that are new (first seen this batch) and valid */
  new: Set<string>;
  /** All valid addresses (existing + new) */
  valid: Set<string>;
  /** Addresses that failed interface checks */
  invalid: Set<string>;
  /** Newly created entity instances to persist, keyed by address */
  newEntities: Map<string, { id: string }>;
}

/**
 * Request to enrich an entity with FK references after verification.
 *
 * Entities are persisted with null FK references during the persist phase.
 * The enrichment queue tracks which entities need FK fields populated once
 * verification completes and core entities (UP, DA, NFT) are created.
 *
 * Generic parameter T: The entity type being enriched.
 * This enables compile-time validation that fkField is actually a FK field
 * on the entity (not a primitive field like 'address' or 'timestamp').
 */
export interface EnrichmentRequest<T extends Entity> {
  /** Category to verify (UniversalProfile, DigitalAsset, NFT) */
  category: EntityCategory;

  /** Address to verify */
  address: string;

  /** For NFT category only: the tokenId */
  tokenId?: string;

  /** Which entity type to enrich (e.g. 'Transfer', 'LSP4TokenName') */
  entityType: string;

  /** Which entity id to enrich */
  entityId: string;

  /** Which field on the entity to set the FK reference (must be a FK field) */
  fkField: FKFields<T> & string;
}
