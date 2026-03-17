# S10: Tech Debt Cleanup

**Goal:** Remove stale code artifacts and replace JSON.
**Demo:** Remove stale code artifacts and replace JSON.

## Must-Haves


## Tasks

- [x] **T01: 06-tech-debt-cleanup 01** `est:2 min`
  - Remove stale code artifacts and replace JSON.stringify logging with structured attributes — closing all 3 tech debt items from the v1 milestone audit.

Purpose: Clean codebase before milestone completion. These are the only remaining code-level items from the audit.
Output: 4 files cleaned up, zero JSON.stringify in handler logs, zero deprecated exports.

## Files Likely Touched

- `packages/indexer-v2/src/core/registry.ts`
- `packages/indexer-v2/src/core/handlerHelpers.ts`
- `packages/indexer-v2/src/handlers/decimals.handler.ts`
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts`
