---
id: S11
parent: M001
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 
verification_result: passed
completed_at: 
blocker_discovered: false
---
# S11: Package Foundation

**# Phase 7 Plan 01: React Package Scaffold, Codegen, Error Handling, Client Utilities Summary**

## What Happened

# Phase 7 Plan 01: React Package Scaffold, Codegen, Error Handling, Client Utilities Summary

**One-liner:** Publishable @lsp-indexer/react package with ESM+CJS+DTS builds via tsup, GraphQL codegen pipeline with local schema fallback, IndexerError class with 5-category/17-code taxonomy, typed fetch wrapper, and zero errors from publint + arethetypeswrong.

## What Was Done

### Task 1: Package scaffold, config files, codegen pipeline, initial build

- Created `packages/react` with full package.json (3 entry points, peer deps, scripts)
- Configured tsup for 3 entries: index (with "use client"), server (no banner), types
- Set up GraphQL codegen with dual schema source (Hasura introspection / local fallback)
- Created minimal `schema.graphql` with scalar definitions for local codegen
- Generated TypeScript types in `src/graphql/` with `TypedDocumentString`
- Added root convenience scripts: `codegen`, `dev:test`, `build:react`

### Task 2: IndexerError class, env var helpers, typed execute function

- Built `IndexerError` class with 5 categories (NETWORK, HTTP, GRAPHQL, CONFIGURATION, PARSE) and 17 error codes
- Three factory methods: `fromHttpResponse()`, `fromGraphQLErrors()`, `fromNetworkError()`
- `toJSON()` for serializable server-side logging
- Env helpers: `getClientUrl()`, `getServerUrl()`, `getClientWsUrl()`, `getServerWsUrl()` — all throw IndexerError with helpful messages
- Typed `execute()` function using `TypedDocumentString` for full type inference on results and variables

### Task 3: Wire entry points, rebuild, validate

- Wired `src/index.ts` with client exports (IndexerError, execute, getClientUrl, getClientWsUrl)
- Wired `src/server.ts` with server exports (IndexerError, execute, getServerUrl, getServerWsUrl)
- Wired `src/types.ts` with pure type re-exports only
- Fixed exports map: split types conditions for ESM/CJS (publint fix)
- Added `typesVersions` for node10 resolution (arethetypeswrong fix)
- Updated ESLint: ignore codegen output, config files, add apps/\* tsconfig path

## Task Commits

| Task | Name                                             | Commit  | Key Files                                                             |
| ---- | ------------------------------------------------ | ------- | --------------------------------------------------------------------- |
| 1    | Package scaffold, config files, codegen pipeline | 08b83c1 | package.json, tsconfig.json, tsup.config.ts, codegen.ts, src/graphql/ |
| 2    | IndexerError, env helpers, execute function      | 259090d | errors/indexer-error.ts, client/execute.ts, client/env.ts             |
| 3    | Wire entry points, validate publint + attw       | 68a3743 | src/index.ts, src/server.ts, src/types.ts, eslint.config.ts           |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Local schema fallback required scalar definitions**

- **Found during:** Task 1
- **Issue:** `packages/typeorm/schema.graphql` uses Subsquid-specific directives (@entity, @index, @derivedFrom) and scalars (DateTime, BigInt) that are not valid standard GraphQL. Codegen failed with "Unknown type: DateTime".
- **Fix:** Created `packages/react/schema.graphql` — a minimal valid GraphQL schema with scalar definitions and a placeholder Query type. Codegen uses this for local development, Hasura introspection for full types.
- **Files created:** `packages/react/schema.graphql`
- **Commit:** 08b83c1

**2. [Rule 3 - Blocking] Missing @graphql-typed-document-node/core dependency**

- **Found during:** Task 2
- **Issue:** Codegen output imports from `@graphql-typed-document-node/core` which wasn't listed as a dev dependency. TypeScript type checking failed.
- **Fix:** Added `@graphql-typed-document-node/core` as devDependency.
- **Files modified:** `packages/react/package.json`
- **Commit:** 259090d

