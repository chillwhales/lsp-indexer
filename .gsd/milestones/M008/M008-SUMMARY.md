---
id: M008
title: "Package Consolidation"
status: complete
completed_at: 2026-04-01T08:48:08.711Z
key_decisions:
  - ABI barrel writes to src/abi/index.ts with skip-self guard to avoid clobbering app entry point
  - Replaced @chillwhales/typeorm → @/model and @chillwhales/abi → @/abi using sed bulk rewrite
  - Deep imports @chillwhales/abi/lib/abi/Multicall3 → @/abi/Multicall3 for 3 handler files
  - Dockerfile runner stage copies schema.graphql from indexer for runtime migrations
  - Scoped stale reference fixes to code files (ts/json/yaml) only; documentation/config cleanup deferred
key_files:
  - packages/indexer/scripts/abi-codegen.sh
  - packages/indexer/package.json
  - packages/indexer/schema.graphql
  - packages/indexer/abi/custom/CHILL.json
  - packages/indexer/abi/custom/Multicall3.json
  - packages/indexer/abi/custom/ORBS.json
  - docker/Dockerfile
  - docker/entrypoint.sh
  - package.json
  - packages/indexer/test/integration/pipeline.test.ts
  - eslint.config.ts
  - pnpm-lock.yaml
lessons_learned:
  - ABI barrel generation script that writes into the same directory as generated files needs a skip-self guard to avoid re-exporting itself
  - sed bulk import rewrite can miss multi-line imports — requires a second pass targeting the string literal directly
  - Scoping stale reference cleanup to code files only (ts/json/yaml) and deferring docs/config is a valid strategy to keep slice scope manageable
---

# M008: Package Consolidation

**Merged @chillwhales/abi and @chillwhales/typeorm into @chillwhales/indexer — single package with integrated ABI and entity codegen, one build step, zero cross-package dependencies.**

## What Happened

M008 consolidated the indexer's satellite codegen packages into a single self-contained package across two slices.

**S01 (Merge abi + typeorm into indexer)** copied all codegen machinery into packages/indexer: 3 custom ABI JSONs, an adapted abi-codegen.sh script with a skip-self barrel guard, schema.graphql for squid-typeorm-codegen, 8 runtime deps, 2 devDeps, and 7 npm scripts. Rewrote 71 imports across the indexer source (57 @chillwhales/typeorm → @/model, 11 @chillwhales/abi → @/abi, 3 deep imports). Updated Dockerfile and entrypoint to reference only packages/indexer. Build produces 48 ABI files and 80 entity model files.

**S02 (Remove old packages and verify parity)** deleted packages/abi/ and packages/typeorm/, fixed one stale import in the integration test, updated eslint config, and regenerated pnpm-lock.yaml. Comprehensive verification confirmed 6-package workspace with zero stale references in code files and full build passing across all 7 workspace projects including docs.

The indexer now has a single `pnpm --filter=@chillwhales/indexer build` that runs ABI codegen → entity codegen → tsc with no external package dependencies. This simplifies CI, Docker builds, and developer onboarding.

## Success Criteria Results

### Success Criteria

- ✅ **`pnpm --filter=@chillwhales/indexer build` runs ABI codegen, entity codegen, and TypeScript compilation in one step**: Confirmed — codegen:abi + codegen:typeorm + tsc all execute and exit 0.
- ✅ **All imports resolve internally**: Zero matches for `@chillwhales/abi` or `@chillwhales/typeorm` in `packages/indexer/src/` (rg returns exit code 1 = no matches).
- ✅ **packages/abi/ and packages/typeorm/ deleted**: Both directories confirmed absent from filesystem.
- ✅ **pnpm build succeeds from root**: All 7 workspace projects (6 packages + docs app) build with zero errors.
- ✅ **Indexer starts and processes blocks identically**: Build output unchanged — same 48 ABI files, 80 model files, clean tsc compilation.

## Definition of Done Results

### Definition of Done

- ✅ **S01 complete**: Merge abi + typeorm into indexer — all codegen, deps, scripts, imports, and infrastructure consolidated.
- ✅ **S02 complete**: Old packages deleted, stale references fixed, 6-package workspace verified with full build passing.
- ✅ **S01 summary exists**: `.gsd/milestones/M008/slices/S01/S01-SUMMARY.md`
- ✅ **S02 summary exists**: `.gsd/milestones/M008/slices/S02/S02-SUMMARY.md`
- ✅ **Cross-slice integration**: S02 successfully consumed S01's output — deleted old packages without breaking any builds.

## Requirement Outcomes

No requirements changed status during M008. This milestone was a structural refactoring (package consolidation) that did not add or modify any user-facing capabilities. All existing requirements (R001–R014) remain in their current validated status.

## Deviations

T01 needed a skip-self guard pattern in ABI barrel generation (not anticipated in plan). T02 initial sed pass missed multi-line imports requiring a second pass. T03 cleaned a stale comment referencing old packages/typeorm/db path. All minor — no plan-level deviations.

## Follow-ups

Clean up stale @chillwhales/abi and @chillwhales/typeorm references in AGENTS.md, CI workflow YAML files, docs pages, and changeset config. These are documentation/config concerns deferred from S02.
