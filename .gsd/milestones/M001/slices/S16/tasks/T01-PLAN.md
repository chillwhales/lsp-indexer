# T01: 12-replace-local-packages-with-chillwhales-npm 01

**Slice:** S16 — **Milestone:** M001

## Description

Replace local `packages/data-keys/` and `packages/lsp1/` with `@chillwhales/erc725` and `@chillwhales/lsp1` from npm, then validate the full build pipeline.

Purpose: Eliminate locally-maintained registry packages in favor of the shared LUKSO Standards ecosystem packages, reducing maintenance burden and aligning with the `chillwhales/LSPs` monorepo.
Output: All imports swapped, local packages deleted, all 4 publishable packages building and passing validation.

## Must-Haves

- [ ] 'packages/data-keys/ directory no longer exists in the repo'
- [ ] 'packages/lsp1/ directory no longer exists in the repo'
- [ ] 'Zero imports reference @lsp-indexer/data-keys or @lsp-indexer/lsp1 anywhere in the codebase'
- [ ] 'All 4 publishable packages build successfully'
- [ ] 'publint and arethetypeswrong pass on all 4 packages'
- [ ] 'Test app next build compiles without errors'

## Files

- `packages/types/package.json`
- `packages/types/tsup.config.ts`
- `packages/types/src/registry-schemas.ts`
- `packages/types/src/index.ts`
- `packages/types/src/data-changed-events.ts`
- `packages/types/src/token-id-data-changed-events.ts`
- `packages/types/src/universal-receiver-events.ts`
- `packages/node/package.json`
- `packages/node/tsup.config.ts`
- `packages/node/src/parsers/data-changed-events.ts`
- `packages/node/src/parsers/token-id-data-changed-events.ts`
- `packages/node/src/parsers/universal-receiver-events.ts`
- `packages/node/src/services/data-changed-events.ts`
- `packages/node/src/services/token-id-data-changed-events.ts`
- `packages/node/src/services/universal-receiver-events.ts`
- `apps/test/package.json`
- `apps/test/src/app/data-changed-events/page.tsx`
- `apps/test/src/app/token-id-data-changed-events/page.tsx`
- `apps/test/src/app/universal-receiver-events/page.tsx`
