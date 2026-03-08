# Phase 15: CI/CD Workflows & Shared Infra - Research

**Researched:** 2026-03-07
**Domain:** GitHub Actions CI/CD, Changesets release automation, Docker image publishing, reusable workflows
**Confidence:** HIGH

## Summary

This phase brings production-grade CI/CD to the lsp-indexer monorepo, mirroring the established `chillwhales/LSPs` pipeline. The work divides into four clear deliverables: (1) layered CI workflow with lint/typecheck/build/test/package-verification, (2) changesets-based release automation with fixed group versioning, (3) preview releases via pkg-pr-new, and (4) shared workflow abstraction into `chillwhales/.github`. All four have well-documented, battle-tested patterns — the LSPs repo serves as a working reference implementation.

The lsp-indexer repo already has a basic CI workflow (format, lint, build) from the recent quick task. This needs to be expanded to match the LSPs layered pattern and add test, coverage, package verification, and changeset enforcement. The 4 publishable packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) all use `version: "0.1.0"` and will be managed under changesets' `fixed` group versioning. The indexer Docker image is published to GHCR in the same release workflow.

**Primary recommendation:** Follow the LSPs ci.yml/release.yml/preview.yml structure exactly, then extract reusable portions into `chillwhales/.github` as a final step.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fixed group versioning — all 4 `@lsp-indexer/*` packages (types, node, react, next) always share the same version number
- Starting version: `0.1.0` (pre-stable, graduate to 1.0.0 when API stabilizes)
- Fully automatic publish — merge the "Version Packages" PR → changesets action publishes to npm + creates GitHub Releases. Zero manual steps
- Changeset bot enforcement: **blocking for publishable changes** (code in packages must have a changeset to merge), non-blocking for non-publishable changes (CI, docs, internal-only changes can merge without a changeset)
- Indexer Docker image published in the same release workflow as npm packages — single release trigger, same version tag (`v0.1.0`)
- Any PR to `main` triggers a preview release
- PR-number based tag naming: `0.1.1-pr.123.0` (increments on each push to same PR). Install via `npm install @lsp-indexer/react@pr.123`
- No git tags for preview releases — only real releases get git tags (e.g., `v0.1.0`)
- npm dist-tag cleanup on PR merge (removes `pr.123` pointer, published tarball stays on registry)
- Tool: `pkg-pr-new` (by stackblitz) — matching `chillwhales/LSPs` pattern
- Security: internal branches only (`github.event.pull_request.head.repo.full_name == github.repository`) — fork PRs excluded
- Location: `chillwhales/.github` org repo (GitHub's built-in mechanism for org-wide reusable workflows)
- Abstraction depth: both layers — reusable composite steps AND full reusable workflows that compose them
- Three reusable workflow layers: build-lint-test, code quality checks, publish validation
- Each repo composes these into its own top-level CI workflow via `uses: chillwhales/.github/.github/workflows/<name>@main`
- Scope: full implementation — create `chillwhales/.github` repo with working reusable workflows, lsp-indexer consuming them by end of phase
- Migration: lsp-indexer first as proving ground, LSPs migrates in a separate future effort
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

### Deferred Ideas (OUT OF SCOPE)
- LSPs repo migration to shared workflows — separate effort after lsp-indexer proves the pattern
- Coverage threshold increases beyond 80% — revisit once test suite matures
- Additional repos consuming shared workflows — future as org grows
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CICD-01 | CI workflow matches LSPs pattern: layered install → (lint, typecheck, build in parallel) → (test with coverage, package verification with publint+attw) → coverage PR report | LSPs ci.yml fully analyzed — 4-layer pattern with install → parallel validate/build → parallel verify/test → coverage report. Existing lsp-indexer ci.yml provides base to extend. vitest-coverage-report-action v2 for PR comments. |
| CICD-02 | Release workflow using changesets: automated version PRs on main push, npm publish on merge, GitHub Releases created | LSPs release.yml pattern confirmed — `changesets/action@v1` with `publish: pnpm ci:publish`. Fixed group versioning via `fixed` config array. `@changesets/changelog-github` for PR-linked changelogs. Docker image step added after npm publish. |
| CICD-03 | Preview release workflow for pre-release npm tags from non-main branches (using pkg-pr-new by stackblitz) | LSPs preview.yml pattern confirmed — `pnpx pkg-pr-new publish './packages/*' --compact --comment=update --packageManager=pnpm`. Fork security guard via `github.event.pull_request.head.repo.full_name == github.repository`. |
| CICD-04 | Investigation completed on abstracting shared workflow patterns into a reusable third repo (chillwhales/.github) — with decision documented | GitHub reusable workflows (`workflow_call`) and composite actions research complete. Three-layer abstraction strategy designed. `chillwhales/.github` org repo structure documented. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@changesets/cli` | ^2.30.0 | Version management + changelog generation | Industry standard for monorepo releases; used by LSPs reference |
| `@changesets/changelog-github` | ^0.6.0 | GitHub-linked changelog entries | PR and author attribution in changelogs; used by LSPs |
| `@changesets/action` | v1 | GitHub Action for automated version PRs + publish | Official changesets GitHub Action; handles Version PR creation and npm publish |
| `pkg-pr-new` | latest (via pnpx) | Preview releases on PRs | StackBlitz tool; no npm install needed, runs via pnpx; matches LSPs pattern |
| `davelosert/vitest-coverage-report-action` | v2 | Coverage PR comments | 249+ stars, actively maintained (v2.9.3, Feb 2026), reads vitest json-summary output |
| `@vitest/coverage-v8` | ^2.1.8 (match vitest version) | Coverage provider for vitest | V8-based coverage for the 4 publishable packages |
| `vitest` | ^2.1.8 | Test runner | Already used in indexer package (`^2.1.8`); needs setup for publishable packages. Keep aligned with existing version. |
| `publint` | ^0.3.18 | Package.json + exports validation | Already in devDependencies; validates package publish readiness |
| `@arethetypeswrong/cli` | ^0.18.2 | TypeScript types validation | Already in devDependencies (attw); validates type resolution paths |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `docker/login-action` | v3 | GHCR authentication in CI | Release workflow for Docker image push |
| `docker/build-push-action` | v6 | Multi-stage Docker build + push | Release workflow for Docker image build |
| `docker/metadata-action` | v5 | Docker image tags and labels | Auto-generate tags (version, latest, sha) |
| `actions/upload-artifact` | v4 | Share build output between CI jobs | Pass dist/ artifacts from build to test/verify jobs |
| `actions/download-artifact` | v4 | Retrieve build output in downstream jobs | Test, verify, coverage jobs consume build artifacts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GHCR (recommended) | Docker Hub | GHCR is free for public repos, integrated with GitHub, automatic GITHUB_TOKEN auth. Docker Hub has pull rate limits and requires separate credentials. |
| `davelosert/vitest-coverage-report-action` | Custom coverage script | The action handles PR comments, summary table, threshold checks, diff against base — building custom would be significant effort |
| `@changesets/cli` | semantic-release | Changesets is more explicit (developer writes changeset), semantic-release is commit-message-driven. Changesets matches LSPs pattern and is locked decision. |

**Installation (root devDependencies):**
```bash
pnpm add -Dw @changesets/cli @changesets/changelog-github
```

**Installation (per publishable package, for test coverage):**
```bash
pnpm add -D --filter @lsp-indexer/types --filter @lsp-indexer/node --filter @lsp-indexer/react --filter @lsp-indexer/next vitest @vitest/coverage-v8
```

## Architecture Patterns

### Recommended File Structure
```
.changeset/
├── config.json              # Changesets configuration (fixed versioning, public access)
└── *.md                     # Individual changeset files (created by `pnpm changeset`)
.github/
└── workflows/
    ├── ci.yml               # Layered CI: install → lint/build → test/verify → coverage
    ├── release.yml          # Changesets release: version PR or npm publish + Docker
    └── preview.yml          # pkg-pr-new preview releases on PRs
```

### Pattern 1: Layered CI Pipeline (4 Layers)
**What:** CI jobs organized in dependency layers — each layer runs only after its prerequisites complete.
**When to use:** Always — this is the CI workflow structure.
**Reference:** `chillwhales/LSPs` ci.yml

```yaml
# Layer 1: Install (shared dependency cache)
install:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
    - run: pnpm install --frozen-lockfile

# Layer 1.5: Changeset Check (PR only, non-blocking for non-publishable changes)
changeset-check:
  if: github.event_name == 'pull_request'
  needs: [install]
  steps:
    - run: pnpm changeset status --since=origin/main

# Layer 2: Parallel validate + build (needs install)
lint:
  needs: [install]
  # runs pnpm lint (ESLint)

format:
  needs: [install]
  # runs pnpm format:check (Prettier)

build:
  needs: [install]
  # runs pnpm build, uploads dist/ artifact

typecheck:
  needs: [build]
  # downloads build artifact, runs pnpm typecheck (needs dist/ for cross-package types)

# Layer 3: Verify + Test (needs build)
pkg-verify:
  needs: [build]
  # downloads build artifact, runs publint + attw on 4 packages

test:
  needs: [build]
  strategy:
    matrix:
      node-version: [20, 22]
  # downloads build artifact, runs pnpm test:coverage
  # uploads coverage artifact (node 22 only)

# Layer 4: Coverage report (needs test, PR only)
coverage:
  needs: [test]
  if: github.event_name == 'pull_request'
  # downloads coverage artifact, posts PR comment via vitest-coverage-report-action
```

### Pattern 2: Changesets Fixed Group Versioning
**What:** All 4 `@lsp-indexer/*` packages always share the same version number.
**When to use:** When any package changes — all get bumped together.

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "chillwhales/lsp-indexer" }],
  "commit": false,
  "fixed": [["@lsp-indexer/types", "@lsp-indexer/node", "@lsp-indexer/react", "@lsp-indexer/next"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "privatePackages": {
    "version": false,
    "tag": false
  }
}
```

**Key config decisions:**
- `fixed`: Array containing one group of all 4 packages — they always version together
- `access: "public"`: Scoped packages default to restricted; this ensures public publish
- `baseBranch: "main"`: Changesets compares against main branch
- `privatePackages.version: false`: Private packages (indexer, abi, typeorm, test app) are not versioned
- `changelog`: GitHub-linked changelog with PR references

### Pattern 3: Changeset Enforcement (Blocking for Publishable Changes)
**What:** PRs that modify publishable package code MUST include a changeset file.
**When to use:** CI check on every PR.

```yaml
changeset-check:
  name: Changeset Check
  if: github.event_name == 'pull_request'
  needs: [install]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Full history for changeset comparison
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - name: Require changeset for package changes
      run: pnpm changeset status --since=origin/main
```

**Behavior:** `changeset status --since=origin/main` exits non-zero if packages changed but no changeset exists. For PRs that only touch CI, docs, or non-publishable code (indexer, test app), no changeset is needed — the command passes because no publishable packages changed.

### Pattern 4: Release Workflow with Docker
**What:** Single release trigger that publishes npm packages AND builds+pushes Docker image.
**When to use:** On push to main (after merging a Version PR).

```yaml
name: Release
on:
  push:
    branches: [main]
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false  # CRITICAL: never cancel releases

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      packages: write  # For GHCR Docker push
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Create Release PR or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          commit: "chore: version packages"
          title: "chore: version packages"
          publish: pnpm ci:publish
          version: pnpm changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      # Docker image — only when packages were actually published
      - name: Login to GHCR
        if: steps.changesets.outputs.published == 'true'
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        if: steps.changesets.outputs.published == 'true'
        uses: docker/build-push-action@v6
        with:
          context: .
          file: docker/Dockerfile
          push: true
          tags: |
            ghcr.io/chillwhales/lsp-indexer:latest
            ghcr.io/chillwhales/lsp-indexer:${{ steps.changesets.outputs.publishedPackages && fromJSON(steps.changesets.outputs.publishedPackages)[0].version || github.sha }}
```

### Pattern 5: Preview Releases
**What:** Every PR gets preview npm packages installable via `@pr.123` dist-tag.
**When to use:** Automatically on every PR to main.

```yaml
name: Preview Release
on:
  pull_request:
    branches: [main]
jobs:
  preview:
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpx pkg-pr-new publish './packages/types' './packages/node' './packages/react' './packages/next' --compact --comment=update --packageManager=pnpm
```

**Note:** Only publish the 4 publishable packages, not indexer/abi/typeorm/test.

### Pattern 6: Reusable Workflows in chillwhales/.github
**What:** Org-wide reusable workflows that both lsp-indexer and LSPs can consume.
**When to use:** After lsp-indexer CI is working, extract common patterns.

```
chillwhales/.github/
├── .github/
│   └── workflows/
│       ├── ci-build-lint-test.yml     # Reusable: install, lint, format, build, typecheck, test
│       ├── ci-quality.yml             # Reusable: publint, attw, sherif, knip, madge (optional)
│       └── ci-publish-validation.yml  # Reusable: changeset check, preview releases
│   └── actions/
│       ├── setup-pnpm/
│       │   └── action.yml             # Composite: checkout + pnpm + node + install
│       └── build-artifacts/
│           └── action.yml             # Composite: build + upload artifact
```

**Reusable workflow calling pattern:**
```yaml
# In chillwhales/lsp-indexer/.github/workflows/ci.yml
jobs:
  build-lint-test:
    uses: chillwhales/.github/.github/workflows/ci-build-lint-test.yml@main
    with:
      node-version: 22
      build-command: pnpm build
      lint-command: pnpm lint
      format-command: pnpm format:check
      test-command: pnpm test:coverage
```

**Reusable workflow definition:**
```yaml
# In chillwhales/.github/.github/workflows/ci-build-lint-test.yml
name: Build, Lint & Test
on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: number
        default: 22
      build-command:
        required: true
        type: string
      lint-command:
        required: false
        type: string
      format-command:
        required: false
        type: string
      test-command:
        required: false
        type: string
```

### Anti-Patterns to Avoid
- **Duplicating install steps across every job:** Use the pnpm cache mechanism via `actions/setup-node` with `cache: pnpm`. Each job still runs `pnpm install --frozen-lockfile` but it resolves from cache in <5s.
- **Running typecheck before build:** Cross-package type resolution requires dist/ output from dependencies. Always build first, then typecheck.
- **cancel-in-progress on release workflows:** Never cancel a release mid-flight — partial publishes are dangerous and hard to fix. Only use `cancel-in-progress: true` on CI workflows.
- **Publishing all workspace packages with pkg-pr-new:** Only publish the 4 publishable `@lsp-indexer/*` packages — not indexer, abi, typeorm, comparison-tool, or test app.
- **Using `pnpm changeset status` without `--since`:** Without `--since=origin/main`, it checks all unreleased changesets rather than just changes in the current PR.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version management | Custom version scripts | `@changesets/cli` with `fixed` config | Handles fixed versioning, changelog generation, workspace dependency updates, npm publish coordination |
| PR coverage comments | Custom coverage parsing script | `davelosert/vitest-coverage-report-action@v2` | Handles JSON parsing, PR comment upsert, threshold checking, trend indicators |
| Preview releases | Custom npm publish scripts | `pkg-pr-new` via pnpx | Handles PR-tagged npm publishes, comment updates, dist-tag cleanup |
| Docker build caching | Manual docker build/push commands | `docker/build-push-action@v6` | Handles buildx, layer caching, multi-platform support, proper tagging |
| GHCR authentication | Manual docker login | `docker/login-action@v3` | Handles GITHUB_TOKEN, proper credential scoping, logout on completion |
| Changeset changelog formatting | Custom changelog template | `@changesets/changelog-github` | Adds PR links, author attribution, commit references automatically |
| Setup steps (checkout + pnpm + node + install) | Copy-paste in every job | Composite action in `chillwhales/.github` | Single source of truth, version pinning, cache configuration |

**Key insight:** Every CI/CD component has a battle-tested solution. The value of this phase is **integration and configuration**, not building new tooling.

## Common Pitfalls

### Pitfall 1: Changeset Status False Positives on Non-Publishable Changes
**What goes wrong:** `pnpm changeset status --since=origin/main` fails on PRs that only change CI/docs/indexer because it still sees "changed packages" (even private ones).
**Why it happens:** Changesets considers all workspace packages by default, including private ones.
**How to avoid:** Configure `privatePackages: { version: false, tag: false }` in `.changeset/config.json`. Also consider using `ignore` for non-publishable packages if issues persist. Alternatively, make the changeset-check job `continue-on-error: true` with a separate status check, or filter by path changes.
**Warning signs:** CI blocks on PRs that only touch `.github/`, `docker/`, or `packages/indexer/`.

### Pitfall 2: Build Artifacts Not Available for Typecheck/Verify
**What goes wrong:** Typecheck fails because cross-package type declarations (`.d.ts` files in `dist/`) aren't available. Package verification fails because `publint`/`attw` need built output.
**Why it happens:** Artifacts aren't shared between jobs unless explicitly uploaded/downloaded.
**How to avoid:** Build job uploads `packages/*/dist` artifact. Downstream jobs (typecheck, pkg-verify, test) download it. Match the LSPs pattern exactly.
**Warning signs:** "Cannot find module" errors in typecheck, "no dist/ found" in publint.

### Pitfall 3: Docker Image Version Mismatch
**What goes wrong:** Docker image tag doesn't match the npm package version.
**Why it happens:** Need to extract the version from changesets output after publish.
**How to avoid:** The `changesets/action` outputs `publishedPackages` (JSON array). Parse the version from the first published package. Use that version as the Docker tag.
**Warning signs:** Docker image tagged `latest` only, or manual version entry.

### Pitfall 4: Concurrency Race Conditions on Release
**What goes wrong:** Two pushes to main in quick succession trigger two release workflows that conflict.
**Why it happens:** Default concurrency allows parallel runs.
**How to avoid:** Set `cancel-in-progress: false` on the release workflow with a fixed concurrency group. The second run waits for the first to finish.
**Warning signs:** Partial npm publishes, duplicate GitHub releases.

### Pitfall 5: Missing Test Infrastructure for Publishable Packages
**What goes wrong:** Coverage reporting fails because the 4 publishable packages have no tests.
**Why it happens:** Tests currently only exist in `packages/indexer/`. The publishable packages (`types`, `node`, `react`, `next`) have no test files or vitest config.
**How to avoid:** Add vitest config and at least smoke tests for each publishable package before configuring coverage thresholds. The 80% threshold can only be enforced once tests exist.
**Warning signs:** Coverage report shows 0% for all 4 packages, or coverage step fails with "no coverage data".

### Pitfall 6: Reusable Workflow Secrets Access
**What goes wrong:** Reusable workflows in `chillwhales/.github` can't access `NPM_TOKEN` or other secrets.
**Why it happens:** Secrets don't automatically propagate to reusable workflows from another repo.
**How to avoid:** Use `secrets: inherit` in the caller workflow (works within the same org), or explicitly pass required secrets via `secrets:` keyword.
**Warning signs:** "Resource not accessible by integration" or empty secret values.

### Pitfall 7: pkg-pr-new Glob Path Must Match Publishable Packages Only
**What goes wrong:** Preview release publishes private/internal packages (indexer, abi, typeorm).
**Why it happens:** Using `'./packages/*'` glob publishes all workspace packages.
**How to avoid:** Explicitly list only publishable packages: `'./packages/types' './packages/node' './packages/react' './packages/next'`.
**Warning signs:** Preview comment shows `@chillwhales/indexer` or `@chillwhales/typeorm` previews.

## Code Examples

### Changesets Config (Verified via official docs)
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "chillwhales/lsp-indexer" }],
  "commit": false,
  "fixed": [["@lsp-indexer/types", "@lsp-indexer/node", "@lsp-indexer/react", "@lsp-indexer/next"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "privatePackages": {
    "version": false,
    "tag": false
  }
}
```

### Root package.json Scripts (for CI)
```json
{
  "scripts": {
    "changeset": "changeset",
    "ci:publish": "changeset publish",
    "test:coverage": "vitest run --coverage",
    "typecheck": "pnpm -r --filter './packages/types' --filter './packages/node' --filter './packages/react' --filter './packages/next' exec tsc --noEmit"
  }
}
```

### Vitest Workspace Coverage Config
```typescript
// vitest.config.ts (root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

### Docker Version Extraction from Changesets Output
```yaml
- name: Extract version tag
  if: steps.changesets.outputs.published == 'true'
  id: version
  run: |
    VERSION=$(echo '${{ steps.changesets.outputs.publishedPackages }}' | jq -r '.[0].version')
    echo "tag=v${VERSION}" >> $GITHUB_OUTPUT

- name: Build and push Docker image
  if: steps.changesets.outputs.published == 'true'
  uses: docker/build-push-action@v6
  with:
    context: .
    file: docker/Dockerfile
    push: true
    tags: |
      ghcr.io/chillwhales/lsp-indexer:latest
      ghcr.io/chillwhales/lsp-indexer:${{ steps.version.outputs.tag }}
    labels: |
      org.opencontainers.image.source=https://github.com/chillwhales/lsp-indexer
      org.opencontainers.image.description=LUKSO blockchain indexer
      org.opencontainers.image.licenses=MIT
```

### Composite Action: Setup PNPM
```yaml
# chillwhales/.github/.github/actions/setup-pnpm/action.yml
name: 'Setup PNPM'
description: 'Checkout, setup pnpm, setup node, install dependencies'
inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '22'
  fetch-depth:
    description: 'Git fetch depth'
    required: false
    default: '1'
runs:
  using: 'composite'
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: ${{ inputs.fetch-depth }}
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: pnpm
    - run: pnpm install --frozen-lockfile
      shell: bash
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual npm publish | Changesets automated publish via GitHub Actions | Stable since 2022 | Zero-touch releases after merging Version PR |
| npm link for local testing | pkg-pr-new preview releases on PRs | Mainstream 2024-2025 | Install preview directly from npm registry, test in real projects |
| Copy-paste workflows | GitHub reusable workflows (`workflow_call`) | GA since 2022 | Org-wide workflow consistency, single source of truth |
| Docker Hub | GitHub Container Registry (GHCR) | GHCR GA 2021 | Free for public repos, GITHUB_TOKEN auth, no separate credentials |
| Custom coverage scripts | vitest-coverage-report-action@v2 | v2 stable 2024 | PR comments with summary tables, file-level details, thresholds |
| `lerna` / `semantic-release` | `@changesets/cli` | Dominant since 2023 | Explicit changeset files, developer-controlled versioning, monorepo-native |

**Deprecated/outdated:**
- Lerna for version management: mostly replaced by changesets in the JS ecosystem
- Docker Hub for OSS: GHCR is preferred for GitHub-hosted projects (free, integrated auth)
- `npm version` + manual publish: replaced by changesets automated workflow

## Open Questions

1. **Test infrastructure for publishable packages**
   - What we know: Only `packages/indexer` has tests. The 4 publishable packages have zero test files.
   - What's unclear: Whether tests should be added in this phase or assumed as pre-existing from a prior effort.
   - Recommendation: Add minimal smoke tests (import + basic assertion) for each publishable package as part of CI setup. Full test coverage is out of scope for this phase but the infrastructure (vitest config, coverage reporter) should be established.

2. **Changeset enforcement strictness**
   - What we know: User wants blocking for publishable changes, non-blocking for non-publishable.
   - What's unclear: `pnpm changeset status --since=origin/main` may not perfectly distinguish publishable vs non-publishable changes if a PR touches both.
   - Recommendation: Use `pnpm changeset status --since=origin/main` which only checks packages that have changed. Since private packages (`@chillwhales/*`) have `privatePackages.version: false`, they are excluded from the check. This should work correctly out of the box.

3. **Docker image version extraction**
   - What we know: `changesets/action` outputs `publishedPackages` as JSON.
   - What's unclear: Exact output format when using `fixed` group versioning — does it list all 4 packages or just one?
   - Recommendation: Parse with `jq -r '.[0].version'` — all packages in a fixed group share the same version, so the first entry suffices.

4. **chillwhales/.github repo creation**
   - What we know: This is an org-level repo that needs to be created on GitHub.
   - What's unclear: Whether the developer has admin access to create repos in the chillwhales org.
   - Recommendation: Document the repo creation as a manual prerequisite. The phase implementation creates the workflow files; repo creation is a one-time org admin task.

## Recommendations (Claude's Discretion Areas)

### Docker Registry: GHCR
**Recommendation:** Use GitHub Container Registry (ghcr.io).
**Rationale:** Free for public repos, uses GITHUB_TOKEN (no extra secrets), integrated with GitHub packages UI, org-scoped namespace (`ghcr.io/chillwhales/lsp-indexer`).

### Coverage Reporting: vitest-coverage-report-action@v2
**Recommendation:** Use `davelosert/vitest-coverage-report-action@v2` (same as LSPs).
**Rationale:** Reads vitest JSON output directly, posts PR comments with summary tables, supports thresholds, file-level coverage diffs. 249 stars, v2.9.3 (Feb 2026), actively maintained.

### CI Matrix: Node 20 + 22
**Recommendation:** Test on Node 20 and 22 (matching existing ci.yml matrix).
**Rationale:** Node 20 is LTS (supported until 2026-04), Node 22 is current LTS. Coverage report only from Node 22 run.

### Composite vs Reusable Workflow Boundaries
**Recommendation:**
- **Composite actions** for repeated step sequences within a single job: setup-pnpm (checkout + pnpm + node + install), build-artifacts (build + upload).
- **Reusable workflows** for complete job graphs: ci-build-lint-test (the full layered CI), ci-publish-validation (changeset check + preview).
**Rationale:** Composite actions are called within a job step. Reusable workflows replace entire job definitions. The setup steps are intra-job; the CI layers are inter-job dependencies.

### Changeset Bot Configuration
**Recommendation:** Use the built-in `pnpm changeset status --since=origin/main` in CI rather than installing a separate changeset bot app.
**Rationale:** Simpler, no GitHub App to install, already the pattern in LSPs. The status command exits non-zero if publishable packages changed without a changeset.

## Sources

### Primary (HIGH confidence)
- `chillwhales/LSPs` ci.yml, release.yml, preview.yml — fetched from GitHub raw (verified working patterns)
- `chillwhales/LSPs` .changeset/config.json — fetched from GitHub raw (verified config)
- `chillwhales/LSPs` package.json — fetched from GitHub raw (verified scripts)
- GitHub Docs: Reusing workflows — https://docs.github.com/en/actions/sharing-automations/reusing-workflows
- GitHub Docs: Creating composite actions — https://docs.github.com/en/actions/creating-actions/creating-a-composite-action
- GitHub Docs: Container registry — https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- Changesets config docs — https://github.com/changesets/changesets/blob/main/docs/config-file-options.md
- vitest-coverage-report-action — https://github.com/davelosert/vitest-coverage-report-action (v2.9.3, Feb 2026)

### Secondary (MEDIUM confidence)
- Existing lsp-indexer ci.yml — verified from local filesystem (recently created, working)
- Existing Docker setup — verified Dockerfile and docker-compose.yml from local filesystem
- Package.json configurations — verified all 4 publishable package.json files

### Tertiary (LOW confidence)
- None — all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools directly observed in the working LSPs reference implementation
- Architecture: HIGH — CI patterns copied from working LSPs workflows with adaptations for lsp-indexer's structure
- Pitfalls: HIGH — derived from actual implementation differences between LSPs and lsp-indexer (private packages, Docker image, test infrastructure gaps)

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain — CI/CD patterns change slowly)