**3. [Rule 1 - Bug] Rollup treeshake strips "use client" banner**

- **Found during:** Task 3
- **Issue:** With `treeshake: true`, tsup uses rollup post-processing which strips module-level directives including the `"use client"` banner.
- **Fix:** Removed `treeshake: true` from tsup config entries. The package is small enough that treeshaking is unnecessary, and the banner is correctly preserved by esbuild.
- **Files modified:** `packages/react/tsup.config.ts`
- **Commit:** 68a3743

**4. [Rule 1 - Bug] publint warned about shared types condition in exports map**

- **Found during:** Task 3
- **Issue:** Using `"types": "./dist/index.d.ts"` at the top level of each export was interpreted as ESM when resolving with the `require` condition.
- **Fix:** Split each export into `import: { types, default }` and `require: { types, default }` sub-objects, with `.d.ts` for ESM and `.d.cts` for CJS.
- **Files modified:** `packages/react/package.json`
- **Commit:** 68a3743

**5. [Rule 1 - Bug] arethetypeswrong failed on node10 subpath resolution**

- **Found during:** Task 3
- **Issue:** node10 module resolution doesn't support the `exports` map, so `@lsp-indexer/react/server` and `@lsp-indexer/react/types` couldn't be resolved.
- **Fix:** Added `typesVersions` field to package.json mapping subpaths to dist files.
- **Files modified:** `packages/react/package.json`
- **Commit:** 68a3743

## Decisions Made

| ID        | Decision                                                          | Rationale                                         |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| D-0701-01 | Local schema.graphql with scalar definitions for codegen fallback | Subsquid schema not parseable by standard GraphQL |
| D-0701-02 | Split exports conditions into import/require sub-objects          | publint fix for CJS type resolution               |
| D-0701-03 | typesVersions for node10 fallback                                 | arethetypeswrong fix for legacy resolution        |
| D-0701-04 | Disable treeshake to preserve "use client" banner                 | Rollup strips module-level directives             |
| D-0701-05 | ESLint ignores for tsup.config.ts/codegen.ts                      | Config files outside tsconfig include path        |

## Verification Results

| Check                                                     | Result             |
| --------------------------------------------------------- | ------------------ |
| `pnpm --filter @lsp-indexer/react build`                  | PASS               |
| `pnpm --filter @lsp-indexer/react typecheck`              | PASS               |
| `npx publint`                                             | PASS (zero errors) |
| `npx @arethetypeswrong/cli --pack .`                      | PASS (all green)   |
| "use client" on index.js                                  | PASS               |
| "use client" absent from server.js                        | PASS               |
| IndexerError: 5 categories, 17 codes, 3 factories, toJSON | PASS               |
| Env helpers throw IndexerError on missing vars            | PASS               |
| ESLint on react package                                   | PASS (zero errors) |

## Next Phase Readiness

- **Blockers:** None
- **Ready for:** 07-02 (Next.js test app), Phase 8 (domain hooks)
- **Note:** Full Hasura types (filters, aggregates, ordering) require introspection from live Hasura endpoint. The local schema fallback only provides base scalar types. Phase 8 codegen should use `HASURA_GRAPHQL_ENDPOINT` for complete type generation.

## Self-Check: PASSED

# Phase 7 Plan 02: Next.js Test App + End-to-End Validation Summary

**One-liner:** Next.js 16 test app at `apps/test` validating all 3 @lsp-indexer/react entry points (client, server, types) with zero build errors — consumer-owned QueryClientProvider pattern, server+client component imports, and navigation scaffold for Phase 8+ domain playgrounds.

## What Was Done

### Task 1: Update workspace config, create Next.js test app shell

- Updated `pnpm-workspace.yaml` to include `apps/*` alongside `packages/*`
- Created `apps/test/` with full Next.js 16 App Router structure
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
- **Issue:** React 19 removes the global `JSX` namespace. All components using `JSX.Element` as return type failed type checking with "Cannot find namespace 'JSX'".
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
