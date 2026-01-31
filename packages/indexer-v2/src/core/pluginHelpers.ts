/**
 * Barrel re-export for plugin helpers.
 *
 * The helpers are split into focused modules:
 *   - populateHelpers: validate addresses, link to parent entities
 *   - persistHelpers:  insert / upsert entity maps from BatchContext
 *   - handlerHelpers:  post-processing utilities for handle() phase
 *
 * Existing plugin imports (`from '@/core/pluginHelpers'`) continue to work
 * unchanged through this barrel.
 */
export { updateTotalSupply } from './handlerHelpers';
export {
  insertEntities,
  insertNewEntities,
  mergeUpsertEntities,
  upsertEntities,
} from './persistHelpers';
export {
  enrichEntityFk,
  populateByDA,
  populateByUP,
  populateByUPAndDA,
  populateNFTs,
} from './populateHelpers';
