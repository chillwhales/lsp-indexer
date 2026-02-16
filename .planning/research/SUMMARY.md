# Research Summary: LSP Indexer v1.1 — React Hooks Package

**Synthesized:** 2026-02-16
**Research Files:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall Confidence:** HIGH

---

## 1. Executive Summary

The v1.1 React hooks package (`packages/react`) is a well-scoped extraction of existing patterns from the `chillwhales/marketplace` into a publishable, reusable library. The research converges strongly: use `@graphql-codegen/client-preset` with `documentMode: 'string'` for type generation, a **function-based service layer** as the framework-agnostic core (replacing the marketplace's mixin-based classes), thin TanStack Query hook wrappers for client consumption, and optional `next-safe-action` wrappers for server-side Next.js patterns. The stack is mature — all recommended libraries are actively maintained, well-documented, and battle-tested.

The critical risk is **package boundary correctness**: getting the `exports` map, `"use client"` directives, and server/client code separation right in Phase 1. Every research dimension flags this. A broken `exports` map or leaked server-only code in client bundles produces a package that is fundamentally unusable, and fixing it requires restructuring. The second major risk is **codegen pipeline integration** — the Hasura schema has ~80 entity types generating deeply nested TypeScript types with snake_case naming that must be transformed into clean, camelCase consumer-facing types via an explicit parser layer.

The recommended approach is **vertical-slice implementation**: scaffold the package structure with one domain (Universal Profiles) end-to-end through all layers (document → codegen → parser → service → hook → server action), validate the pattern works in a consumer app, then replicate across the remaining 10 domains. This front-loads risk and establishes the pattern before volume work begins.

---

## 2. Consensus Findings

Points that emerged independently across multiple research dimensions:

| Finding                                           | Confirmed By                     | Implication                                                                                                                                                                              |
| ------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function-based services over classes**          | ARCHITECTURE, PITFALLS, FEATURES | Eliminates mixin fragility, enables tree-shaking, simplifies testing. Non-negotiable.                                                                                                    |
| **`client-preset` with `documentMode: 'string'`** | STACK, ARCHITECTURE, FEATURES    | The modern codegen approach. Generates only types for written operations, produces string literals (not AST), works with any client.                                                     |
| **Service layer is the shared core**              | ARCHITECTURE, FEATURES, PITFALLS | Both hooks (client) and actions (server) call the same service functions. This is the key architectural invariant.                                                                       |
| **Strict server/client entry point separation**   | STACK, ARCHITECTURE, PITFALLS    | `@lsp-indexer/react` (client-safe) and `@lsp-indexer/react/server` (server-only). Mixing them = broken bundles.                                                                          |
| **Parser layer for Hasura → clean types**         | ARCHITECTURE, PITFALLS, FEATURES | Raw Hasura types are snake_case, deeply nullable. An explicit parser layer transforms to camelCase, non-nullable output types.                                                           |
| **`fetch` over `graphql-request`**                | ARCHITECTURE, STACK (divergence) | ARCHITECTURE recommends raw `fetch` (zero deps, graphql-request renamed to "graffle"). STACK recommends `graphql-request ^7.4.0` (still maintained on its branch). **Resolution below.** |
| **Peer dependencies for React, TanStack Query**   | STACK, PITFALLS                  | Must be `peerDependencies` to avoid duplicate instances. `next-safe-action`, `zod`, `viem` are optional peers.                                                                           |

### Resolution: `fetch` vs `graphql-request`

STACK recommends `graphql-request ^7.4.0` (maintained, 6.1k stars). ARCHITECTURE recommends raw `fetch` (zero dependencies, `graphql-request` is evolving into "graffle"). **Recommend: raw `fetch` with a typed wrapper.** Rationale:

- The typed `execute()` wrapper in ARCHITECTURE is ~30 lines of code
- Eliminates `graphql-request` as a runtime dependency
- `graphql` is only needed as a `devDependency` for codegen (not shipped at runtime)
- `TypedDocumentString` from codegen works directly with `fetch`
- Reduces bundle size to zero additional bytes
- Removes a dependency that is actively being renamed/restructured

**Note:** `graphql-ws` is still a runtime dependency for subscription hooks (SUB-01). So the package ships with **one runtime dependency** (`graphql-ws`) plus `peerDependencies`. `graphql` is a `devDependency` only (codegen build-time).

---

## 3. Stack Assessment

### Runtime Dependencies: Minimal

The package has **one runtime dependency**: `graphql-ws` (for WebSocket subscriptions). Query hooks use a typed `fetch` wrapper with zero deps.

| Library      | Version  | Purpose                                   |
| ------------ | -------- | ----------------------------------------- |
| `graphql-ws` | `^6.0.0` | WebSocket client for Hasura subscriptions |

### Peer Dependencies (Consumer Provides)

| Library                 | Version                | Required? | Rationale                                    |
| ----------------------- | ---------------------- | --------- | -------------------------------------------- |
| `react`                 | `^18.0.0 \|\| ^19.0.0` | **Yes**   | Hooks require React                          |
| `@tanstack/react-query` | `^5.0.0`               | **Yes**   | All hooks wrap `useQuery`/`useInfiniteQuery` |
| `next-safe-action`      | `^8.0.0`               | Optional  | Only for `@lsp-indexer/react/server` entry   |
| `zod`                   | `^3.24.0`              | Optional  | Only alongside `next-safe-action`            |
| `viem`                  | `^2.0.0`               | Optional  | Only if consumer uses `Address` types        |

### Dev Dependencies (Build-Time)

| Library                          | Version   | Purpose                                                   |
| -------------------------------- | --------- | --------------------------------------------------------- |
| `@graphql-codegen/cli`           | `^6.1.1`  | Type generation from Hasura                               |
| `@graphql-codegen/client-preset` | `^5.2.2`  | The recommended preset (includes typescript + operations) |
| `@graphql-codegen/schema-ast`    | `^5.0.0`  | Schema file for offline dev                               |
| `tsup`                           | `^8.5.1`  | Build (ESM + CJS + DTS), `"use client"` banner support    |
| `vitest`                         | `^3.2.0`  | Testing (**pin to v3**, v4 drops Node 18)                 |
| `@testing-library/react`         | `^16.3.2` | Hook testing (`renderHook` built-in)                      |
| `msw`                            | `^2.x`    | GraphQL response mocking                                  |
| `happy-dom`                      | `^20.x`   | DOM environment for vitest                                |
| `typescript`                     | `^5.9.2`  | Match monorepo root                                       |

### Version Cautions

- **Vitest**: Pin `^3.2.0`, NOT `^4.x` (v4 requires Node ≥20, breaking changes)
- **Zod**: Pin `^3.24.0`, NOT `^4.x` (v4 has breaking API changes; `next-safe-action` v8 works with both via Standard Schema)
- **Do NOT add**: `@graphql-codegen/typescript-react-query`, `@apollo/client`, `urql`, `graphql-tag`, `dotenv`, `@tanstack/react-query-devtools`

---

## 4. Feature Priorities

### Table Stakes (Must Ship in v1.1)

| ID   | Feature                                                 | Complexity    | Critical Path?                        |
| ---- | ------------------------------------------------------- | ------------- | ------------------------------------- |
| TS-1 | GraphQL codegen pipeline (types from Hasura)            | Medium        | **Yes** — everything depends on types |
| TS-2 | TanStack Query integration with query key factories     | Medium        | **Yes** — hooks depend on this        |
| TS-3 | Per-domain hooks (all 11 query domains)                 | High (volume) | No — follows established pattern      |
| TS-4 | Service layer (framework-agnostic data fetching)        | Medium        | **Yes** — hooks and actions share it  |
| TS-5 | Provider pattern (create-or-reuse QueryClient)          | Low           | No                                    |
| TS-6 | Environment-driven configuration (GraphQL URL)          | Low           | No                                    |
| TS-7 | Error handling (GraphQL + network + Hasura permissions) | Medium        | No                                    |
| TS-8 | Pagination (offset-based for Hasura lists)              | Medium        | No                                    |

### Differentiators (Should Ship in v1.1)

| ID   | Feature                                   | Value                             |
| ---- | ----------------------------------------- | --------------------------------- |
| DF-1 | Dual-mode hooks (client + server actions) | Full Next.js App Router story     |
| DF-2 | Query key exports for cache management    | Consumer can invalidate, prefetch |
| DF-5 | Comprehensive TypeScript types export     | Clean consumer DX                 |

### Defer to v1.2+

| Feature                            | Why Defer                                           |
| ---------------------------------- | --------------------------------------------------- |
| SSR hydration examples (DF-3)      | Docs concern, not code — add after core works       |
| Select transforms (DF-4)           | Can add incrementally per domain                    |
| Domain-specific stale times (DF-6) | Use sensible defaults, optimize from usage data     |
| GraphQL subscriptions / real-time  | Out of scope — explicit anti-feature per PROJECT.md |
| Mutation / write hooks             | Indexer is read-only; writes happen on-chain        |
| Complex query composition/joins    | Let consumers compose hooks; Hasura handles joins   |

---

## 5. Architecture Recommendations

### Package Structure (Three-Layer Architecture)

```
packages/react/src/
├── client/          # GraphQL client: typed fetch wrapper + React context
├── documents/       # GraphQL query documents per domain (.ts with graphql())
├── graphql/         # GENERATED codegen output (committed, not edited)
├── types/           # Clean camelCase output types (hand-written)
├── parsers/         # Transform raw Hasura snake_case → clean types
├── services/        # Framework-agnostic async functions (the core)
├── hooks/           # TanStack Query wrappers ("use client")
├── server/          # next-safe-action wrappers ("use server")
├── index.ts         # Main entry: hooks + services + types + provider
└── server.ts        # Server entry: actions + server utilities
```

### Data Flow

```
Client:  Hook → Service → fetch(Hasura) → Parser → Clean Type → useQuery result
Server:  Action → Service → fetch(Hasura) → Parser → Clean Type → serialized response
```

### Entry Points

| Entry  | Import Path                 | Contains                         | `"use client"`?             |
| ------ | --------------------------- | -------------------------------- | --------------------------- |
| Main   | `@lsp-indexer/react`        | Hooks, services, types, provider | Yes (on hook files)         |
| Server | `@lsp-indexer/react/server` | Actions, server utilities        | No (`import 'server-only'`) |

### Key Patterns

1. **Service function signature**: `(client: IndexerClient, params: Params) → Promise<CleanType>`
2. **Hook pattern**: `useQuery({ queryKey: domainKeys.detail(id), queryFn: () => service(client, params), enabled: !!id })`
3. **Query key factory**: Hierarchical, namespaced with `'lsp-indexer'` prefix, exported for consumer use
4. **Provider**: Optional `<IndexerProvider url={...} queryClient={existing}>` — doesn't force new QueryClient
5. **Vertical slice**: Implement one domain end-to-end before replicating across all 11

### Naming Convention Decision

Hasura exposes snake_case. The package's **public API uses camelCase** via the parser layer. Internal codegen types remain snake_case (matching GraphQL schema). This is more work upfront but delivers clean consumer DX.

---

## 6. Critical Pitfalls (Severity-Ordered)

### CRITICAL (Must address in Phase 1)

| #   | Pitfall                                     | Impact                         | Prevention                                                                                  |
| --- | ------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| C1  | Server-only code leaking into client bundle | Package unusable in Next.js    | Strict entry point separation; services use only `fetch`; test with `next build` early      |
| C2  | Broken `exports` map in package.json        | Package uninstallable          | Validate with `publint` + `arethetypeswrong`; always include `"types"` condition first      |
| C3  | Missing `"use client"` directives           | Hooks crash in RSC             | tsup `banner` config; verify directive survives compilation; test from Server Component     |
| C4  | QueryClient provider conflicts              | Runtime errors for consumers   | `@tanstack/react-query` as peerDep; don't auto-create QueryClient; export optional provider |
| C5  | Generated types not exposed cleanly         | Consumers reach into internals | Curated type exports; never `export *` from generated files; commit generated types         |

### HIGH (Address in Phase 1-2)

| #   | Pitfall                                      | Impact                             | Prevention                                                                            |
| --- | -------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| H1  | Query cache collisions from flat keys        | Wrong data returned                | Hierarchical key factory with `'lsp-indexer'` namespace; include all variables in key |
| H3  | Hasura snake_case vs TypeScript camelCase    | Confusing DX                       | Explicit parser layer; clean output types; document the convention                    |
| H5  | Hasura permission errors → silent empty data | "Data missing" debugging nightmare | Support custom headers; warn on unexpectedly empty results in dev mode                |
| H6  | Peer dependency version conflicts            | "Invalid hook call" errors         | All framework deps as `peerDependencies`; test in clean consumer project              |
| H7  | Codegen schema drift                         | Runtime query failures             | Commit generated types; run codegen as build step; validate in CI                     |

### MEDIUM (Address during implementation)

| #   | Pitfall                               | Prevention                                                         |
| --- | ------------------------------------- | ------------------------------------------------------------------ |
| M1  | Missing `enabled` guards              | Accept `undefined` params; use `skipToken` pattern                 |
| M2  | Codegen output bloat                  | `documentMode: 'string'` limits output to written operations       |
| M4  | `_bool_exp` type explosion in filters | Simplified filter types with raw escape hatch                      |
| M5  | Monorepo build order                  | Declare `@chillwhales/typeorm` as devDep for ordering              |
| M6  | Bloated npm package                   | `"files": ["dist", "README.md"]`; verify with `npm pack --dry-run` |

---

## 7. Actionable Recommendations (Prioritized)

1. **Scaffold package structure with strict entry point separation first.** Validate `exports` map works with `publint` before writing any business logic. This is the foundation everything builds on.

2. **Set up codegen pipeline pointing at Hasura endpoint.** Generate types, commit them. Verify `documentMode: 'string'` produces `TypedDocumentString` wrappers. Test that the generated `graphql()` function provides proper type inference.

3. **Build one vertical slice (Universal Profiles): document → parser → service → hook → test.** This validates the entire architecture end-to-end before volume work. If the pattern feels wrong here, fix it before replicating 10 more times.

4. **Test in a real Next.js consumer app immediately after the first hook works.** Catch `"use client"`, `exports`, and bundle issues while there's only one domain to fix — not eleven.

5. **Use raw `fetch` with typed wrapper instead of `graphql-request`.** Zero runtime dependencies. The `execute()` function is ~30 lines and provides full `TypedDocumentString` integration.

6. **Implement query key factory with `'lsp-indexer'` namespace prefix** from the start. Retrofitting namespace prefixes after consumer adoption requires cache migration.

7. **Pin Vitest to `^3.x` and Zod to `^3.24.x`.** Both have newer major versions that introduce breaking changes inappropriate for a library package.

---

## 8. Open Questions

| Question                                                                           | Impact                                                                                                                                                        | When to Resolve                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| ~~**Package name: `@chillwhales/react` or `@lsp-indexer/react`?**~~                | **RESOLVED:** `@lsp-indexer/react` — the package is indexer-specific, not chillwhales-specific.                                                               | ✓ Resolved                      |
| **Hasura naming: does the Hasura schema actually use snake_case?**                 | ARCHITECTURE and PITFALLS assume so based on TypeORM → Postgres conventions. Needs verification by introspecting the actual Hasura endpoint.                  | Phase 7 — codegen setup         |
| **Should codegen point at Hasura endpoint or local schema file?**                  | STACK recommends endpoint with schema-file fallback. ARCHITECTURE recommends endpoint with committed schema. For CI without Hasura, local schema is required. | Phase 7 — codegen setup         |
| **How much of the marketplace reference code can be extracted vs rewritten?**      | Affects Phase 8 velocity. The marketplace has working query documents and services, but in mixin-based class structure.                                       | Phase 8 — domain implementation |
| ~~**Do all 11 domains need server actions in v1.1, or just the most-used ones?**~~ | **RESOLVED:** All 11 domains get server actions (ACTION-01).                                                                                                  | ✓ Resolved                      |

---

## 9. Roadmap Implications

### Suggested Phase Structure

#### Phase 7: Package Foundation

**Rationale:** Every pitfall rated CRITICAL maps here. Getting the package structure, exports map, codegen pipeline, and build tooling right is non-negotiable — everything else builds on it.

**Delivers:**

- Package scaffold (`package.json`, `tsconfig.json`, `tsup.config.ts`, `codegen.ts`)
- Working codegen pipeline (Hasura → TypedDocumentString types)
- Typed fetch client (`createIndexerClient`, `execute()`)
- Build pipeline (ESM + CJS + DTS with `"use client"` banner)
- Exports map validated with `publint`
- Next.js test app (`apps/test`) for integration validation

**Features:** TS-1 (codegen), TS-6 (config), foundation for all others
**Pitfalls to avoid:** C1, C2, C3, C4, C5, H3, H6, H7, M5, M6
**Research needed?** No — patterns are well-documented and HIGH confidence across all dimensions.

#### Phase 8: First Vertical Slice (Universal Profiles)

**Rationale:** Validate the entire document → parser → service → hook architecture with the simplest, most-used domain before replicating across 10 more. Cheaper to fix patterns with 1 domain than 11.

**Delivers:**

- Complete Universal Profile domain (documents, types, parser, service, hook)
- Query key factory pattern established
- Provider component
- Error handling pattern
- First working consumer integration test in `apps/test`

**Features:** TS-2, TS-3 (1 of 11), TS-4 (pattern), TS-5, TS-7, DF-2 (pattern)
**Pitfalls to avoid:** H1, H5, M1, M3, M4, M7
**Research needed?** No — well-documented TanStack Query patterns.

#### Phase 9: Remaining Domains & Pagination (10 of 11)

**Rationale:** Pattern is validated. This is volume work — replicate the Universal Profile pattern across Digital Assets, NFTs, Owned Assets, Follows, Creators, LSP29, LSP29 Feed, Data Changed, Universal Receiver, UP Stats.

**Delivers:**

- All 11 domain hooks operational
- Pagination for list queries (TS-8)
- Full type exports (DF-5)
- Full query key factory exports (DF-2)

**Features:** TS-3 (10 of 11), TS-8, DF-2, DF-5
**Pitfalls to avoid:** Consistency enforcement — every domain must follow the established pattern exactly.
**Research needed?** No — replication of established pattern.

#### Phase 10: Subscriptions

**Rationale:** WebSocket subscriptions require a different transport (graphql-ws) and cache integration logic. Building after all query domains exist means subscription hooks can integrate with query cache cleanly.

**Delivers:**

- WebSocket client setup with graphql-ws
- Subscription documents and hooks for all 11 domains
- Automatic TanStack Query cache invalidation/update on subscription events

**Pitfalls to avoid:** WebSocket connection management, reconnection handling, cache synchronization
**Research needed?** No — graphql-ws + Hasura subscriptions are well-documented.

#### Phase 11: Server Actions + Publish Readiness

**Rationale:** Server actions depend on working services (from Phase 8-9). They're optional peer dependency consumers. Build them after the full client-side story (queries + subscriptions) is complete.

**Delivers:**

- `next-safe-action` wrappers for all 11 domains
- `@lsp-indexer/react/server` entry point
- Zod validation schemas for all action inputs
- `publint` + `arethetypeswrong` validation
- Package publish readiness

**Pitfalls to avoid:** H4 (server/client boundary violations)
**Research needed?** Possibly — `next-safe-action` integration with a shared library package is less documented.

### Phase Summary

| Phase | Name                               | Effort        | Risk                              | Delivers                                    |
| ----- | ---------------------------------- | ------------- | --------------------------------- | ------------------------------------------- |
| 7     | Package Foundation                 | Medium        | **HIGH** (structural)             | Scaffold, codegen, build, exports, test app |
| 8     | First Vertical Slice               | Medium        | **MEDIUM** (pattern validation)   | 1 complete domain, provider, error handling |
| 9     | Remaining Domains & Pagination     | High (volume) | **LOW** (pattern replication)     | 10 domains, pagination, full types          |
| 10    | Subscriptions                      | Medium        | **MEDIUM** (new transport)        | WebSocket, subscription hooks, cache sync   |
| 11    | Server Actions + Publish Readiness | Medium        | **MEDIUM** (boundary correctness) | next-safe-action, publish validation        |

### Research Flags

| Phase                     | Needs Research? | Reason                                               |
| ------------------------- | --------------- | ---------------------------------------------------- |
| Phase 7 (Foundation)      | No              | Well-documented patterns, HIGH confidence            |
| Phase 8 (Vertical Slice)  | No              | Standard TanStack Query patterns                     |
| Phase 9 (Domains)         | No              | Pattern replication                                  |
| Phase 10 (Subscriptions)  | No              | graphql-ws + Hasura subscriptions well-documented    |
| Phase 11 (Server Actions) | **Maybe**       | `next-safe-action` in shared package less documented |

---

## 10. Confidence Assessment

| Area             | Confidence | Notes                                                                                                                                                                                         |
| ---------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stack**        | HIGH       | All versions verified via npm registry and official docs (2026-02-16). Only divergence: `fetch` vs `graphql-request` — resolved above.                                                        |
| **Features**     | HIGH       | Patterns verified from TanStack Query v5 docs, wagmi v3 source, GraphQL Codegen guides. Feature scoping is crisp.                                                                             |
| **Architecture** | HIGH       | Derived from direct codebase analysis + official library docs. The three-layer pattern (service → hook → action) is well-established.                                                         |
| **Pitfalls**     | HIGH       | 19 pitfalls identified across 4 severity tiers. Only MEDIUM-confidence area: `next-safe-action` integration with shared library (H4).                                                         |
| **Overall**      | HIGH       | Unusually strong consensus across all 4 research dimensions. The stack is mature, patterns are documented, and the marketplace provides a working reference (even if architecturally flawed). |

### Gaps Remaining

1. ~~**Package naming**~~ — **RESOLVED:** `@lsp-indexer/react`
2. **Hasura schema introspection** — need to verify actual field naming conventions against live endpoint
3. **next-safe-action in shared package** — less documented pattern, may need a Phase 11 spike
4. ~~**Consumer testing**~~ — **RESOLVED:** Next.js test app (`apps/test`) added to Phase 7 (FOUND-07)

---

## Sources (Aggregated)

| Source                                                                                                 | Confidence | Used For                                                         |
| ------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------- |
| [TanStack Query v5 docs](https://tanstack.com/query/latest/docs/framework/react/overview)              | HIGH       | Query keys, infinite queries, SSR hydration, hook patterns       |
| [GraphQL Codegen — React Query guide](https://the-guild.dev/graphql/codegen/docs/guides/react-query)   | HIGH       | `client-preset`, `documentMode: 'string'`, `TypedDocumentString` |
| [GraphQL Codegen — Client Preset](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client) | HIGH       | Codegen configuration, why not `typescript-react-query` plugin   |
| [wagmi v3 docs](https://wagmi.sh/react/guides/tanstack-query)                                          | HIGH       | Query key exports, `get<X>QueryOptions`, provider pattern, SSR   |
| [next-safe-action docs](https://next-safe-action.dev/docs/getting-started)                             | HIGH       | Standard Schema, server action patterns                          |
| [Next.js App Router docs](https://nextjs.org/docs/app/building-your-application)                       | HIGH       | `"use client"`, server/client boundaries, Server Components      |
| [Node.js package exports](https://nodejs.org/api/packages.html#exports)                                | HIGH       | Conditional exports, dual ESM/CJS                                |
| [Hasura docs](https://hasura.io/docs)                                                                  | MEDIUM     | Permissions, auto-generated schema, snake_case conventions       |
| npm registry API (direct fetches)                                                                      | HIGH       | All version numbers verified 2026-02-16                          |
| Monorepo codebase (direct reads)                                                                       | HIGH       | schema.graphql, package.json, existing patterns                  |
| Marketplace reference (project owner assessment)                                                       | HIGH       | Anti-patterns to avoid, existing query domains                   |

---

_Synthesized: 2026-02-16_
_Ready for roadmap generation._
