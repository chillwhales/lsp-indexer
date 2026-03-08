---
phase: 13-indexer-v1-cleanup
verified: 2026-03-06T10:15:00Z
status: passed
score: 9/9 must-haves verified
must_haves:
  truths:
    - 'Only one packages/indexer/ directory exists — no packages/indexer-v2/'
    - 'No docker/v1/ directory exists — only one Docker setup at docker/'
    - '`pnpm start` runs the indexer (no start:v2 script exists)'
    - 'pnpm --filter=@chillwhales/indexer build succeeds'
    - "No 'indexer-v2' string appears in operational config files"
    - 'comparison-tool has no v1/v2 mode distinction — just source vs target'
    - 'comparison-tool CLI accepts --source/--target (not --v1/--v2)'
    - 'Root README describes single-indexer reality'
    - "Zero operational docs reference 'indexer-v2' or 'v1-v2' (excluding .planning/)"
  artifacts:
    - path: 'packages/indexer/package.json'
      provides: 'Canonical indexer package'
      contains: '@chillwhales/indexer'
    - path: 'docker/docker-compose.yml'
      provides: 'Docker compose for indexer'
      contains: 'indexer:'
    - path: 'docker/Dockerfile'
      provides: 'Multi-stage Docker build'
      contains: 'packages/indexer/'
    - path: 'docker/manage.sh'
      provides: 'Docker management script'
    - path: 'docker/entrypoint.sh'
      provides: 'Container entrypoint'
      contains: 'packages/indexer'
    - path: 'packages/comparison-tool/src/types.ts'
      provides: 'Simplified comparison types without ComparisonMode'
    - path: 'packages/comparison-tool/src/cli.ts'
      provides: 'CLI with --source/--target only'
    - path: 'packages/comparison-tool/src/entityRegistry.ts'
      provides: 'Entity registry without V1_V2_DIVERGENCES'
    - path: 'README.md'
      provides: 'Root README describing single indexer'
  key_links:
    - from: 'package.json'
      to: 'packages/indexer/package.json'
      via: 'pnpm --filter=@chillwhales/indexer start'
      pattern: '@chillwhales/indexer'
    - from: 'docker/Dockerfile'
      to: 'packages/indexer/'
      via: 'COPY and build commands'
      pattern: 'packages/indexer'
    - from: 'eslint.config.ts'
      to: 'packages/indexer/tsconfig.eslint.json'
      via: 'parserOptions.project'
      pattern: 'packages/indexer/tsconfig.eslint.json'
    - from: '.github/workflows/ci.yml'
      to: 'packages/indexer/package.json'
      via: 'pnpm --filter=@chillwhales/indexer build'
      pattern: '@chillwhales/indexer'
    - from: 'packages/comparison-tool/src/cli.ts'
      to: 'packages/comparison-tool/src/types.ts'
      via: 'ComparisonConfig import'
      pattern: 'ComparisonConfig'
    - from: 'packages/comparison-tool/src/comparisonEngine.ts'
      to: 'packages/comparison-tool/src/types.ts'
      via: 'ComparisonConfig usage'
      pattern: 'ComparisonConfig'
    - from: 'README.md'
      to: 'docker/manage.sh'
      via: 'Quick start commands'
      pattern: 'manage.sh'
---

# Phase 13: Indexer v1 Cleanup — Verification Report

**Phase Goal:** The repo has one indexer (`packages/indexer/`, currently `indexer-v2`) and one Docker setup — all v1 code, Docker images, scripts, and root-level v1 commands are gone. `packages/indexer-v2/` becomes the canonical `packages/indexer/`.

