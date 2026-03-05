# Phase 12: Replace Local Packages with @chillwhales NPM — Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace local `packages/data-keys/` and `packages/lsp1/` with published `@chillwhales/erc725` and `@chillwhales/lsp1` from npm. Cross-check all existing `@chillwhales/*` packages for other already-migrated utilities that can be swapped. Audit remaining codebase for pure utility functions extractable to `chillwhales/LSPs`. Remove local packages and validate the full build pipeline.

</domain>

<decisions>
## Implementation Decisions

### Upstream contribution scope

- Full sweep audit across ALL packages: `@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`, `indexer-v2`, and the test app (`apps/test`)
- LUKSO standard-specific utilities route to the matching `@chillwhales/lspX` package
- General-purpose utilities route to `@chillwhales/utils`
- Two-pass approach: (1) cross-check existing `@chillwhales/*` packages for code already migrated from this repo, swap those first; (2) audit for remaining extractable utilities and open new upstream PRs
- Upstream PRs are opened but do NOT block this phase — local code stays until upstream merges

### Migration sequencing

- Both `data-keys` → `@chillwhales/erc725` and `lsp1` → `@chillwhales/lsp1` swapped in a single pass (APIs are identical)
- Order: swap all imports + update deps → remove local package directories → then audit for further extractable utilities
- ESM-only conversion is NOT part of this phase — that happens in Phase 15 (CI/CD). This phase works with the current dual ESM+CJS setup

### API alignment

- This repo adapts to upstream — `@chillwhales/*` packages are the source of truth
- Root imports only — always `import { x } from '@chillwhales/erc725'`, no deep path imports
- No re-exports — delete local functions and import directly from `@chillwhales/*` at every call site
- Zod version compatibility: research will verify, handle if there's an actual mismatch

### Local package cleanup

- Delete `packages/data-keys/` and `packages/lsp1/` directories
- Fix all build-breaking references: `pnpm-workspace.yaml`, `tsconfig.json` references, `tsup.config.ts` external entries, `package.json` workspace deps
- Cosmetic cleanup (comments, docs mentioning local packages) deferred to Phase 14
- Same pattern for any other local utilities swapped to existing `@chillwhales/*` packages: delete the local function, update all call sites to import from upstream directly
- Dependency versions use caret range (`^0.1.0`)

### Build validation gate

- `pnpm build` passes across all packages
- `publint` and `arethetypeswrong` pass on all 4 publishable packages
- Test app `next build` compiles successfully with the swapped deps
- All three must be green before phase is complete

### Claude's Discretion

- Exact order of file-by-file import changes within the single-pass swap
- Whether Zod version needs explicit alignment (research determines this)
- Import style for any `@chillwhales/*` packages beyond erc725 and lsp1 discovered during cross-check
- Grouping of commits within the phase

</decisions>

<specifics>
## Specific Ideas

- The `@chillwhales/erc725` and `@chillwhales/lsp1` packages (v0.1.0) are already published to npm with identical public APIs to the local packages (`resolveDataKeyName`, `resolveDataKeyHex`, `DataKeyNameSchema`, `resolveTypeIdName`, `resolveTypeIdHex`, `TypeIdNameSchema`)
- The upstream `@chillwhales/lsp1` is a superset — it has additional `deployments.ts` and `guards.ts` modules beyond what the local version had
- The `chillwhales/LSPs` repo has 16 packages: `config`, `erc725`, `lsp1`, `lsp2`, `lsp3`, `lsp4`, `lsp6`, `lsp7`, `lsp8`, `lsp17`, `lsp23`, `lsp26`, `lsp29`, `lsp31`, `up`, `utils` — all potential swap targets during the cross-check
- Current local consumers of `@lsp-indexer/data-keys`: `@lsp-indexer/types` (2 files), `@lsp-indexer/node` (4 files), plus tsup externals configs
- Current local consumers of `@lsp-indexer/lsp1`: `@lsp-indexer/types` (1 file), `@lsp-indexer/node` (2 files)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 12-replace-local-packages-with-chillwhales-npm_
_Context gathered: 2026-03-05_
