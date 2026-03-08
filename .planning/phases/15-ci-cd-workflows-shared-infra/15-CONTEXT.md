# Phase 15: CI/CD Workflows & Shared Infra - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

This repo gets the same CI/CD workflow quality as `chillwhales/LSPs` — layered CI (lint, typecheck, build, test, package verification), changesets-based release, preview releases, and shared workflow abstraction into `chillwhales/.github` org repo. Indexer Docker image publishing is included in the release workflow.

</domain>

<decisions>
## Implementation Decisions

### Release versioning strategy
- Fixed group versioning — all 4 `@lsp-indexer/*` packages (types, node, react, next) always share the same version number
- Starting version: `0.1.0` (pre-stable, graduate to 1.0.0 when API stabilizes)
- Fully automatic publish — merge the "Version Packages" PR → changesets action publishes to npm + creates GitHub Releases. Zero manual steps
- Changeset bot enforcement: **blocking for publishable changes** (code in packages must have a changeset to merge), non-blocking for non-publishable changes (CI, docs, internal-only changes can merge without a changeset)
- Indexer Docker image published in the same release workflow as npm packages — single release trigger, same version tag (`v0.1.0`)

### Preview release mechanics
- Any PR to `main` triggers a preview release
- PR-number based tag naming: `0.1.1-pr.123.0` (increments on each push to same PR). Install via `npm install @lsp-indexer/react@pr.123`
- No git tags for preview releases — only real releases get git tags (e.g., `v0.1.0`)
- npm dist-tag cleanup on PR merge (removes `pr.123` pointer, published tarball stays on registry)
- Tool: `pkg-pr-new` (by stackblitz) — matching `chillwhales/LSPs` pattern
- Security: internal branches only (`github.event.pull_request.head.repo.full_name == github.repository`) — fork PRs excluded

### Shared workflow abstraction
- Location: `chillwhales/.github` org repo (GitHub's built-in mechanism for org-wide reusable workflows)
- Abstraction depth: both layers — reusable composite steps AND full reusable workflows that compose them
- Three reusable workflow layers:
  1. **Build-lint-test** — generic, works for any pnpm monorepo
  2. **Code quality checks** — biome/eslint, typecheck, other static analysis
  3. **Publish validation** — publint, attw, changesets release, preview releases
- Each repo composes these into its own top-level CI workflow via `uses: chillwhales/.github/.github/workflows/<name>@main`
- Scope: full implementation — create `chillwhales/.github` repo with working reusable workflows, lsp-indexer consuming them by end of phase
- Migration: lsp-indexer first as proving ground, LSPs migrates in a separate future effort

### Coverage & quality gates
- PR comment with coverage summary table (coverage % per package, lines/branches/functions, diff against base)
- Fixed 80% minimum threshold — CI fails if any covered package drops below 80%
- Coverage scope: all 4 `@lsp-indexer/*` packages (types, node, react, next)

### Claude's Discretion
- Exact GitHub Actions workflow YAML structure and job naming
- Coverage reporting tool choice (vitest built-in, custom action, etc.)
- Composite step vs reusable workflow boundary decisions within the three layers
- Docker image registry choice (GHCR vs Docker Hub)
- Changeset bot configuration details
- CI matrix (Node versions, OS variants)

</decisions>

<specifics>
## Specific Ideas

- Mirror `chillwhales/LSPs` CI pipeline as the reference implementation — same `pkg-pr-new` setup, same fork security check pattern
- LSPs preview workflow reference: `pnpx pkg-pr-new publish './packages/*' --compact --comment=update --packageManager=pnpm`
- LSPs has 3 workflow files: `ci.yml`, `release.yml`, `preview.yml` — lsp-indexer should match this structure before extracting to shared workflows
- Reusable workflows should be generic enough that both `lsp-indexer` and `LSPs` can consume them with minimal repo-specific config

</specifics>

<deferred>
## Deferred Ideas

- LSPs repo migration to shared workflows — separate effort after lsp-indexer proves the pattern
- Coverage threshold increases beyond 80% — revisit once test suite matures
- Additional repos consuming shared workflows — future as org grows

</deferred>

---

*Phase: 15-ci-cd-workflows-shared-infra*
*Context gathered: 2026-03-07*
