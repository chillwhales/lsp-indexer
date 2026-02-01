/**
 * Core types barrel export.
 *
 * Re-exports all types from domain-specific modules. This maintains backward
 * compatibility — all existing imports like `from '@/core/types'` resolve to
 * this barrel export with zero code changes.
 */

export * from './batchContext';
export * from './handler';
export * from './metadata';
export * from './plugins';
export * from './subsquid';
export * from './verification';