**Verified:** 2026-03-06T10:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                          | Status     | Evidence                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Only one packages/indexer/ directory exists — no packages/indexer-v2/          | ✓ VERIFIED | `ls packages/` shows `indexer` (no `indexer-v2`); `test -d packages/indexer-v2` → GONE                                                                                                                                                     |
| 2   | No docker/v1/ directory exists — only one Docker setup at docker/              | ✓ VERIFIED | `test -d docker/v1` → GONE; `test -d docker/v2` → GONE; `ls docker/` shows flat structure with docker-compose.yml, Dockerfile, manage.sh, entrypoint.sh, README.md                                                                         |
| 3   | `pnpm start` runs the indexer (no start:v2 script exists)                      | ✓ VERIFIED | `package.json` line 19: `"start": "pnpm --filter=@chillwhales/indexer start"`; no `start:v2` script found                                                                                                                                  |
| 4   | pnpm --filter=@chillwhales/indexer build succeeds                              | ✓ VERIFIED | Build executed successfully: `tsc` completed with no errors                                                                                                                                                                                |
| 5   | No 'indexer-v2' string appears in operational config files                     | ✓ VERIFIED | Grep across package.json, eslint.config.ts, ci.yml, .env.example, docker/ — zero matches. Only refs: `refactor/indexer-v2-react` branch name (actual git branch, acceptable), 1 stale entry in pnpm-lock.yaml (auto-generated, ⚠️ warning) |
| 6   | comparison-tool has no v1/v2 mode distinction — just source vs target          | ✓ VERIFIED | No `ComparisonMode` type, no `V1_V2_DIVERGENCES`, no `KnownDivergence` in src/. Labels hardcoded as `'Source'`/`'Target'` in comparisonEngine.ts:229-230                                                                                   |
| 7   | comparison-tool CLI accepts --source/--target (not --v1/--v2)                  | ✓ VERIFIED | cli.ts has only `--source=`, `--target=`, `--source-secret=`, `--target-secret=`. No `--v1=`, `--v2=`, or `--mode=` flags. printUsage() shows only source/target options                                                                   |
| 8   | Root README describes single-indexer reality                                   | ✓ VERIFIED | README.md shows single `indexer/` in tree, flat `docker/` with manage.sh, `pnpm start` (no v2), `./manage.sh start` commands                                                                                                               |
| 9   | Zero operational docs reference 'indexer-v2' or 'v1-v2' (excluding .planning/) | ✓ VERIFIED | Full grep across README.md and docs/ returns only `refactor/indexer-v2-react` in docs/AGENTS.md:145 — this is the actual git branch name, not a product version reference                                                                  |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact                                         | Expected                                              | Status     | Details                                                                                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/indexer/package.json`                  | Canonical indexer package with `@chillwhales/indexer` | ✓ VERIFIED | Line 2: `"name": "@chillwhales/indexer"`, description: "LUKSO blockchain indexer — plugin architecture"                                                     |
| `docker/docker-compose.yml`                      | Docker compose for indexer                            | ✓ VERIFIED | 252 lines, service name `indexer:` (line 80), container `lsp-indexer` (line 89), image `lsp-indexer:latest` (line 88), paths `packages/indexer/` throughout |
| `docker/Dockerfile`                              | Multi-stage Docker build                              | ✓ VERIFIED | 123 lines, 3 stages (deps, builder, runner), references `packages/indexer/` (14 occurrences), builds `@chillwhales/indexer`                                 |
| `docker/manage.sh`                               | Docker management script                              | ✓ VERIFIED | 445 lines, default service `indexer` (line 142), container `lsp-indexer`, no v2 references                                                                  |
| `docker/entrypoint.sh`                           | Container entrypoint                                  | ✓ VERIFIED | Line 49: `cd /app/packages/indexer` — correct path                                                                                                          |
| `packages/comparison-tool/src/types.ts`          | Simplified types without ComparisonMode               | ✓ VERIFIED | 83 lines, no ComparisonMode type, no KnownDivergence interface, ComparisonConfig has no `mode` field, RowDiff has single `diffs` field                      |
| `packages/comparison-tool/src/cli.ts`            | CLI with --source/--target only                       | ✓ VERIFIED | 132 lines, only --source/--target/--source-secret/--target-secret/--entities/--sample-size/--tolerance flags                                                |
| `packages/comparison-tool/src/entityRegistry.ts` | Entity registry without V1_V2_DIVERGENCES             | ✓ VERIFIED | 160 lines (reduced from ~387), zero matches for V1_V2_DIVERGENCES or getKnownDivergences                                                                    |
| `README.md`                                      | Root README describing single indexer                 | ✓ VERIFIED | 183 lines, single `indexer/` package, flat `docker/` directory, `pnpm start` and `./manage.sh start` commands                                               |

### Key Link Verification

| From                                  | To                                      | Via                                        | Status  | Details                                                                                                             |
| ------------------------------------- | --------------------------------------- | ------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `package.json`                        | `packages/indexer/package.json`         | `pnpm --filter=@chillwhales/indexer start` | ✓ WIRED | Line 19: `"start": "pnpm --filter=@chillwhales/indexer start"` → matches package name `@chillwhales/indexer`        |
| `docker/Dockerfile`                   | `packages/indexer/`                     | COPY and build commands                    | ✓ WIRED | 14 references to `packages/indexer/` across all stages; build: `pnpm --filter=@chillwhales/indexer build` (line 61) |
| `eslint.config.ts`                    | `packages/indexer/tsconfig.eslint.json` | parserOptions.project                      | ✓ WIRED | Line 45: `'./packages/indexer/tsconfig.eslint.json'`; v1 ignore entry removed (packages/indexer/ is now linted)     |
| `.github/workflows/ci.yml`            | `packages/indexer/package.json`         | pnpm --filter build                        | ✓ WIRED | Line 89: `pnpm --filter=@chillwhales/indexer build`                                                                 |
| `comparison-tool/cli.ts`              | `comparison-tool/types.ts`              | ComparisonConfig import                    | ✓ WIRED | Line 6: `import { ComparisonConfig } from './types'`; used throughout parseArgs()                                   |
| `comparison-tool/comparisonEngine.ts` | `comparison-tool/types.ts`              | ComparisonConfig usage                     | ✓ WIRED | ComparisonConfig used as function parameter type                                                                    |
| `README.md`                           | `docker/manage.sh`                      | Quick start commands                       | ✓ WIRED | Lines 48, 51: `./manage.sh start`, `./manage.sh logs indexer all`                                                   |

### Requirements Coverage

| Requirement | Source Plan            | Description                                                                      | Status      | Evidence                                                                                                            |
| ----------- | ---------------------- | -------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| CLEAN-01    | 13-01-PLAN             | `packages/indexer/` (v1) removed and `packages/indexer-v2/` renamed to canonical | ✓ SATISFIED | packages/indexer/ exists with @chillwhales/indexer name, no indexer-v2/ directory                                   |
| CLEAN-02    | 13-01-PLAN             | `docker/v1/` removed — only one Docker setup remains                             | ✓ SATISFIED | No docker/v1/ or docker/v2/ — flat docker/ with compose, Dockerfile, manage.sh, entrypoint                          |
| CLEAN-03    | 13-01-PLAN, 13-02-PLAN | Root scripts updated: v1 start removed, start:v2 promoted, no dead refs          | ✓ SATISFIED | `"start": "pnpm --filter=@chillwhales/indexer start"`, no start:v2, dead `. ./env.sh` sourcing removed              |
| CLEAN-04    | 13-01-PLAN, 13-02-PLAN | All config files updated — zero stale paths                                      | ✓ SATISFIED | eslint.config.ts references packages/indexer/, CI builds @chillwhales/indexer, .env.example has no v1/v2 commentary |

### Anti-Patterns Found

| File             | Line | Pattern                                                       | Severity   | Impact                                                                                                                                                      |
| ---------------- | ---- | ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm-lock.yaml` | 251  | Stale `packages/indexer-v2:` entry in auto-generated lockfile | ⚠️ Warning | Harmless for builds (pnpm ignores non-existent workspace packages); would be cleaned by running `pnpm install`. Not a blocker — lockfile is auto-generated. |

### Human Verification Required

### 1. Docker Build & Run

**Test:** Run `cd docker && ./manage.sh build` then `./manage.sh start` to verify the full Docker pipeline works
**Expected:** Image builds successfully, indexer container starts and connects to PostgreSQL
**Why human:** Requires running Docker daemon and actual container orchestration

### 2. Comparison Tool CLI Help

**Test:** Run `pnpm compare -- --help` and verify output shows only --source/--target options
**Expected:** Help text shows source/target endpoint options, no --v1/--v2/--mode flags, examples use generic endpoint URLs
**Why human:** Verifying CLI output formatting and completeness

### Gaps Summary

No gaps found. All 9 observable truths verified, all 9 artifacts substantive and wired, all 7 key links confirmed, all 4 requirements satisfied. The only notable item is a stale `packages/indexer-v2:` entry in `pnpm-lock.yaml` (auto-generated file, harmless, would be cleaned by `pnpm install`).

---

_Verified: 2026-03-06T10:15:00Z_
_Verifier: Claude (gsd-verifier)_
