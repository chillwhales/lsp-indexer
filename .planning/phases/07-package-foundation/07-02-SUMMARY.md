---
phase: 07-package-foundation
plan: 02
subsystem: react-test-app
tags: [next.js, test-app, entry-points, validation, workspace]
dependency-graph:
  requires: [07-01]
  provides: [test-app, entry-point-validation, workspace-apps-config]
  affects: [08-01, 08-02, 09-01]
tech-stack:
  added: ['next@15.5.12', 'react@19', 'react-dom@19', '@tanstack/react-query@5']
  patterns: [consumer-owned-queryclient, server-client-entry-separation, monorepo-workspace-app]
key-files:
  created:
    - apps/test/package.json
    - apps/test/tsconfig.json
    - apps/test/next.config.ts
    - apps/test/.env.local.example
    - apps/test/.gitignore
    - apps/test/next-env.d.ts
    - apps/test/src/app/layout.tsx
    - apps/test/src/app/page.tsx
    - apps/test/src/app/providers.tsx
    - apps/test/src/components/nav.tsx
    - apps/test/src/components/connection-status.tsx
  modified:
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - package.json
decisions:
  - id: D-0702-01
    decision: 'Use React.ReactNode return types instead of JSX.Element for React 19 compatibility'
    rationale: 'React 19 removes the global JSX namespace. Components must use React.ReactNode or React.JSX.Element instead of bare JSX.Element.'
  - id: D-0702-02
    decision: 'Add outputFileTracingRoot to next.config.ts for monorepo support'
    rationale: 'Next.js detected multiple lockfiles and inferred incorrect workspace root. Setting outputFileTracingRoot resolves the warning.'
metrics:
  duration: '~7 minutes'
  completed: '2026-02-17'
---

# Phase 7 Plan 02: Next.js Test App + End-to-End Validation Summary

**One-liner:** Next.js 15 test app at `apps/test` validating all 3 @lsp-indexer/react entry points (client, server, types) with zero build errors — consumer-owned QueryClientProvider pattern, server+client component imports, and navigation scaffold for Phase 8+ domain playgrounds.

## What Was Done

### Task 1: Update workspace config, create Next.js test app shell

- Updated `pnpm-workspace.yaml` to include `apps/*` alongside `packages/*`
- Created `apps/test/` with full Next.js 15 App Router structure
- Configured `next.config.ts` with `transpilePackages` for workspace package and `outputFileTracingRoot` for monorepo
- Created `providers.tsx` with consumer-owned `QueryClientProvider` (per CONTEXT.md — no IndexerProvider)
- Created `layout.tsx` root layout with 2-column sidebar + content area
- Created `page.tsx` server component importing from all 3 entry points: `@lsp-indexer/react`, `@lsp-indexer/react/server`, `@lsp-indexer/react/types`
- Created `nav.tsx` navigation sidebar with links for 10 domain playgrounds (Home active, rest "Coming Soon")
- Created `.env.local.example` documenting all 4 env vars (HTTP + WebSocket, public + private)

### Task 2: Build verification — next build, import validation, bundle check

- Created `connection-status.tsx` client component validating `@lsp-indexer/react` import works in client context
- Updated `page.tsx` to include `ConnectionStatus` client component alongside server-side checks
- Fixed React 19 compatibility: `JSX.Element` → `React.ReactNode` return types across all components
- Added `build:all` root-level script chaining react package build → test app build
- **`next build` succeeds with zero errors** — all routes compiled, static pages generated

## Task Commits

| Task | Name                                                | Commit  | Key Files                                                   |
| ---- | --------------------------------------------------- | ------- | ----------------------------------------------------------- |
| 1    | Create Next.js test app shell with workspace config | 45b3ad2 | pnpm-workspace.yaml, apps/test/\*, package.json             |
| 2    | Build verification — next build + import validation | 11ce625 | connection-status.tsx, page.tsx, layout.tsx, next.config.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JSX.Element not available in React 19**

- **Found during:** Task 2
- **Issue:** React 19 (used by Next.js 15) removes the global `JSX` namespace. All components using `JSX.Element` as return type failed type checking with "Cannot find namespace 'JSX'".
- **Fix:** Changed all component return types from `JSX.Element` to `React.ReactNode` and added explicit `React` imports where needed.
- **Files modified:** `layout.tsx`, `page.tsx`, `providers.tsx`, `nav.tsx`, `connection-status.tsx`
- **Commit:** 11ce625

**2. [Rule 3 - Blocking] Next.js workspace root inference warning**

- **Found during:** Task 2
- **Issue:** Next.js detected multiple lockfiles (`/home/coder/pnpm-lock.yaml` and `/home/coder/lsp-indexer/pnpm-lock.yaml`) and inferred incorrect workspace root.
- **Fix:** Added `outputFileTracingRoot: resolve(import.meta.dirname, '../../')` to `next.config.ts` to explicitly set monorepo root.
- **Files modified:** `apps/test/next.config.ts`
- **Commit:** 11ce625

## Decisions Made

| ID        | Decision                                            | Rationale                                          |
| --------- | --------------------------------------------------- | -------------------------------------------------- |
| D-0702-01 | React.ReactNode return types instead of JSX.Element | React 19 removes global JSX namespace              |
| D-0702-02 | outputFileTracingRoot in next.config.ts             | Resolves Next.js monorepo workspace root detection |

## Verification Results

| Check                                                            | Result |
| ---------------------------------------------------------------- | ------ |
| `pnpm --filter test build` exits 0                               | PASS   |
| Build output: `/ (server)` route compiled                        | PASS   |
| `apps/test/.next/` build output exists                           | PASS   |
| page.tsx imports from `@lsp-indexer/react` (main entry)          | PASS   |
| page.tsx imports from `@lsp-indexer/react/server` (server)       | PASS   |
| page.tsx imports from `@lsp-indexer/react/types` (types)         | PASS   |
| connection-status.tsx imports from `@lsp-indexer/react` (client) | PASS   |
| pnpm-workspace.yaml includes `apps/*`                            | PASS   |
| .env.local.example documents all 4 env vars                      | PASS   |
| providers.tsx uses consumer-owned QueryClientProvider            | PASS   |
| Nav scaffold has 10 domain playground links                      | PASS   |

## Phase 7 Requirements — Full Validation

With Plan 01 + Plan 02 complete, all Phase 7 requirements are validated:

| ID       | Requirement                                        | Status |
| -------- | -------------------------------------------------- | ------ |
| FOUND-01 | ESM+CJS+DTS builds with "use client"               | ✓      |
| FOUND-02 | Codegen pipeline from Hasura/local schema          | ✓      |
| FOUND-03 | Env var config (HTTP + WS, public + private)       | ✓      |
| FOUND-04 | Consumer-provided QueryClient (no IndexerProvider) | ✓      |
| FOUND-05 | IndexerError with 5 categories, 17 codes           | ✓      |
| FOUND-06 | 3 entry points without bundle contamination        | ✓      |
| FOUND-07 | Next.js test app validates all entry points        | ✓      |

## Next Phase Readiness

- **Blockers:** None
- **Ready for:** Phase 8 (First Vertical Slice — Universal Profiles)
- **Test app ready to receive domain playground pages** — just add `app/profiles/page.tsx`, etc.
- **Note:** Phase 8 will need a live Hasura endpoint for codegen introspection to get full query/filter types. The test app has `.env.local.example` ready for developer setup.

## Self-Check: PASSED
