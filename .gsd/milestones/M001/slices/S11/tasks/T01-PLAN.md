# T01: 07-package-foundation 01

**Slice:** S11 — **Milestone:** M001

## Description

Create the `packages/react` package with working ESM+CJS+DTS builds, GraphQL codegen pipeline, `IndexerError` class with industry-standard error taxonomy, typed GraphQL fetch wrapper, and env-based URL configuration — validated by publint and arethetypeswrong.

Purpose: This is the foundation for all v1.1 hooks. Every future domain hook (Phase 8–11) depends on these build tools, codegen types, error handling, and client utilities.

Output: A buildable, validatable `@lsp-indexer/react` package with correct exports for `.`, `./server`, and `./types` entry points.

## Must-Haves

- [ ] 'Developer can run `pnpm build` in packages/react and get dist/ with ESM (.js) + CJS (.cjs) + DTS (.d.ts) files for all 3 entry points'
- [ ] 'Developer can run `pnpm codegen` in packages/react and see TypeScript types generated in src/graphql/'
- [ ] 'Codegen runs automatically before build (pre-build hook)'
- [ ] 'Developer gets descriptive IndexerError with category/code/message when env vars are missing or invalid'
- [ ] 'Developer can call execute() with a TypedDocumentString and get typed results'
- [ ] 'Developer can run publint and arethetypeswrong against the built package with zero errors'

## Files

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
