# Shared CI/CD Infrastructure Decision

**Date:** 2026-03-08
**Status:** Implemented
**Scope:** chillwhales organization CI/CD workflow sharing

## Decision

Shared CI/CD workflows and composite actions live in the `chillwhales/.github` organization repository. Consumer repos (starting with lsp-indexer) reference them via `uses: chillwhales/.github/.github/workflows/<name>@main`.

## Architecture

### Three-Layer Structure

```
chillwhales/.github/
├── .github/
│   ├── actions/
│   │   ├── setup-pnpm/action.yml      # Composite action: checkout + pnpm + node + install
│   │   └── build-and-upload/action.yml # Composite action: build + artifact upload
│   └── workflows/
│       ├── ci-build-lint-test.yml      # Reusable workflow: full CI pipeline
│       ├── ci-quality.yml              # Reusable workflow: pkg verify + changeset check
│       └── ci-publish-validation.yml   # Reusable workflow: preview releases
└── README.md
```

**Layer 1 — Composite Actions (building blocks):**
- `setup-pnpm`: Eliminates 4-step boilerplate (checkout → pnpm/action-setup → setup-node with cache → install). Used internally by reusable workflows and available for inline jobs.
- `build-and-upload`: Abstracts build + artifact upload pattern.

**Layer 2 — Reusable Workflows (full pipelines):**
- `ci-build-lint-test`: 7 jobs — install, format, lint, build, typecheck, test (matrix), coverage report. All steps configurable via inputs with sensible defaults.
- `ci-quality`: 2 jobs — package verification (publint/attw) and changeset status check. Downloads build artifacts from the caller workflow.
- `ci-publish-validation`: 1 job — preview releases via pkg-pr-new on PRs.

**Layer 3 — Consumer Repos:**
- Each repo defines a thin caller workflow that passes repo-specific configuration as inputs.
- The caller workflow is typically ~30 lines vs the previous ~250 lines.

## What Was Implemented

### chillwhales/.github repository
- Created as a public org repo
- 2 composite actions: `setup-pnpm`, `build-and-upload`
- 3 reusable workflows: `ci-build-lint-test`, `ci-quality`, `ci-publish-validation`
- README with documentation, input tables, and example caller workflow

### lsp-indexer CI refactoring
- `.github/workflows/ci.yml` refactored from 9 inline jobs (~253 lines) to 2 reusable workflow calls (~40 lines)
- Uses `ci-build-lint-test.yml` for the full CI pipeline (install → format → lint → build → typecheck → test → coverage)
- Uses `ci-quality.yml` for package verification and changeset checks
- All repo-specific configuration passed as workflow inputs

## What Works Well

1. **Dramatic boilerplate reduction:** lsp-indexer's CI went from ~253 lines (9 jobs with repeated setup steps) to ~40 lines (2 `uses:` calls with inputs).
2. **Consistent setup:** Every job uses the same checkout → pnpm → node → install pattern via the `setup-pnpm` composite action internally.
3. **Configurable without forking:** Inputs like `pre-lint-command`, `test-node-versions`, `artifact-paths` handle repo-specific needs without changing shared code.
4. **Artifact sharing works:** Reusable workflows called via `uses:` run in the same workflow run context — artifacts uploaded by `ci-build-lint-test` are available to `ci-quality` via `actions/download-artifact`.
5. **Optional steps via empty string inputs:** Jobs are conditionally skipped when their command input is empty (e.g., a repo without tests simply omits `test-command`).

## Limitations and Tradeoffs

1. **Reusable workflow nesting depth:** GitHub limits reusable workflow nesting to 4 levels. The current architecture uses 2 levels (caller → shared workflow), leaving room for 2 more.
2. **Secrets propagation:** Reusable workflows require explicit `secrets: inherit` or individual secret forwarding. The current CI workflows don't need secrets, but release/deploy workflows would.
3. **Job naming:** Jobs from reusable workflows appear in the GitHub UI under the caller job name, which can make debugging slightly less intuitive.
4. **Version pinning:** Using `@main` means shared workflow changes affect all consumers immediately. For production stability, tag releases (e.g., `@v1`) should be adopted once workflows stabilize.
5. **Debugging complexity:** When a shared workflow job fails, developers must look at both the consumer workflow (inputs) and the shared workflow (implementation) to diagnose issues.

## Migration Path for LSPs

### What applies directly
- `ci-build-lint-test.yml` — LSPs is also a pnpm monorepo, so the build-lint-test pipeline maps cleanly
- `setup-pnpm` composite action — works for any pnpm project
- `ci-quality.yml` — if LSPs adopts changesets for versioning

### What needs customization
- `artifact-paths` — LSPs has different package output directories
- `pre-lint-command` — LSPs may not need dependency pre-builds
- `test-command` — LSPs uses different test runners/configurations
- Release/deploy workflows — LSPs has its own publish and deploy patterns

### Migration steps
1. Add a caller workflow to LSPs referencing `chillwhales/.github/.github/workflows/ci-build-lint-test.yml@main`
2. Configure inputs for LSPs-specific commands and paths
3. Add quality checks if applicable
4. Keep repo-specific workflows (release, deploy) inline

### Example LSPs caller
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    uses: chillwhales/.github/.github/workflows/ci-build-lint-test.yml@main
    with:
      build-command: pnpm build
      lint-command: pnpm lint
      format-command: pnpm format:check
      test-command: pnpm test
      artifact-paths: packages/*/dist
```

## Consumer Pattern

Any new repo in the chillwhales org can adopt shared CI in 3 steps:

1. **Create `.github/workflows/ci.yml`** with `uses: chillwhales/.github/.github/workflows/ci-build-lint-test.yml@main`
2. **Pass repo-specific inputs** (build command, test command, artifact paths, etc.)
3. **Add quality checks** if using changesets or package publishing

No shared workflow modifications needed for standard pnpm monorepos.

## Maintenance Considerations

### Version pinning strategy
- **Current:** `@main` for rapid iteration during initial adoption
- **Future:** Tag releases (`@v1`, `@v2`) once workflows stabilize, allowing consumers to pin and upgrade on their schedule
- **Breaking changes:** Increment major version, communicate across consumer repos

### Testing shared workflow changes
- Changes to `chillwhales/.github` affect all consumers immediately (when using `@main`)
- Test by creating a PR in `chillwhales/.github` and temporarily pointing a consumer to the PR branch
- Consider a `develop` branch for pre-release testing

### Adding new workflows
1. Create in `chillwhales/.github/.github/workflows/` with `workflow_call` trigger
2. Add typed inputs with defaults
3. Update README
4. Consumer repos opt in via `uses:` — no forced adoption

## Rationale

### Why shared org repo (vs alternatives)

| Approach | Pros | Cons |
|----------|------|------|
| **chillwhales/.github** (chosen) | Single source of truth, automatic org-wide visibility, native GitHub reusable workflows | Debugging requires cross-repo navigation |
| Copy-paste per repo | Simple, no cross-repo deps | Drift, maintenance burden, inconsistency |
| Monorepo CI tool (nx/turborepo) | Deep integration | Heavy tooling, not all repos are monorepos |
| GitHub Actions marketplace | Versioned, discoverable | Overkill for org-internal patterns |

The org repo approach provides the best balance of reuse, simplicity, and GitHub-native integration for a small organization with 2-3 active repos.
