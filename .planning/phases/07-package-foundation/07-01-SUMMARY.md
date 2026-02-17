---
phase: 07-package-foundation
plan: 01
subsystem: react-package
tags: [react, tsup, codegen, graphql, error-handling, package-exports]
dependency-graph:
  requires: []
  provides:
    [package-scaffold, codegen-pipeline, indexer-error, execute-function, env-helpers, entry-points]
  affects: [07-02, 08-01, 08-02]
tech-stack:
  added:
    [
      tsup@8.5.1,
      '@graphql-codegen/cli@6.1.1',
      '@graphql-codegen/client-preset@5.2.2',
      graphql-ws@6.0.0,
      '@graphql-typed-document-node/core@3.2.0',
    ]
  patterns:
    [
      multi-entry-esm-cjs-dts,
      graphql-codegen-client-preset,
      typed-fetch-wrapper,
      error-category-taxonomy,
    ]
key-files:
  created:
    - packages/react/package.json
    - packages/react/tsconfig.json
    - packages/react/tsup.config.ts
    - packages/react/codegen.ts
    - packages/react/schema.graphql
    - packages/react/src/index.ts
    - packages/react/src/server.ts
    - packages/react/src/types.ts
    - packages/react/src/documents/_placeholder.ts
    - packages/react/src/graphql/graphql.ts
    - packages/react/src/graphql/gql.ts
    - packages/react/src/graphql/fragment-masking.ts
    - packages/react/src/graphql/index.ts
    - packages/react/src/errors/indexer-error.ts
    - packages/react/src/errors/index.ts
    - packages/react/src/client/execute.ts
    - packages/react/src/client/env.ts
    - packages/react/src/client/index.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - eslint.config.ts
decisions:
  - id: D-0701-01
    decision: 'Use local schema.graphql with scalar definitions instead of typeorm/schema.graphql for codegen fallback'
    rationale: 'Subsquid schema uses custom directives (@entity, @index, @derivedFrom) and scalars (DateTime, BigInt) not parseable by standard GraphQL. Minimal local schema provides enough structure for codegen.'
  - id: D-0701-02
    decision: 'Split exports conditions into import/require sub-objects with separate .d.ts/.d.cts types'
    rationale: 'publint flagged that a shared types field is interpreted as ESM when resolving with require condition. Splitting ensures correct CJS type resolution.'
  - id: D-0701-03
    decision: 'Add typesVersions for node10 module resolution fallback'
    rationale: 'arethetypeswrong reported resolution failures for /server and /types subpaths under node10. typesVersions provides the legacy fallback.'
  - id: D-0701-04
    decision: "Disable treeshake on tsup entries to preserve 'use client' banner"
    rationale: "Rollup treeshake strips module-level directives. Without treeshake, esbuild's banner option correctly prepends 'use client' to output."
  - id: D-0701-05
    decision: 'Add ESLint ignores for tsup.config.ts and codegen.ts globally'
    rationale: 'Config files at package root are outside tsconfig include paths, causing type-checked ESLint rules to fail with parsing errors.'
metrics:
  duration: '~11 minutes'
  completed: '2026-02-17'
---

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
