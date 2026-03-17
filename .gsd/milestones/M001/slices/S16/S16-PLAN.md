# S16: Replace Local Packages With Chillwhales Npm

**Goal:** Replace local `packages/data-keys/` and `packages/lsp1/` with `@chillwhales/erc725` and `@chillwhales/lsp1` from npm, then validate the full build pipeline.
**Demo:** Replace local `packages/data-keys/` and `packages/lsp1/` with `@chillwhales/erc725` and `@chillwhales/lsp1` from npm, then validate the full build pipeline.

## Must-Haves


## Tasks

- [x] **T01: 12-replace-local-packages-with-chillwhales-npm 01** `est:5min`
  - Replace local `packages/data-keys/` and `packages/lsp1/` with `@chillwhales/erc725` and `@chillwhales/lsp1` from npm, then validate the full build pipeline.

Purpose: Eliminate locally-maintained registry packages in favor of the shared LUKSO Standards ecosystem packages, reducing maintenance burden and aligning with the `chillwhales/LSPs` monorepo.
Output: All imports swapped, local packages deleted, all 4 publishable packages building and passing validation.
- [x] **T02: 12-replace-local-packages-with-chillwhales-npm 02** `est:9min`
  - Cross-check all 16 @chillwhales/* packages for additional swap opportunities in the lsp-indexer codebase, identify extractable utilities, and contribute at least one PR to chillwhales/LSPs.

Purpose: Maximize alignment with the shared LUKSO Standards ecosystem. Reduce locally-maintained code that could benefit the broader community.
Output: Audit document + at least one upstream PR opened (does NOT block this phase — local code stays until upstream merges).

## Files Likely Touched

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
- `.planning/phases/12-replace-local-packages-with-chillwhales-npm/12-02-audit.md`
