# Phase 7: Package Foundation - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold a publishable React hooks package (`packages/react`) with working ESM+CJS+DTS builds, GraphQL codegen from Hasura schema, error handling, correct entry points (`@lsp-indexer/react`, `@lsp-indexer/react/server`, `@lsp-indexer/react/types`), and a minimal Next.js dev playground (`apps/test`) — before any domain-specific hooks exist.

</domain>

<decisions>
## Implementation Decisions

### Provider API design

- No `<IndexerProvider>` component — hooks call GraphQL directly using env vars
- Consumers must set up their own `QueryClientProvider` with TanStack Query — this package relies on an existing QueryClient, does not create one
- Documentation must make clear that `QueryClientProvider` is a prerequisite
- Environment variables:
  - `NEXT_PUBLIC_INDEXER_URL` — public HTTP GraphQL endpoint (client-side hooks)
  - `INDEXER_URL` — private HTTP GraphQL endpoint (server-side actions)
  - `NEXT_PUBLIC_INDEXER_WS_URL` — public WebSocket endpoint (client-side subscriptions, Phase 10)
  - `INDEXER_WS_URL` — private WebSocket endpoint (server-side, Phase 10)
- When a hook fires and the required env var is missing or malformed, throw immediately with a clear error message

### Error handling shape

- `IndexerError` with fine-grained subcategories (e.g., `NETWORK_TIMEOUT`, `NETWORK_UNREACHABLE`, `GRAPHQL_VALIDATION`, `PERMISSION_DENIED`)
- Error messages should be helpful with recovery hints (e.g., "PERMISSION_DENIED: missing x-hasura-role header. Check that your Hasura permissions allow this query.")
- Rich + serializable structure: `category`, `code`, `message`, `statusCode`, `originalError`, `query` (which GraphQL operation failed), plus `.toJSON()` for clean server logging
- Follow industry standards — align error structure with how established GraphQL client libraries (Apollo, urql) handle errors
- Hooks are thin wrappers: rename `data` to domain name (e.g., `digitalAsset`), pass all other TanStack Query props through as-is — no custom retry, no custom error handling layer on top

### Test app scope

- Dev playground — interactive pages for manually testing hooks during development
- Developer sets their own env vars: `NEXT_PUBLIC_INDEXER_URL`, `INDEXER_URL`, `NEXT_PUBLIC_INDEXER_WS_URL`, `INDEXER_WS_URL`
- Built gradually alongside hooks — Phase 7 creates the proper app structure and conventions, then each new hook gets a page added as part of its development in later phases
- Phase 7 delivers: app shell, proper structure, entry point import validation

### Codegen workflow

- Schema source: both introspect live Hasura and local schema file (`packages/typeorm/schema.graphql`)
- Commands work from both `packages/react` (`pnpm codegen`) and monorepo root
- Generated types overwrite silently — git diff shows what changed
- Manual invocation + pre-build hook — codegen runs automatically before `pnpm build`
- Generated output committed to repo (types in `src/graphql/`, query documents in `src/documents/`)

### Claude's Discretion

- Test app page structure and navigation design (landing page with domain links recommended)
- Loading skeleton and placeholder content in test app
- Exact `IndexerError` subcategory taxonomy (follow industry conventions)
- Build tooling choice (tsup, unbuild, etc.)
- Exact codegen tool configuration

</decisions>

<specifics>
## Specific Ideas

- Hooks should follow industry standards for GraphQL error handling — research how Apollo, urql, and similar libraries structure their errors
- Hooks are thin wrappers around TanStack Query: only transform is renaming `data` → domain-specific name, everything else passed through
- No provider component — this is a "just hooks" package, not a framework

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 07-package-foundation_
_Context gathered: 2026-02-17_
