/**
 * Entity type utilities for compile-time type safety.
 *
 * These utility types enable full type inference throughout the enrichment
 * queue pipeline, eliminating the need for `as any` casts while maintaining
 * flexibility for dynamic entity operations.
 */

/**
 * Base constraint for all TypeORM entities.
 *
 * All entities in the system must have an `id` field and block ordering
 * fields for deterministic blockchain positioning (BORD-05).
 * This constraint enables type-safe operations in the pipeline while
 * remaining flexible enough to work with any entity type.
 */
export type Entity = {
  id: string;
  blockNumber: number;
  transactionIndex: number;
  logIndex: number;
};

/**
 * Extract the entity class constructor type.
 *
 * Ensures the constructor accepts Partial<T> for entity initialization,
 * matching TypeORM's entity construction pattern:
 * `new SomeEntity({ id: '...', field: value })`
 */
export type EntityConstructor<T extends Entity> = new (props?: Partial<T>) => T;

/**
 * Extract all FK (foreign key) field names from an entity type.
 *
 * FK fields are typed as `SomeEntity | undefined | null` in TypeORM.
 * This utility type extracts only those fields, enabling compile-time
 * validation that fkField arguments in enrichment requests are actually
 * FK fields (not primitive fields like 'address' or 'timestamp').
 *
 * Example:
 * ```typescript
 * type LSP5ReceivedAssetFKs = FKFields<LSP5ReceivedAsset>;
 * // Result: 'universalProfile' | 'receivedAsset'
 * ```
 */
export type FKFields<T> = {
  [K in keyof T]: T[K] extends Entity | undefined | null ? K : never;
}[keyof T];

/**
 * Extract all non-FK, writable field names from an entity type.
 *
 * Writable fields are non-FK fields (primitives, dates, etc.) excluding
 * the `id` field. This utility type is used for merge-upsert operations
 * where handlers specify which fields should preserve existing non-null
 * values across batch boundaries.
 *
 * Example:
 * ```typescript
 * type LSP5ReceivedAssetWritable = WritableFields<LSP5ReceivedAsset>;
 * // Result: 'address' | 'timestamp' | 'assetAddress' | 'arrayIndex' | 'interfaceId'
 * // (excludes 'id', 'universalProfile', 'receivedAsset')
 * ```
 */
export type WritableFields<T extends Entity> = {
  [K in keyof T]: T[K] extends Entity | undefined | null ? never : K extends 'id' ? never : K;
}[keyof T];
