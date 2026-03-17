# S11: Package Foundation

**Goal:** Create the `packages/react` package with working ESM+CJS+DTS builds, GraphQL codegen pipeline, `IndexerError` class with industry-standard error taxonomy, typed GraphQL fetch wrapper, and env-based URL configuration — validated by publint and arethetypeswrong.
**Demo:** Create the `packages/react` package with working ESM+CJS+DTS builds, GraphQL codegen pipeline, `IndexerError` class with industry-standard error taxonomy, typed GraphQL fetch wrapper, and env-based URL configuration — validated by publint and arethetypeswrong.

## Must-Haves


## Tasks

- [x] **T01: 07-package-foundation 01**
  - Create the `packages/react` package with working ESM+CJS+DTS builds, GraphQL codegen pipeline, `IndexerError` class with industry-standard error taxonomy, typed GraphQL fetch wrapper, and env-based URL configuration — validated by publint and arethetypeswrong.

Purpose: This is the foundation for all v1.1 hooks. Every future domain hook (Phase 8–11) depends on these build tools, codegen types, error handling, and client utilities.

Output: A buildable, validatable `@lsp-indexer/react` package with correct exports for `.`, `./server`, and `./types` entry points.
- [x] **T02: 07-package-foundation 02**
  - Create a minimal Next.js test app (`apps/test`) that validates all 3 package entry points work correctly in a real framework context — catching bundle contamination, export resolution issues, and "use client" problems that unit tests cannot detect.

Purpose: The test app is the final validation layer for Phase 7. If `next build` succeeds with imports from all 3 entry points, the package foundation is solid. This app also serves as the dev playground for testing hooks in Phase 8+.

Output: A working Next.js 15 app that imports from `@lsp-indexer/react`, `@lsp-indexer/react/server`, and `@lsp-indexer/react/types` — validated by a successful `next build`.

## Files Likely Touched

- `packages/react/package.json`
- `packages/react/tsconfig.json`
- `packages/react/tsup.config.ts`
- `packages/react/codegen.ts`
- `packages/react/src/index.ts`
- `packages/react/src/server.ts`
- `packages/react/src/types.ts`
- `packages/react/src/documents/_placeholder.ts`
- `packages/react/src/graphql/ (generated)`
- `packages/react/src/errors/indexer-error.ts`
- `packages/react/src/errors/index.ts`
- `packages/react/src/client/env.ts`
- `packages/react/src/client/execute.ts`
- `packages/react/src/client/index.ts`
- `package.json (root — add convenience scripts)`
- `pnpm-workspace.yaml`
- `apps/test/package.json`
- `apps/test/tsconfig.json`
- `apps/test/next.config.ts`
- `apps/test/.env.local.example`
- `apps/test/src/app/layout.tsx`
- `apps/test/src/app/page.tsx`
- `apps/test/src/app/providers.tsx`
- `apps/test/src/components/nav.tsx`
- `apps/test/src/components/connection-status.tsx`
