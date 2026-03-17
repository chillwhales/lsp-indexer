# T01: 06-tech-debt-cleanup 01

**Slice:** S10 — **Milestone:** M001

## Description

Remove stale code artifacts and replace JSON.stringify logging with structured attributes — closing all 3 tech debt items from the v1 milestone audit.

Purpose: Clean codebase before milestone completion. These are the only remaining code-level items from the audit.
Output: 4 files cleaned up, zero JSON.stringify in handler logs, zero deprecated exports.

## Must-Haves

- [ ] 'Searching codebase for mergeEntitiesFromBatchAndDb finds zero references (0 exports, 0 callers)'
- [ ] 'Searching registry.ts for TODO comments finds zero stale references to completed work'
- [ ] 'decimals.handler.ts and formattedTokenId.handler.ts use structured logging attributes instead of JSON.stringify'

## Files

- `packages/indexer-v2/src/core/registry.ts`
- `packages/indexer-v2/src/core/handlerHelpers.ts`
- `packages/indexer-v2/src/handlers/decimals.handler.ts`
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts`
