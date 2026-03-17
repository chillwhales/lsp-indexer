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

| Feature                            | Why Defer                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| SSR hydration examples (DF-3)      | Docs concern, not code — add after core works                                                       |
| Select transforms (DF-4)           | Can add incrementally per domain                                                                    |
| Domain-specific stale times (DF-6) | Use sensible defaults, optimize from usage data                                                     |
| Advanced real-time patterns        | Baseline `graphql-ws` subscriptions (SUB-\*) are in-scope; defer presence/notifications UX to v1.2+ |
| Mutation / write hooks             | Indexer is read-only; writes happen on-chain                                                        |
| Complex query composition/joins    | Let consumers compose hooks; Hasura handles joins                                                   |

---

## 5. Architecture Recommendations

### Package Structure (Three-Layer Architecture)

```
packages/react/src/
├── client/          # GraphQL client: typed fetch wrapper + React context
├── documents/       # GraphQL query documents per domain (.ts with graphql())
├── graphql/         # GENERATED codegen output (committed, not hand-edited)
│   ├── graphql.ts   # TypedDocumentString types + helpers
│   └── ...          # Fragment masking, etc.
├── types/           # Clean camelCase output types (hand-written)
├── parsers/         # Transform raw Hasura snake_case → clean types
├── services/        # Framework-agnostic async functions (the core)
├── hooks/           # TanStack Query wrappers ("use client")
├── server/          # next-safe-action wrappers ("use server")
├── index.ts         # Main entry: hooks + services + types + provider
└── server.ts        # Server entry: actions + server utilities
```

> **Directory convention:** `src/graphql/` = codegen output (generated, committed). `src/documents/` = hand-written query documents. This is consistent across ARCHITECTURE.md and codegen config.

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

# Architecture: packages/react Hooks Library

**Project:** LSP Indexer v1.1 — React Hooks Package
**Domain:** Publishable React hooks library for GraphQL data consumption
**Researched:** 2026-02-16
**Confidence:** HIGH (codebase analysis + official library documentation + established patterns)

---

## Executive Summary

The `packages/react` library provides type-safe React hooks for consuming LUKSO indexer data via the Hasura GraphQL API. It replaces the marketplace's fragmented pattern (mixin-based LSPIndexerClient → class services → actions → hooks) with a clean, three-layer architecture: **codegen types → service functions → hooks**.

The architecture uses **function-based services** (not classes) as the framework-agnostic core, with thin hook wrappers for client-side TanStack Query and thin action wrappers for server-side next-safe-action. Both patterns share the same services, eliminating code duplication.

The package uses **multiple entry points** (`@lsp-indexer/react`, `@lsp-indexer/react/server`) to keep server-only code (next-safe-action) out of client bundles, with `tsup` for ESM/CJS dual builds and `@graphql-codegen/client-preset` for type generation from the Hasura introspection schema.

**Key design decisions:**

1. **Function-based services over class-based** — eliminates mixin complexity, enables tree-shaking
2. **`fetch`-based GraphQL client over graphql-request** — `graphql-request` is now `graffle` (renamed, heavier); raw `fetch` with a typed wrapper is simpler, lighter, zero dependencies
3. **Multiple entry points** — `@lsp-indexer/react` (client hooks + services), `@lsp-indexer/react/server` (server actions + utilities)
4. **Parsers transform at the service layer** — raw Hasura snake_case → clean camelCase happens once in services, hooks get clean types
5. **tsup for builds** — proven, fast, handles ESM/CJS/DTS, supports multiple entry points natively

---

## Package Directory Structure

```
packages/react/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── codegen.ts                         # GraphQL codegen configuration
│
├── src/
│   ├── index.ts                       # Main entry: re-exports client hooks + services + types + provider
│   ├── server.ts                      # Server entry: re-exports server actions + utilities
│   │
│   ├── client/                        # GraphQL client setup
│   │   ├── index.ts                   # createIndexerClient(), default client
│   │   ├── client.ts                  # Typed fetch wrapper for GraphQL
│   │   └── provider.tsx               # <IndexerProvider> React context for client config
│   │
│   ├── graphql/                       # Codegen output (GENERATED — do not edit)
│   │   ├── graphql.ts                 # TypedDocumentString, fragment masking
│   │   ├── fragment-masking.ts        # Fragment utilities
│   │   └── gql.ts                     # graphql() tagged template helper
│   │
│   ├── documents/                     # GraphQL query documents per domain
│   │   ├── index.ts                   # Re-exports all documents
│   │   ├── universal-profile.ts       # UP queries
│   │   ├── digital-asset.ts           # DA queries
│   │   ├── nft.ts                     # NFT queries
│   │   ├── owned-assets.ts            # OwnedAsset/OwnedToken queries
│   │   ├── social.ts                  # Follow/Follower/Unfollow queries
│   │   ├── creator.ts                 # LSP4Creator queries
│   │   ├── lsp29.ts                   # Encrypted asset queries
│   │   ├── lsp29-feed.ts             # LSP29 feed queries
│   │   ├── data-changed.ts           # DataChanged event queries
│   │   ├── universal-receiver.ts     # UniversalReceiver event queries
│   │   └── up-stats.ts               # UP aggregate stats queries
│   │
│   ├── types/                         # Clean output types (not raw Hasura types)
│   │   ├── index.ts                   # Re-exports all types
│   │   ├── universal-profile.ts       # UniversalProfile, ProfileMetadata
│   │   ├── digital-asset.ts           # DigitalAsset, TokenMetadata
│   │   ├── nft.ts                     # NFT, NFTMetadata
│   │   ├── owned-assets.ts            # OwnedAsset, OwnedToken
│   │   ├── social.ts                  # Follow, Follower
│   │   ├── common.ts                  # Pagination, shared types
│   │   └── params.ts                  # Service function parameter types
│   │
│   ├── parsers/                       # Transform raw Hasura → clean types
│   │   ├── index.ts                   # Re-exports all parsers
│   │   ├── universal-profile.ts       # parseUniversalProfile()
│   │   ├── digital-asset.ts           # parseDigitalAsset()
│   │   ├── nft.ts                     # parseNFT()
│   │   ├── owned-assets.ts            # parseOwnedAsset()
│   │   ├── social.ts                  # parseFollow()
│   │   ├── metadata.ts               # parseLSP3Metadata(), parseLSP4Metadata()
│   │   └── utils.ts                   # camelCase helpers, null coalescing
│   │
│   ├── services/                      # Framework-agnostic query functions
│   │   ├── index.ts                   # Re-exports all services
│   │   ├── universal-profile.ts       # getUniversalProfile(), getUniversalProfiles()
│   │   ├── digital-asset.ts           # getDigitalAsset(), getDigitalAssets()
│   │   ├── nft.ts                     # getNFT(), getNFTs(), getNFTsByAsset()
│   │   ├── owned-assets.ts            # getOwnedAssets(), getOwnedTokens()
│   │   ├── social.ts                  # getFollowers(), getFollowing()
│   │   ├── creator.ts                 # getCreators(), getCreatedAssets()
│   │   ├── lsp29.ts                   # getEncryptedAssets(), getEncryptedAsset()
│   │   ├── lsp29-feed.ts             # getLSP29Feed()
│   │   ├── data-changed.ts           # getDataChangedEvents()
│   │   ├── universal-receiver.ts     # getUniversalReceiverEvents()
│   │   └── up-stats.ts               # getUPStats()
│   │
│   ├── hooks/                         # TanStack Query hooks (client-side)
│   │   ├── index.ts                   # Re-exports all hooks
│   │   ├── universal-profile.ts       # useUniversalProfile(), useUniversalProfiles()
│   │   ├── digital-asset.ts           # useDigitalAsset(), useDigitalAssets()
│   │   ├── nft.ts                     # useNFT(), useNFTs()
│   │   ├── owned-assets.ts            # useOwnedAssets(), useOwnedTokens()
│   │   ├── social.ts                  # useFollowers(), useFollowing()
│   │   ├── creator.ts                 # useCreators(), useCreatedAssets()
│   │   ├── lsp29.ts                   # useEncryptedAssets(), useEncryptedAsset()
│   │   ├── lsp29-feed.ts             # useLSP29Feed()
│   │   ├── data-changed.ts           # useDataChangedEvents()
│   │   ├── universal-receiver.ts     # useUniversalReceiverEvents()
│   │   └── up-stats.ts               # useUPStats()
│   │
│   └── server/                        # Server-side utilities (next-safe-action)
│       ├── index.ts                   # Re-exports server actions
│       ├── action-client.ts           # createActionClient() helper
│       └── actions/                   # Server action wrappers per domain
│           ├── index.ts
│           ├── universal-profile.ts   # getUniversalProfileAction()
│           ├── digital-asset.ts       # getDigitalAssetAction()
│           └── ...                    # (mirrors services/ structure)
│
├── generated/                         # Committed codegen output (outside src for clarity)
│   ├── schema.graphql                 # Introspected Hasura schema
│   └── hasura-types.ts               # Full Hasura operation types (used by documents)
│
└── test/
    ├── services/                      # Service function tests
    ├── parsers/                       # Parser unit tests
    └── hooks/                         # Hook integration tests
```

### Why This Structure

1. **`documents/` separate from `services/`** — queries define WHAT to ask, services define HOW to ask and WHAT to return. A service may compose multiple documents or add pagination logic.
2. **`parsers/` as explicit layer** — raw Hasura types have `_bool_exp`, snake_case, nullable everything. Parsers transform this into clean TypeScript types. Making this explicit (not hidden in services) ensures consistent transformation and testability.
3. **`types/` for clean output** — consumers import types from `@lsp-indexer/react` that are camelCase, non-nullable where appropriate, and documented. These are NOT the raw codegen types.
4. **`server/` behind separate entry point** — `next-safe-action` and Node.js-only code stays out of client bundles. Only importable via `@lsp-indexer/react/server`.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    packages/react                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Entry: @lsp-indexer/react (src/index.ts)            │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌────────────┐  ┌──────────────┐  │   │
│  │  │   hooks/    │  │  services/ │  │   types/     │  │   │
│  │  │ TanStack Q  │──│ Pure fns   │  │ Clean types  │  │   │
│  │  └─────────────┘  └──────┬─────┘  └──────────────┘  │   │
│  │                          │                            │   │
│  │  ┌─────────────┐  ┌─────┴──────┐  ┌──────────────┐  │   │
│  │  │  client/    │  │ documents/ │  │  parsers/    │  │   │
│  │  │ Fetch wrap  │  │ GQL docs   │  │ Raw → Clean  │  │   │
│  │  └──────┬──────┘  └────────────┘  └──────────────┘  │   │
│  │         │                                             │   │
│  │  ┌──────┴──────┐                                     │   │
│  │  │  graphql/   │  (codegen output — generated)       │   │
│  │  └─────────────┘                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Entry: @lsp-indexer/react/server (src/server.ts)    │   │
│  │                                                       │   │
│  │  ┌─────────────────┐                                 │   │
│  │  │ server/actions/  │───► uses services/ from above  │   │
│  │  │ next-safe-action │                                 │   │
│  │  └─────────────────┘                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  External Dependencies:                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  packages/typeorm/schema.graphql → Hasura endpoint  │    │
│  │  (codegen source — introspects Hasura for types)    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Flow (Internal)

```
hooks/ ──────────► services/ ──────────► documents/
  │                    │                      │
  │                    │                      ▼
  │                    │                 graphql/  (codegen types)
  │                    │
  │                    ├──────────► parsers/
  │                    │                │
  │                    │                ▼
  │                    │           types/ (clean output)
  │                    │
  │                    └──────────► client/ (GraphQL fetch wrapper)
  │
  └──────────► client/provider.tsx (for QueryClient + URL context)

server/actions/ ───► services/ (reuses same services)
```

### External Dependency Map

```
packages/react depends on:
  ├── packages/typeorm/schema.graphql  (codegen source — dev time only)
  │
  ├── Peer Dependencies (user provides):
  │   ├── react ^18.0.0
  │   ├── @tanstack/react-query ^5.0.0
  │   └── next-safe-action ^7.0.0  (optional — only for server entry)
  │
  └── Direct Dependencies:
      └── (none — fetch is global, codegen output is committed)
```

---

## Data Flow: Client-Side Pattern

The primary consumption pattern. Hook calls service → service executes GraphQL → parser transforms result → hook returns clean typed data.

```
┌──────────────────────────────────────────────────────────────────┐
│  Consumer Component                                               │
│                                                                   │
│  const { data } = useUniversalProfile({ address: "0x..." });    │
│                     │                                            │
└─────────────────────┼────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  hooks/universal-profile.ts                                       │
│                                                                   │
│  export function useUniversalProfile(params) {                   │
│    const client = useIndexerClient();   // from context           │
│    return useQuery({                                              │
│      queryKey: ['universal-profile', params.address],             │
│      queryFn: () => getUniversalProfile(client, params),         │
│      enabled: !!params.address,                                   │
│    });                                                            │
│  }                                                                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  services/universal-profile.ts                                    │
│                                                                   │
│  export async function getUniversalProfile(                      │
│    client: IndexerClient,                                         │
│    params: GetUniversalProfileParams                              │
│  ): Promise<UniversalProfile> {                                  │
│    const raw = await client.execute(                              │
│      UniversalProfileDocument,     // from documents/             │
│      { address: params.address }                                  │
│    );                                                             │
│    return parseUniversalProfile(raw.universalProfile[0]);        │
│  }                                                                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
┌─────────────────────┐  ┌────────────────────────┐
│  client/client.ts   │  │  parsers/universal-    │
│                     │  │  profile.ts            │
│  execute(doc, vars) │  │                        │
│    │                │  │  parseUniversalProfile │
│    ▼                │  │  (raw) → clean type    │
│  fetch(hasuraUrl, { │  │  - camelCase fields    │
│    body: JSON.str.. │  │  - null coalescing     │
│    headers: {       │  │  - nested parsing      │
│      x-hasura-role  │  │    (metadata, images)  │
│    }                │  │                        │
│  })                 │  └────────────────────────┘
│    │                │
│    ▼                │
│  Hasura GraphQL API │
└─────────────────────┘
```

### Detailed Data Flow

1. **Component** calls `useUniversalProfile({ address: "0x..." })`
2. **Hook** reads `IndexerClient` from React context (URL, headers configured at app root)
3. **Hook** wraps `getUniversalProfile()` service call in `useQuery()` with deterministic query key
4. **Service** calls `client.execute(UniversalProfileDocument, variables)`
5. **Client** performs `fetch(url, { method: 'POST', body: JSON.stringify({ query, variables }) })`
6. **Hasura** returns raw GraphQL response with snake_case fields, nullable everything
7. **Service** passes raw data to `parseUniversalProfile()` which:
   - Transforms snake_case → camelCase (e.g., `lsp3_profile` → `lsp3Profile`)
   - Coalesces nulls (e.g., `name?.value ?? null`)
   - Recursively parses nested objects (metadata → images, tags, links)
   - Returns clean `UniversalProfile` type
8. **Hook** returns TanStack Query result (`{ data, isLoading, error, ... }`)

---

## Data Flow: Server-Side Pattern

For Next.js App Router server components that need server-only data fetching via next-safe-action.

```
┌──────────────────────────────────────────────────────────────────┐
│  Server Component (Next.js App Router)                            │
│                                                                   │
│  const { data } = await getUniversalProfileAction({              │
│    address: "0x..."                                               │
│  });                                                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  server/actions/universal-profile.ts                              │
│                                                                   │
│  export const getUniversalProfileAction = actionClient           │
│    .schema(z.object({ address: z.string() }))                    │
│    .action(async ({ parsedInput }) => {                          │
│      const client = createServerClient();  // server env vars    │
│      return getUniversalProfile(client, parsedInput);            │
│    });                                                            │
│  // Uses SAME service as client-side hooks                       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  services/universal-profile.ts  (SAME as client-side)            │
│                                                                   │
│  getUniversalProfile(client, params) → UniversalProfile          │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
                  Hasura GraphQL API
```

### Key Design: Service Reuse

The **services** layer is framework-agnostic. It takes an `IndexerClient` (which is just a thin typed `fetch` wrapper) and returns parsed types. This means:

- **Client-side hooks** call `service(clientFromContext, params)`
- **Server-side actions** call `service(clientFromEnvVars, params)`
- **Tests** call `service(mockClient, params)` directly

No code duplication. The service is the single source of truth for "how to query X."

---

## Type Flow

```
packages/typeorm/schema.graphql                    (entity definitions — source of truth)
        │
        ▼
Hasura auto-generates GraphQL schema               (adds _bool_exp, _order_by, aggregate, etc.)
        │
        ▼
codegen.ts introspects Hasura endpoint             (fetches full schema with Hasura types)
        │
        ▼
generated/schema.graphql                            (full introspected Hasura schema — committed)
        │
        ▼
@graphql-codegen/client-preset                     (generates TypeScript from documents)
        │
        ├──► src/graphql/graphql.ts                 (TypedDocumentString with full response types)
        │
        └──► Used by: src/documents/*.ts            (query documents use graphql() tagged template)
                │
                ▼
        Codegen infers per-document types:           (UniversalProfileQuery, UniversalProfileQueryVariables)
                │
                ▼
        services/ call client.execute(doc, vars)    (TypedDocumentString provides input/output types)
                │
                ▼
        Raw response types → parsers/               (Hasura raw types: nullable, snake_case)
                │
                ▼
        parsers/ → types/                           (Clean types: non-nullable where safe, camelCase)
                │
                ▼
        hooks/ return clean types                    (useUniversalProfile() → { data: UniversalProfile })
```

### Type Layers

| Layer                            | Example Type                       | Characteristics                                                              |
| -------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| **Hasura Raw** (codegen)         | `UniversalProfile_Bool_Exp`        | Generated, snake_case, all nullable, includes `_bool_exp`, `_order_by`       |
| **Document Response** (codegen)  | `UniversalProfileQuery`            | Generated per-document, exact shape of query response                        |
| **Clean Output** (hand-written)  | `UniversalProfile`                 | camelCase, documented, non-nullable where guaranteed, nested types flattened |
| **Hook Return** (TanStack Query) | `UseQueryResult<UniversalProfile>` | Wraps clean type in TanStack Query's loading/error states                    |

### Parser Example

```typescript
// Raw from Hasura (codegen type)
interface RawUniversalProfile {
  id: string;
  address: string;
  lsp3_profile: {
    name: { value: string | null } | null;
    description: { value: string | null } | null;
    profile_image: Array<{
      url: string | null;
      width: number | null;
      height: number | null;
    }> | null;
    tags: Array<{ value: string | null }> | null;
  } | null;
}

// Clean output type (hand-written)
interface UniversalProfile {
  id: string;
  address: string;
  name: string | null;
  description: string | null;
  profileImages: ProfileImage[];
  tags: string[];
}

// Parser function
function parseUniversalProfile(raw: RawUniversalProfile): UniversalProfile {
  const profile = raw.lsp3_profile;
  return {
    id: raw.id,
    address: raw.address,
    name: profile?.name?.value ?? null,
    description: profile?.description?.value ?? null,
    profileImages: (profile?.profile_image ?? []).map((img) => ({
      url: img.url ?? '',
      width: img.width ?? 0,
      height: img.height ?? 0,
    })),
    tags: (profile?.tags ?? []).map((t) => t.value).filter(Boolean) as string[],
  };
}
```

---

## Export Strategy

### Multiple Entry Points

```jsonc
// package.json
{
  "name": "@lsp-indexer/react",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts",
    },
    "./server": {
      "import": "./dist/server.mjs",
      "require": "./dist/server.js",
      "types": "./dist/server.d.ts",
    },
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
}
```

### What Each Entry Point Exports

**`@lsp-indexer/react`** (client-safe):

```typescript
// Provider
export { IndexerProvider, type IndexerConfig } from './client/provider';
export { createIndexerClient, type IndexerClient } from './client';

// Hooks (all 11 domains)
export { useUniversalProfile, useUniversalProfiles } from './hooks/universal-profile';
export { useDigitalAsset, useDigitalAssets } from './hooks/digital-asset';
export { useNFT, useNFTs } from './hooks/nft';
export { useOwnedAssets, useOwnedTokens } from './hooks/owned-assets';
export { useFollowers, useFollowing } from './hooks/social';
export { useCreators, useCreatedAssets } from './hooks/creator';
export { useEncryptedAssets, useEncryptedAsset } from './hooks/lsp29';
export { useLSP29Feed } from './hooks/lsp29-feed';
export { useDataChangedEvents } from './hooks/data-changed';
export { useUniversalReceiverEvents } from './hooks/universal-receiver';
export { useUPStats } from './hooks/up-stats';

// Services (for advanced/custom use)
export * from './services';

// Types
export * from './types';
```

**`@lsp-indexer/react/server`** (server-only):

```typescript
// Server action helpers
export { createServerClient } from './server';
export { createActionClient } from './server/action-client';

// Pre-built actions (all 11 domains)
export { getUniversalProfileAction } from './server/actions/universal-profile';
export { getDigitalAssetAction } from './server/actions/digital-asset';
// ... etc

// Re-export services + types for direct server use
export * from './services';
export * from './types';
```

### Tree-Shaking Considerations

1. **ESM output is tree-shakeable** — tsup with `splitting: true` produces separate chunks
2. **Function-based services** are fully tree-shakeable (unlike class methods which can't be individually eliminated)
3. **Per-domain files** ensure importing `useUniversalProfile` doesn't pull in `useNFT`'s query documents
4. **`"sideEffects": false`** in package.json tells bundlers everything is safe to tree-shake

### Server-Only Import Safety

The `./server` entry point should use `import "server-only"` at the top (a Next.js convention) to cause build errors if accidentally imported in client components:

```typescript
// src/server.ts
import 'server-only'; // Build error if imported in client component

export { createServerClient } from './server/action-client';
// ...
```

This is a Next.js specific pattern but harmless for other frameworks (they won't have the `server-only` package installed, and this import is only in the server entry).

---

## GraphQL Client Configuration

### Client Architecture

```typescript
// src/client/client.ts

export interface IndexerClientConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface IndexerClient {
  execute<TResult, TVariables>(
    document: TypedDocumentString<TResult, TVariables>,
    ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
  ): Promise<TResult>;
}

export function createIndexerClient(config: IndexerClientConfig): IndexerClient {
  return {
    async execute(document, ...args) {
      const [variables] = args;
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/graphql-response+json',
          ...config.headers,
        },
        body: JSON.stringify({
          query: document.toString(),
          variables: variables ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (json.errors?.length) {
        throw new GraphQLError(json.errors);
      }

      return json.data;
    },
  };
}
```

### Why `fetch` Over graphql-request

1. **graphql-request is now "graffle"** — renamed, much heavier (extensible client framework), overkill for typed queries
2. **Zero dependencies** — `fetch` is global in all modern runtimes (Node 18+, browsers, Deno, Bun)
3. **TypedDocumentString compatibility** — `@graphql-codegen/client-preset` generates `TypedDocumentString` which is just a string wrapper; works directly with fetch
4. **Full control** — Hasura needs custom headers (`x-hasura-role`, `x-hasura-admin-secret`); trivial with fetch, requires middleware with graphql-request/graffle
5. **Bundle size** — zero bytes added vs ~15KB+ for graphql-request

### Environment Variable Handling

```typescript
// Client-side (Next.js convention)
// Consumer's next.config.js exposes NEXT_PUBLIC_INDEXER_URL
const clientUrl = process.env.NEXT_PUBLIC_INDEXER_URL ?? 'http://localhost:8080/v1/graphql';

// Server-side (not exposed to browser)
const serverUrl = process.env.INDEXER_URL ?? process.env.NEXT_PUBLIC_INDEXER_URL;
```

The package does NOT read env vars directly. Instead:

```tsx
// Consumer's app sets up the provider
<IndexerProvider url={process.env.NEXT_PUBLIC_INDEXER_URL!} headers={{ 'x-hasura-role': 'public' }}>
  <App />
</IndexerProvider>
```

### Client Instantiation Strategy

| Context                   | Strategy                    | Reason                                                     |
| ------------------------- | --------------------------- | ---------------------------------------------------------- |
| **Client-side (hooks)**   | Singleton via React Context | One client per app, shared across all hooks                |
| **Server-side (actions)** | Per-request                 | Server actions may need different auth headers per request |
| **Testing**               | Mock per test               | Each test gets isolated client                             |

---

## Provider Component

```tsx
// src/client/provider.tsx
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createIndexerClient, type IndexerClient, type IndexerClientConfig } from './client';

interface IndexerContextValue {
  client: IndexerClient;
}

const IndexerContext = createContext<IndexerContextValue | null>(null);

export function useIndexerClient(): IndexerClient {
  const ctx = useContext(IndexerContext);
  if (!ctx) throw new Error('useIndexerClient must be used within <IndexerProvider>');
  return ctx.client;
}

export interface IndexerProviderProps extends IndexerClientConfig {
  children: ReactNode;
  queryClient?: QueryClient; // Use existing QueryClient if available
}

export function IndexerProvider({ children, queryClient, ...config }: IndexerProviderProps) {
  const client = useMemo(() => createIndexerClient(config), [config.url]);
  const qc = useMemo(() => queryClient ?? new QueryClient(), [queryClient]);

  return (
    <QueryClientProvider client={qc}>
      <IndexerContext.Provider value={{ client }}>{children}</IndexerContext.Provider>
    </QueryClientProvider>
  );
}
```

**Key decisions:**

- Provider optionally wraps `QueryClientProvider` — if consumer already has one, they pass it in
- Client is memoized on URL to prevent unnecessary re-renders
- No default URL in the package — consumer must provide it (explicit > implicit)

---

## Service Layer Design

### Function-Based, Not Class-Based

The marketplace uses:

```typescript
// BAD: marketplace pattern
class LSPIndexerClient { ... }  // base with mixin
class DigitalAssetService extends IndexerService { ... }  // per-domain class
```

Problems:

- Mixins are fragile and hard to type
- Class instances can't be tree-shaken
- Constructor dependency injection is cumbersome
- Testing requires mocking class hierarchy

The new pattern:

```typescript
// GOOD: function-based
export async function getDigitalAsset(
  client: IndexerClient,
  params: GetDigitalAssetParams,
): Promise<DigitalAsset> {
  const raw = await client.execute(DigitalAssetDocument, {
    address: params.address,
    getLsp4Metadata: params.includeMetadata ?? true,
    getTransferEvents: params.includeTransfers ?? false,
  });
  return parseDigitalAsset(raw.digital_asset[0]);
}
```

Benefits:

- Pure function — testable with just a mock client
- Tree-shakeable — unused services are eliminated
- Type-safe — TypedDocumentString carries input/output types
- Composable — one service can call another without class hierarchy

### Service Function Signature Convention

Every service follows the same pattern:

```typescript
export async function get[Entity](
  client: IndexerClient,
  params: Get[Entity]Params
): Promise<[CleanType]>;

export async function get[Entities](
  client: IndexerClient,
  params: Get[Entities]Params
): Promise<{ items: [CleanType][]; totalCount: number }>;
```

- First arg is always `IndexerClient` (dependency injection via parameter, not constructor)
- Second arg is always a typed params object
- Return type is always a clean type (not raw Hasura type)
- List queries always return `{ items, totalCount }` for pagination

### How @include Directives Map

The marketplace queries use `@include(if: $getLsp4Metadata)` etc. to conditionally fetch nested data. This maps to service params:

```typescript
interface GetDigitalAssetParams {
  address: string;
  includeMetadata?: boolean; // → $getLsp4Metadata @include
  includeTransfers?: boolean; // → $getTransferEvents @include
  includeCreators?: boolean; // → $getLsp4Creators @include
  includeOwnedAssets?: boolean; // → $getOwnedAssets @include
}
```

Services convert these boolean params to GraphQL variables, keeping the API clean for consumers.

---

## Build Configuration

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    server: 'src/server.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', '@tanstack/react-query', 'next-safe-action', 'zod', 'server-only'],
  treeshake: true,
});
```

### package.json (Build-Relevant Fields)

```jsonc
{
  "name": "@lsp-indexer/react",
  "version": "0.1.0",
  "description": "Type-safe React hooks for LUKSO indexer data",
  "license": "MIT",
  "sideEffects": false,

  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    },
    "./server": {
      "import": { "types": "./dist/server.d.mts", "default": "./dist/server.mjs" },
      "require": { "types": "./dist/server.d.ts", "default": "./dist/server.js" },
    },
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"],

  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist/",
    "codegen": "graphql-codegen --config codegen.ts",
    "codegen:watch": "graphql-codegen --config codegen.ts --watch",
    "test": "vitest run",
    "test:watch": "vitest",
  },

  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "@tanstack/react-query": "^5.0.0",
  },
  "peerDependenciesMeta": {
    "next-safe-action": { "optional": true },
    "zod": { "optional": true },
  },

  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.0",
    "@graphql-codegen/client-preset": "^4.0.0",
    "@graphql-codegen/schema-ast": "^4.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.9.2",
    "vitest": "^2.1.8",
  },
}
```

### GraphQL Codegen Configuration

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Introspect from Hasura endpoint (or use local schema file)
  schema: [
    {
      [process.env.HASURA_GRAPHQL_ENDPOINT ?? 'http://localhost:8080/v1/graphql']: {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET ?? '',
        },
      },
    },
  ],
  documents: ['src/documents/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    // TypedDocumentString types from documents
    './src/graphql/': {
      preset: 'client',
      config: {
        documentMode: 'string', // String mode — no graphql-tag dependency
        scalars: {
          DateTime: 'string',
          BigInt: 'string',
          Int: 'number',
          Float: 'number',
        },
      },
    },
    // Schema file for reference (committed)
    './generated/schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;
```

### Why These Codegen Choices

1. **`documentMode: 'string'`** — No runtime `graphql-tag` dependency. The `graphql()` function returns a `TypedDocumentString` (just a string with type information). Works directly with our fetch-based client.
2. **`client` preset** — The modern recommended approach. Generates types per-document (not per-schema-type). Only generates types for fields you actually query.
3. **`scalars` mapping** — Hasura's `DateTime` and `BigInt` come as strings. Map them explicitly rather than importing scalar packages.
4. **Schema introspection from Hasura** — Not from `packages/typeorm/schema.graphql` directly, because Hasura adds `_bool_exp`, `_order_by`, `aggregate` types that TypeORM's schema doesn't have. Codegen needs the full Hasura schema.

---

## Build Order for Implementation

### Phase Dependencies

```
Phase 1: Foundation
  ├── Package scaffolding (package.json, tsconfig, tsup)
  ├── GraphQL codegen pipeline
  └── Client module (fetch wrapper, types)
      │
      ▼
Phase 2: Core Services (per domain)
  ├── Query documents for each of 11 domains
  ├── Parser functions for each domain
  ├── Clean type definitions
  └── Service functions for each domain
      │
      ▼
Phase 3: React Layer
  ├── Provider component (IndexerProvider)
  ├── TanStack Query hooks for all 11 domains
  └── Client-side integration tests
      │
      ▼
Phase 4: Server Layer
  ├── Server action client helper
  ├── next-safe-action wrappers for all 11 domains
  └── Server-side integration tests
      │
      ▼
Phase 5: Polish
  ├── Build verification (ESM/CJS/types)
  ├── Tree-shaking verification
  ├── Documentation and examples
  └── Package publish configuration
```

### What Must Exist Before What

| Component                  | Depends On                                        | Reason                                   |
| -------------------------- | ------------------------------------------------- | ---------------------------------------- |
| `codegen.ts`               | Running Hasura endpoint                           | Introspects schema for types             |
| `src/graphql/` (generated) | `codegen.ts` + `src/documents/`                   | Codegen reads documents, generates types |
| `src/documents/`           | Hasura schema knowledge                           | Query documents reference Hasura types   |
| `src/types/`               | `src/graphql/`                                    | Clean types mirror raw types             |
| `src/parsers/`             | `src/graphql/` + `src/types/`                     | Transforms raw → clean                   |
| `src/client/`              | `src/graphql/`                                    | Client uses TypedDocumentString          |
| `src/services/`            | `src/client/` + `src/documents/` + `src/parsers/` | Composes all three                       |
| `src/hooks/`               | `src/services/` + `src/client/provider.tsx`       | Wraps services in TanStack Query         |
| `src/server/`              | `src/services/`                                   | Wraps services in next-safe-action       |
| `tsup` build               | All source files                                  | Bundles everything                       |

### Suggested Implementation Sequence (Vertical Slice)

Rather than building all documents, then all parsers, then all services, use a **vertical slice** approach per domain:

1. **Start with Universal Profile** (simplest, most used):
   - Write `documents/universal-profile.ts`
   - Run codegen → generates types
   - Write `types/universal-profile.ts`
   - Write `parsers/universal-profile.ts`
   - Write `services/universal-profile.ts`
   - Write `hooks/universal-profile.ts`
   - Test end-to-end
2. **Then Digital Asset** (adds complexity: @include directives)
3. **Then NFT** (adds complexity: token-level queries)
4. **Then remaining 8 domains** (follow established pattern)

This way, the pattern is validated early on one domain before replicating across all 11.

---

## Integration with Existing Monorepo

### New vs Modified Components

| Component                         | Status                        | Notes                          |
| --------------------------------- | ----------------------------- | ------------------------------ |
| `packages/react/`                 | **NEW**                       | Entire package is new          |
| `pnpm-workspace.yaml`             | Already includes `packages/*` | No change needed               |
| `packages/typeorm/schema.graphql` | **READ-ONLY**                 | Source of truth, not modified  |
| Root `package.json`               | May add `codegen` script      | Optional convenience script    |
| Root `tsconfig.json`              | No change                     | React package has own tsconfig |

### Monorepo Workspace Integration

The package is automatically included in the pnpm workspace because `pnpm-workspace.yaml` already specifies `packages/*`. To use it from another package or app within the monorepo:

```jsonc
// In consumer's package.json
{
  "dependencies": {
    "@lsp-indexer/react": "workspace:*",
  },
}
```

### Build Order in Monorepo

```
packages/abi (no deps)
    ↓
packages/typeorm (depends on abi indirectly — uses schema.graphql)
    ↓
packages/react (dev-time: introspects Hasura which reads typeorm schema)
```

The React package does NOT depend on `packages/typeorm` at runtime. The dependency is **dev-time only**: codegen introspects the Hasura endpoint, which auto-generates its schema from the PostgreSQL tables created by TypeORM entities.

---

## Anti-Patterns to Avoid

### 1. Class-Based Services with Mixins

**Don't:**

```typescript
class LSPIndexerClient extends DigitalAssetMixin(UniversalProfileMixin(BaseClient)) {}
```

**Why bad:** Untypeable beyond 2-3 mixins, impossible to tree-shake, testing nightmare.
**Do:** Function-based services with `IndexerClient` as first parameter.

### 2. Hooks That Directly Execute GraphQL

**Don't:**

```typescript
function useUniversalProfile(address: string) {
  return useQuery({
    queryKey: ['up', address],
    queryFn: async () => {
      const res = await fetch(url, { body: ... });
      const data = await res.json();
      return data.data.universalProfile;  // raw Hasura type leaks
    }
  });
}
```

**Why bad:** Query logic duplicated in every hook. Raw types leak to consumers. Can't reuse on server.
**Do:** Hook calls service → service handles fetch + parse.

### 3. Circular Dependencies Between Parsers

**Don't:**

```typescript
// parsers/universal-profile.ts
import { parseDigitalAsset } from './digital-asset';

// parsers/digital-asset.ts
import { parseUniversalProfile } from './universal-profile';
```

**Why bad:** Circular dependency causes runtime issues with ESM.
**Do:** Keep parsers independent. If both need shared logic, extract to `parsers/utils.ts`.

### 4. Server-Only Code in Main Entry Point

**Don't:**

```typescript
// src/index.ts
export { createActionClient } from './server/action-client'; // imports 'server-only'
```

**Why bad:** Client bundles fail because `server-only` throws in browser. Even tree-shaking can't help if the import exists in the entry point.
**Do:** Server code goes ONLY in `src/server.ts` entry point.

### 5. Hardcoding GraphQL URL

**Don't:**

```typescript
const client = createIndexerClient({
  url: 'https://indexer.myapp.com/v1/graphql',
});
```

**Why bad:** Package becomes app-specific. Can't be published.
**Do:** Consumer provides URL via `<IndexerProvider url={...}>` or `createServerClient({ url: process.env.INDEXER_URL })`.

### 6. Giant All-Fields Queries

**Don't:** Write one mega-query per domain that fetches every field and relation.
**Why bad:** Hasura sends massive payloads. Even with `@include`, the query itself is huge.
**Do:** Use targeted queries: `getUniversalProfile` (with metadata), `getUniversalProfileMinimal` (just address + name). The `@include` pattern from the marketplace is good — keep it.

---

## Scalability Considerations

| Concern            | At 1 app (internal)         | At 10 apps (published)                      | At scale                           |
| ------------------ | --------------------------- | ------------------------------------------- | ---------------------------------- |
| **Query patterns** | Fixed 11 domains, all known | Same domains, varied usage patterns         | May need query customization hooks |
| **Bundle size**    | Doesn't matter              | Tree-shaking critical                       | Per-domain code splitting          |
| **Schema changes** | Just re-run codegen         | Semver: new fields = minor, removed = major | Automated codegen in CI            |
| **Caching**        | Default TanStack Query      | Consumer configures stale times             | Consider query key factory pattern |
| **Error handling** | Simple throw                | Structured error types                      | Retry logic in client              |

---

## Sources

- **TanStack Query v5 Docs:** https://tanstack.com/query/latest (HIGH confidence — official)
- **GraphQL Codegen Client Preset:** https://the-guild.dev/graphql/codegen/docs/guides/react-query (HIGH confidence — official)
- **GraphQL Codegen Config:** https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config (HIGH confidence — official)
- **tsup Documentation:** https://tsup.egoist.dev/ (HIGH confidence — official)
- **graphql-request → Graffle rename:** https://github.com/graffle-js/graffle (HIGH confidence — official repo)
- **Hasura GraphQL Engine:** https://hasura.io/docs (HIGH confidence — auto-schema generation pattern)
- **Codebase analysis:** `packages/typeorm/schema.graphql` (925 lines, 72+ entity types) (HIGH confidence — direct)
- **Monorepo patterns:** Existing `packages/abi/package.json`, `packages/typeorm/package.json` (HIGH confidence — direct)
- **Next.js App Router patterns:** `server-only` import, React Server Components (HIGH confidence — established pattern)
- **Package.json exports:** Node.js conditional exports documentation (HIGH confidence — official spec)

---

_Researched: 2026-02-16_
_Confidence: HIGH — Architecture derived from direct codebase analysis of existing monorepo patterns, official library documentation (TanStack Query v5, GraphQL Codegen client preset, tsup), and established React hooks package conventions. The marketplace reference implementation provides concrete patterns to improve upon._

# Technology Stack: packages/react

**Project:** LSP Indexer — React Hooks Package
**Researched:** 2026-02-16
**Mode:** Ecosystem — Stack dimension for standalone React hooks library
**Overall confidence:** HIGH

## Executive Summary

The recommended stack from the `chillwhales/marketplace` reference implementation is **current and well-chosen**. All libraries are actively maintained, at recent stable versions, and integrate cleanly. The key architectural insight is that **GraphQL Codegen's `client-preset` with `documentMode: 'string'` is the modern, recommended approach** — it generates typed `TypedDocumentString` wrappers that work with any client including `graphql-request` and TanStack Query, without needing library-specific codegen plugins like `@graphql-codegen/typescript-react-query`.

**One notable change since the reference implementation:** Zod v4 is now the `latest` tag on npm (v4.3.6). However, `next-safe-action` v8 uses [Standard Schema](https://github.com/standard-schema/standard-schema), meaning it works with both Zod v3 and v4. **Recommend using Zod v3 (`zod@^3.24.1`) for stability** — v4 is brand new and introduces breaking API changes (`z.object()` → `z.interface()` for optionals, new import paths). Migrate to v4 in a future milestone.

## Core Dependencies (Runtime — shipped in the package)

**UPDATE (post-synthesis decision):** The package ships with **a single runtime dependency (`graphql-ws`)** for WebSocket subscriptions. SUMMARY.md resolved the `graphql-request` vs typed `fetch` divergence in favor of a ~30-line typed `fetch` wrapper using `TypedDocumentString` from codegen. This eliminates `graphql-request` and `graphql` as runtime deps — `graphql` is only needed as a `devDependency` for codegen at build time.

| Library               | Version      | Purpose                                   | Status                                                                                                                                                      |
| --------------------- | ------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~`graphql-request`~~ | ~~`^7.4.0`~~ | ~~GraphQL HTTP client~~                   | **REMOVED** — replaced by typed `fetch` wrapper. `graphql-request` is evolving into "Graffle" (heavier, different API). The `execute()` wrapper is ~30 LOC. |
| `graphql`             | `^16.12.0`   | GraphQL core (codegen + type generation)  | **Moved to `devDependencies`** — only needed at build time for codegen. Not shipped in the package bundle.                                                  |
| `graphql-ws`          | `^6.0.0`     | WebSocket client for Hasura subscriptions | **Runtime dependency** — required for subscription hooks. Lightweight (~5KB), implements the graphql-ws protocol Hasura uses.                               |

**Note:** `graphql-ws` is the ONLY runtime dependency. Everything else (`@tanstack/react-query`, `next-safe-action`, `zod`, `react`, `viem`) must be **peer dependencies** — the consuming app provides them. This keeps the package lightweight and avoids version conflicts.

## Peer Dependencies (Consumer provides)

These are `peerDependencies` — the consuming application must install them. The package imports from them but does not bundle them.

| Library                 | Version Range          | Purpose                                   | Required?    | Rationale                                                                                                                            |
| ----------------------- | ---------------------- | ----------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `react`                 | `^18.0.0 \|\| ^19.0.0` | React core                                | **Yes**      | Hooks require React. Support both 18 (current majority) and 19 (released).                                                           |
| `@tanstack/react-query` | `^5.0.0`               | Client-side data fetching hooks           | **Yes**      | v5 is stable (currently 5.90.21). The package wraps TanStack Query hooks — consumer must provide it. Supports React 18+.             |
| `next-safe-action`      | `^8.0.0`               | Type-safe Next.js server actions          | **Optional** | Only needed for server-side pattern. Mark as optional in `peerDependenciesMeta`. v8.0.11 is current, uses Standard Schema.           |
| `zod`                   | `^3.24.0`              | Schema validation for server actions      | **Optional** | Only needed alongside `next-safe-action` for input validation. Pin to v3 — see Zod section below.                                    |
| `viem`                  | `^2.0.0`               | Ethereum address types (`Address`, `Hex`) | **Optional** | Only needed if consumer uses `Address`-typed parameters. The hooks package re-exports utility types but doesn't call viem functions. |

### peerDependenciesMeta

```json
{
  "peerDependenciesMeta": {
    "next-safe-action": { "optional": true },
    "zod": { "optional": true },
    "viem": { "optional": true }
  }
}
```

This allows consumers to install ONLY client-side hooks (React + TanStack Query) without Next.js/Zod/Viem.

## Dev Dependencies (Build-time only — not shipped)

### GraphQL Codegen Pipeline

| Library                          | Version   | Purpose                    | Rationale                                                                                                                                                                                                 |
| -------------------------------- | --------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@graphql-codegen/cli`           | `^6.1.1`  | Codegen CLI runner         | Orchestrates type generation from Hasura schema. v6 is current stable.                                                                                                                                    |
| `@graphql-codegen/client-preset` | `^5.2.2`  | **The** recommended preset | Generates `graphql()` function + `TypedDocumentString` types. Replaces the old plugin-per-library approach. Includes `@graphql-codegen/typescript` + `@graphql-codegen/typescript-operations` internally. |
| `@graphql-codegen/schema-ast`    | `^5.0.0`  | Schema file generation     | Generates a local `.graphql` schema file from Hasura endpoint introspection. Used as codegen input for IDE tooling.                                                                                       |
| `@graphql-codegen/introspection` | `^5.0.0`  | Introspection JSON output  | Generates `introspection.json` for tooling/testing. Optional but useful.                                                                                                                                  |
| `@0no-co/graphqlsp`              | `^1.15.2` | TypeScript LSP plugin      | Provides GraphQL auto-complete in VSCode when writing queries with `graphql()`. Recommended by official codegen docs.                                                                                     |
| `@parcel/watcher`                | `^2.1.0`  | Watch mode for codegen     | Enables `--watch` flag on `graphql-codegen` CLI. Optional peer dep of `@graphql-codegen/cli`.                                                                                                             |

### Build Tooling

| Library      | Version  | Purpose             | Rationale                                                                                                                                                                                                                                             |
| ------------ | -------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsup`       | `^8.5.1` | Package bundler     | **Recommended over unbuild.** esbuild-powered, generates ESM + CJS dual output, auto-generates `.d.ts` declarations, handles `"use client"` directives. Used by TanStack Query itself. Simpler config than unbuild, better React ecosystem alignment. |
| `typescript` | `^5.9.2` | TypeScript compiler | Match monorepo root version. Used by tsup for `.d.ts` generation.                                                                                                                                                                                     |

### Testing

| Library                        | Version   | Purpose                      | Rationale                                                                                                                                                                                                                                |
| ------------------------------ | --------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest`                       | `^3.2.0`  | Test runner                  | **Pin to v3.x, NOT v4.x.** v4.0.18 is `latest` on npm but requires Node >=20 and has breaking changes. v3 is the LTS-equivalent for production packages. esbuild-powered, native ESM, compatible with vitest workspace in pnpm monorepo. |
| `@testing-library/react`       | `^16.3.2` | React component/hook testing | Standard for testing React hooks. v16 supports React 18+19.                                                                                                                                                                              |
| `@testing-library/react-hooks` | —         | **DO NOT ADD**               | Merged into `@testing-library/react` v13+. The `renderHook` API is built-in now.                                                                                                                                                         |
| `msw`                          | `^2.x`    | API mocking                  | Mock GraphQL responses in tests without a real Hasura endpoint. MSW v2 is the current line with native ESM support.                                                                                                                      |
| `happy-dom`                    | `^20.x`   | DOM environment for vitest   | Lighter than jsdom, sufficient for hook testing (no real DOM rendering needed).                                                                                                                                                          |

### Type Checking & Quality

| Library    | Version           | Purpose    | Rationale                                                    |
| ---------- | ----------------- | ---------- | ------------------------------------------------------------ |
| `eslint`   | Use monorepo root | Linting    | Already configured at monorepo root with `eslint.config.ts`. |
| `prettier` | Use monorepo root | Formatting | Already configured at monorepo root.                         |

## Codegen Configuration

The codegen pipeline runs against the Hasura GraphQL endpoint and generates TypeScript types from the schema.

### Recommended `codegen.ts`

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Introspect from Hasura endpoint (requires HASURA_GRAPHQL_URL env var)
  // Falls back to local schema file for CI/offline development
  schema: process.env.HASURA_GRAPHQL_URL || './schema.graphql',
  documents: ['src/documents/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    // Generated types + graphql() function
    './src/graphql/': {
      preset: 'client',
      config: {
        documentMode: 'string', // String literals, not AST — smaller bundles
        useTypeImports: true, // import type {} for TS 5.x
        enumsAsTypes: true, // string unions, not TS enums — better for .d.ts
        scalars: {
          DateTime: 'string', // Hasura DateTime → string
          BigInt: 'string', // BigInt scalars as string (Hasura uses numeric strings)
          numeric: 'string', // PostgreSQL numeric type
        },
      },
    },
    // Local schema file for IDE tooling and offline development
    './schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;
```

### Why `client-preset` over `typescript-react-query` plugin

| Approach            | `client-preset` (Recommended)                    | `typescript-react-query` plugin |
| ------------------- | ------------------------------------------------ | ------------------------------- |
| **Official status** | The Guild's recommended approach                 | Community plugin, separate repo |
| **Flexibility**     | Works with ANY client (TanStack, SWR, raw fetch) | Locked to React Query           |
| **Bundle size**     | `documentMode: 'string'` = string literals       | Full AST objects                |
| **Maintenance**     | Core team, frequent updates                      | Community, less frequent        |
| **Pattern**         | You write thin hook wrappers around `execute()`  | Auto-generates hooks            |
| **Customization**   | Full control over hook API                       | Limited config options          |

The `client-preset` approach gives us full control over the hook API design while still getting complete type safety. The auto-generated hooks from `typescript-react-query` would conflict with our custom service → hook → action architecture.

**Confidence: HIGH** — Verified via official GraphQL Codegen docs (fetched 2026-02-16).

## Build Tooling: tsup vs unbuild

| Criterion                 | tsup ^8.5.1                                 | unbuild ^3.6.1              |
| ------------------------- | ------------------------------------------- | --------------------------- |
| **Engine**                | esbuild                                     | rollup + esbuild (mkdist)   |
| **Config complexity**     | Minimal (~10 lines)                         | Minimal (~10 lines)         |
| **Dual ESM/CJS**          | First-class                                 | First-class                 |
| **DTS generation**        | Built-in (rollup-plugin-dts)                | Built-in (mkdist)           |
| **`"use client"` banner** | `banner: { js: '"use client";' }` per entry | Requires custom plugin      |
| **React ecosystem usage** | TanStack Query, Zustand, Jotai              | Nuxt, Nitro, UnJS ecosystem |
| **Tree-shaking**          | Good (esbuild)                              | Good (rollup)               |
| **Watch mode**            | Built-in                                    | Built-in                    |
| **Monorepo support**      | Works with pnpm workspaces                  | Works with pnpm workspaces  |

**Recommendation: tsup** — It's what TanStack Query itself uses for building. Better alignment with the React ecosystem. The `"use client"` directive banner support is crucial for Next.js App Router compatibility, and tsup handles it simply via the `banner` config option.

**Confidence: HIGH** — Verified from TanStack Query's own `package.json` (uses `tsup` in build scripts) and npm registry data.

### Recommended `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  // Client hooks (need "use client" banner)
  {
    entry: {
      client: 'src/client/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    banner: { js: '"use client";' },
    external: ['react', '@tanstack/react-query'],
  },
  // Server actions + core (no "use client" banner)
  {
    entry: {
      index: 'src/index.ts',
      server: 'src/server/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['react', '@tanstack/react-query', 'next-safe-action', 'zod'],
  },
]);
```

## Vitest Configuration

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/graphql/**', 'src/test/**'],
    },
  },
});
```

**Why vitest ^3.x (not ^4.x):** Vitest 4.0 was released recently and is tagged `latest` on npm. However:

- v4 drops Node 18 support (requires >=20)
- v4 has breaking changes in config and API
- v4 peer-deps on `vite ^6 || ^7`
- v3 is still actively maintained and more battle-tested

For a library package, stability matters more than bleeding-edge. Pin to `^3.2.0` and upgrade to v4 when the ecosystem stabilizes.

**Confidence: HIGH** — Verified via npm registry metadata for vitest v4.0.18 (`engines.node: "^20.0.0 || ^22.0.0 || >=24.0.0"`).

## Zod v3 vs v4 Decision

| Criterion            | Zod v3 (`^3.24.1`)                  | Zod v4 (`^4.3.6`)                                                        |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| **npm `latest` tag** | No (superseded)                     | Yes (current)                                                            |
| **Stability**        | Battle-tested, 3+ years             | Released ~2025, still maturing                                           |
| **next-safe-action** | Supported via Standard Schema       | Supported via Standard Schema                                            |
| **API changes**      | Established API                     | Breaking changes (`.optional()` behavior, `z.interface()` for optionals) |
| **Ecosystem**        | All tutorials/examples reference v3 | Limited adoption                                                         |
| **Bundle size**      | Larger                              | ~57% smaller (per Zod v4 announcement)                                   |

**Recommendation: Zod v3 (`^3.24.1`)** — `next-safe-action` v8 uses Standard Schema, so it works with both. Since this is a library consumed by external apps, and most apps today still use Zod v3, pinning to v3 avoids forcing consumers to adopt a breaking upgrade. The package should specify `zod` with `"^3.24.0"` as an optional peer dep. Plan v4 migration as a separate effort.

**Confidence: HIGH** — Verified via npm registry (zod@4.3.6 is latest), next-safe-action docs (Standard Schema requirement).

## What NOT to Add (Anti-Recommendations)

### DO NOT add `@graphql-codegen/typescript-react-query`

**Why:** This community plugin auto-generates React Query hooks directly. It conflicts with our architecture where we have manual `service → hook → action` layers. The `client-preset` with `documentMode: 'string'` gives us typed operations that we wrap manually — more control, better DX, officially recommended.

### DO NOT add `@apollo/client` or `urql`

**Why:** These are full GraphQL client frameworks with caches, subscriptions, etc. Way too heavy for a hooks library that just needs to send queries. The typed `fetch` wrapper is the right abstraction — minimal (~30 LOC), no cache opinions, zero dependencies, works everywhere.

### DO NOT add `@tanstack/react-query-devtools`

**Why:** Devtools are a consumer concern, not a library concern. The consuming app adds devtools if they want them.

### DO NOT add `next` as a dependency or dev dependency

**Why:** The package must work without Next.js installed. `next-safe-action` is the only Next.js-adjacent dependency and it's an optional peer dep. Server action files use `"use server"` directive which is a React/Next convention but doesn't require the `next` package at build time.

### DO NOT add `@graphql-codegen/typescript` or `@graphql-codegen/typescript-operations` separately

**Why:** Both are included inside `@graphql-codegen/client-preset`. Installing them separately creates version conflicts.

### DO NOT add `dotenv` to the React package

**Why:** Environment variable handling is the consumer's responsibility. The package reads `process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL` (or similar) at runtime. The consumer configures env vars in their framework (Next.js `.env.local`, Vite `import.meta.env`, etc.).

### DO NOT add Zod v4 yet

**Why:** Breaking API changes, immature ecosystem adoption, and this is a library consumed by external apps. Wait for ecosystem to stabilize.

### DO NOT add `graphql-tag` (`gql`)

**Why:** With `client-preset` and `documentMode: 'string'`, the `graphql()` function from the generated code replaces `gql`. The generated `graphql()` function provides full type inference. No need for `graphql-tag`.

## Integration with Existing Monorepo

### Schema Source

The `packages/typeorm/schema.graphql` (925 lines, 72+ entity types) defines the data model. Hasura auto-generates its GraphQL API from the TypeORM/PostgreSQL schema. The codegen pipeline introspects the Hasura endpoint (which includes Hasura's auto-generated query/mutation types with filtering, ordering, pagination) to produce TypeScript types.

**Important distinction:** `packages/typeorm/schema.graphql` is a Subsquid schema definition (entity types with `@entity` directives). The Hasura GraphQL schema is DIFFERENT — it includes `where` clauses, `order_by`, `limit`, `offset`, aggregate queries, etc. The codegen must introspect Hasura, not read `schema.graphql` directly.

### Workspace Integration

```yaml
# pnpm-workspace.yaml (already configured)
packages:
  - 'packages/*'
```

The new package at `packages/react` will automatically be part of the workspace. It should:

- NOT depend on `@chillwhales/typeorm` — the React package is decoupled from the indexer
- Use its own `tsconfig.json` (different target: ES2020 for browser compat, `"jsx": "react-jsx"`)
- Use its own build pipeline (tsup, not tsc)
- Share monorepo root ESLint and Prettier configs

### Package Naming

```json
{
  "name": "@lsp-indexer/react",
  "version": "0.1.0"
}
```

Follows the decided `@lsp-indexer/*` naming convention (indexer-specific, not org-specific).

### GraphQL URL Configuration

The package is framework-agnostic — it does NOT hardcode `process.env.NEXT_PUBLIC_*` or any framework-specific env var convention. The consuming app provides the GraphQL URL via the provider:

```typescript
// Consumer usage — the consuming app resolves the URL however it wants
<LspIndexerProvider graphqlUrl="https://my-hasura.example.com/v1/graphql">
  <App />
</LspIndexerProvider>
```

```typescript
// Next.js consumer example (env var is the consumer's concern, not the library's)
<LspIndexerProvider graphqlUrl={process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!}>
  <App />
</LspIndexerProvider>

// Vite consumer example
<LspIndexerProvider graphqlUrl={import.meta.env.VITE_HASURA_GRAPHQL_URL}>
  <App />
</LspIndexerProvider>
```

The library provides the provider + context; how the URL is derived (env vars, runtime config, hardcoded) is the consumer's responsibility. This keeps the library framework-agnostic and avoids `process.env` assumptions that break in non-Node.js environments.

## Package Exports Structure

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./client": {
      "types": "./dist/client.d.ts",
      "import": "./dist/client.js",
      "require": "./dist/client.cjs"
    },
    "./server": {
      "types": "./dist/server.d.ts",
      "import": "./dist/server.js",
      "require": "./dist/server.cjs"
    }
  },
  "files": ["dist", "README.md"],
  "sideEffects": false
}
```

Three entry points:

- `@lsp-indexer/react` — Core types, config, GraphQL client
- `@lsp-indexer/react/client` — Client-side TanStack Query hooks (has `"use client"` banner)
- `@lsp-indexer/react/server` — Server-side next-safe-action wrappers (optional Next.js import)

## Installation Commands

### For the package itself (in `packages/react`)

```bash
# Runtime dependencies
pnpm add graphql-ws

# Dev dependencies — codegen (graphql is build-time only)
pnpm add -D graphql @graphql-codegen/cli @graphql-codegen/client-preset @graphql-codegen/schema-ast @graphql-codegen/introspection @parcel/watcher @0no-co/graphqlsp

# Dev dependencies — build
pnpm add -D tsup typescript

# Dev dependencies — testing
pnpm add -D vitest@^3 @testing-library/react happy-dom msw

# Dev dependencies — peer deps for development/testing
pnpm add -D react react-dom @types/react @types/react-dom @tanstack/react-query next-safe-action zod viem
```

### For consuming apps

```bash
# Minimum (client-side hooks only)
pnpm add @lsp-indexer/react @tanstack/react-query react

# Full (client + server patterns)
pnpm add @lsp-indexer/react @tanstack/react-query react next-safe-action zod
```

## Version Summary Table

| Package                          | Recommended      | Latest on npm                    | Notes                                           |
| -------------------------------- | ---------------- | -------------------------------- | ----------------------------------------------- |
| ~~`graphql-request`~~            | ~~`^7.4.0`~~     | ~~7.4.0~~                        | **REMOVED** — replaced by typed `fetch` wrapper |
| `graphql`                        | `^16.12.0` (dev) | 16.12.0                          | **Dev only** — codegen build-time, not shipped  |
| `graphql-ws`                     | `^6.0.0`         | 6.x                              | WebSocket subscriptions runtime dep             |
| `@tanstack/react-query`          | `^5.0.0` (peer)  | 5.90.21                          | Very active, weekly releases                    |
| `next-safe-action`               | `^8.0.0` (peer)  | 8.0.11                           | Uses Standard Schema, stable                    |
| `zod`                            | `^3.24.0` (peer) | 4.3.6 (latest), 3.24.4 (v3 line) | Intentionally pin to v3 — see rationale         |
| `viem`                           | `^2.0.0` (peer)  | 2.46.1                           | Very active, weekly releases                    |
| `@graphql-codegen/cli`           | `^6.1.1` (dev)   | 6.1.1                            | Current stable                                  |
| `@graphql-codegen/client-preset` | `^5.2.2` (dev)   | 5.2.2                            | Current stable                                  |
| `@graphql-codegen/schema-ast`    | `^5.0.0` (dev)   | 5.0.0                            | Current stable                                  |
| `tsup`                           | `^8.5.1` (dev)   | 8.5.1                            | Current stable                                  |
| `vitest`                         | `^3.2.0` (dev)   | 4.0.18 (latest)                  | Intentionally pin to v3 — see rationale         |
| `@testing-library/react`         | `^16.3.2` (dev)  | 16.3.2                           | Current stable                                  |
| `happy-dom`                      | `^20.0.0` (dev)  | 20.x                             | Current stable                                  |
| `msw`                            | `^2.0.0` (dev)   | 2.x                              | Current stable                                  |
| `@0no-co/graphqlsp`              | `^1.15.2` (dev)  | 1.15.2                           | Current stable                                  |
| `@parcel/watcher`                | `^2.1.0` (dev)   | 2.x                              | For codegen watch mode                          |
| `typescript`                     | `^5.9.2` (dev)   | 5.9.2                            | Match monorepo root                             |

## Sources

- **npm registry** — All version numbers verified via direct `registry.npmjs.org` API fetches (2026-02-16) — HIGH confidence
- **GraphQL Codegen React Query guide** — https://the-guild.dev/graphql/codegen/docs/guides/react-query (fetched 2026-02-16) — HIGH confidence
- **GraphQL Codegen client-preset docs** — https://the-guild.dev/graphql/codegen/plugins/presets/preset-client (fetched 2026-02-16) — HIGH confidence
- **next-safe-action docs** — https://next-safe-action.dev/docs/getting-started (fetched 2026-02-16) — HIGH confidence
- **TanStack Query package.json** — Confirmed tsup usage from npm registry build scripts — HIGH confidence
- **graphql-request GitHub** — https://github.com/graffle-js/graffle/tree/graphql-request (fetched 2026-02-16) — HIGH confidence
- **Monorepo codebase** — Direct file reads of `package.json`, `tsconfig.json`, `schema.graphql`, `.env.example` — HIGH confidence

---

_Researched: 2026-02-16_

# Feature Landscape: React Hooks Package for LUKSO Indexer Data

**Domain:** React hooks library wrapping GraphQL/Hasura indexer data
**Researched:** 2026-02-16
**Mode:** Ecosystem — how production-quality React hooks packages work
**Confidence:** HIGH (patterns verified from TanStack Query docs, wagmi source, GraphQL Codegen docs, tRPC patterns)

---

## Executive Summary

A production-quality React hooks package for consuming GraphQL/indexer data must solve three core problems: **type-safe data fetching** (GraphQL codegen → TypeScript types → typed hooks), **intelligent caching** (TanStack Query key factories, stale-while-revalidate, prefetching), and **dual consumption** (client-side direct fetching AND server-side via Next.js server actions).

The best-in-class packages in this space — wagmi, tRPC, and Apollo Client — all converge on the same fundamental pattern: a thin hook layer over TanStack Query that provides domain-specific convenience while exposing the full TanStack Query API for advanced use cases. The key differentiator for great DX is **how little a new developer needs to learn** before being productive.

For the `@lsp-indexer/react` package specifically, the 11 query domains (profiles, assets, NFTs, follows, etc.) map cleanly to per-domain hook files with a unified barrel export. The existing reference implementation in `chillwhales/marketplace` (services → server actions → hooks) provides a proven pattern to extract and generalize.

---

## Table Stakes

Features users expect from any quality hooks package. Missing = package feels amateur or unusable.

### TS-1: GraphQL Codegen Pipeline (Types from Hasura Schema)

| Aspect             | Detail                                                                                                                                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | Without generated types, every hook return value is `any` — defeats the entire purpose of a typed hooks package                                                                                                                                                                          |
| **Complexity**     | Medium                                                                                                                                                                                                                                                                                   |
| **Dependencies**   | Hasura endpoint or introspected schema file; `@graphql-codegen/cli` + `client` preset                                                                                                                                                                                                    |
| **Example**        | GraphQL Code Generator `client` preset with `documentMode: 'string'` — generates `TypedDocumentString` containers that carry both the query string and its TypeScript result/variables types                                                                                             |
| **Recommendation** | Use `@graphql-codegen/cli` with the `client` preset. Point schema at `packages/typeorm/schema.graphql` (local) or Hasura endpoint (remote). Write `.graphql` document files per domain, generate types + typed document strings. Commit generated types (not generated at install time). |

**Source:** [GraphQL Codegen React Query guide](https://the-guild.dev/graphql/codegen/docs/guides/react-query) — HIGH confidence, verified Feb 2026.

**Key pattern from docs:**

```typescript
// codegen generates TypedDocumentString with result + variable types
const ProfileQuery = graphql(`
  query UniversalProfile($address: String!) {
    universalProfileById(id: $address) { id name ... }
  }
`);

// execute() function provides type-safe execution
async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult>;
```

### TS-2: TanStack Query Integration with Query Key Factories

| Aspect             | Detail                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | TanStack Query is the standard React async state manager; query keys enable cache invalidation, prefetching, and SSR hydration                                   |
| **Complexity**     | Medium                                                                                                                                                           |
| **Dependencies**   | `@tanstack/react-query` v5                                                                                                                                       |
| **Example**        | wagmi exports `queryKey` from every hook AND `get<X>QueryOptions` for vanilla JS usage outside React components                                                  |
| **Recommendation** | Create a `queryKeys` factory per domain that returns hierarchical keys. Export both hooks (React) and `get<X>QueryOptions` functions (vanilla JS / server-side). |

**Source:** [TanStack Query docs — Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys), [wagmi TanStack Query guide](https://wagmi.sh/react/guides/tanstack-query) — HIGH confidence.

**Key pattern (query key factory):**

```typescript
// Hierarchical query keys enable granular invalidation
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters: ProfileFilters) => [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (address: string) => [...profileKeys.details(), address] as const,
};

// queryClient.invalidateQueries({ queryKey: profileKeys.all })  ← invalidates everything
// queryClient.invalidateQueries({ queryKey: profileKeys.detail('0x...') }) ← just one
```

**wagmi pattern (dual export):**

```typescript
// Hook returns queryKey for React usage
const { data, queryKey } = useProfile({ address });

// getProfileQueryOptions for vanilla/server usage
import { getProfileQueryOptions } from '@lsp-indexer/react/query';
const options = getProfileQueryOptions(config, { address });
queryClient.prefetchQuery(options);
```

### TS-3: Per-Domain Hook Coverage (All 11 Query Domains)

| Aspect             | Detail                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Why Expected**   | Each domain has distinct queries, variables, and return shapes — developers need a hook for each             |
| **Complexity**     | High (11 domains × multiple queries each = 20-40 hooks total)                                                |
| **Dependencies**   | TS-1 (codegen types), TS-2 (TanStack Query integration)                                                      |
| **Example**        | wagmi has 40+ hooks, one per operation (useBalance, useBlock, useReadContract, etc.)                         |
| **Recommendation** | One hook per distinct query operation, organized in per-domain files. NOT one mega-hook with mode switching. |

**The 11 domains and their primary hooks:**

| Domain                    | Primary Hooks                                    | Variables                           |
| ------------------------- | ------------------------------------------------ | ----------------------------------- |
| Universal Profiles        | `useProfile`, `useProfiles`, `useProfileSearch`  | `address`, `search`, `limit/offset` |
| Digital Assets            | `useDigitalAsset`, `useDigitalAssets`            | `address`, `filters`                |
| NFTs                      | `useNft`, `useNfts`, `useNftsByCollection`       | `id`, `collection`, `owner`         |
| Owned Assets              | `useOwnedAssets`, `useOwnedTokens`               | `ownerAddress`                      |
| Follows/Social            | `useFollowers`, `useFollowing`, `useFollowCount` | `address`                           |
| Creator Addresses         | `useCreatorAddresses`                            | `assetAddress`                      |
| LSP29 Encrypted Assets    | `useEncryptedAsset`, `useEncryptedAssets`        | `address`, `assetAddress`           |
| LSP29 Feed                | `useEncryptedAssetFeed`                          | `limit/offset`                      |
| Data Changed              | `useDataChangedEvents`                           | `address`, `dataKey`                |
| Universal Receiver Events | `useUniversalReceiverEvents`                     | `address`                           |
| UP Stats                  | `useProfileStats`                                | `address`                           |

### TS-4: Service Layer (Framework-Agnostic Data Fetching)

| Aspect             | Detail                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | Hooks should not contain GraphQL execution logic directly — a service layer enables both client-side and server-side consumption                                                      |
| **Complexity**     | Medium                                                                                                                                                                                |
| **Dependencies**   | Typed `fetch` wrapper (~30 LOC) — zero runtime deps (replaces `graphql-request` from reference implementation)                                                                        |
| **Example**        | tRPC has a clear client → router → procedure separation; the reference marketplace has services as the data layer                                                                     |
| **Recommendation** | Each domain gets a service class/module that handles GraphQL execution. Hooks call services. Server actions call services. Services are the single source of truth for data fetching. |

**Pattern:**

```
Hook (useProfile) → Service (profileService.getByAddress) → execute() (typed fetch) → Hasura
ServerAction (getProfile) → Service (profileService.getByAddress) → execute() (typed fetch) → Hasura
```

### TS-5: Provider Pattern (Create-or-Reuse QueryClient)

| Aspect             | Detail                                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | Apps that already have TanStack Query set up must not be forced to create a second QueryClient                                                                                                                    |
| **Complexity**     | Low                                                                                                                                                                                                               |
| **Dependencies**   | `@tanstack/react-query`                                                                                                                                                                                           |
| **Example**        | wagmi's `WagmiProvider` wraps `QueryClientProvider` but accepts an external `queryClient` prop; if the consumer already has one, they pass it in                                                                  |
| **Recommendation** | Export a `LuksoIndexerProvider` that accepts an optional `queryClient`. If none provided, create one internally. If provided, use the existing one. Always nest inside existing `QueryClientProvider` if present. |

**Source:** [wagmi WagmiProvider docs](https://wagmi.sh/react/api/WagmiProvider) — HIGH confidence.

**Key pattern:**

```typescript
// Option A: Package creates its own QueryClient
<LuksoIndexerProvider graphqlUrl="https://...">
  <App />
</LuksoIndexerProvider>

// Option B: Consumer provides existing QueryClient (e.g., already using TanStack Query)
<QueryClientProvider client={myQueryClient}>
  <LuksoIndexerProvider graphqlUrl="https://..." queryClient={myQueryClient}>
    <App />
  </LuksoIndexerProvider>
</QueryClientProvider>
```

### TS-6: Environment-Driven Configuration

| Aspect             | Detail                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | GraphQL URL, default stale times, and other config must come from environment, not hardcoded                                                                                      |
| **Complexity**     | Low                                                                                                                                                                               |
| **Dependencies**   | None                                                                                                                                                                              |
| **Example**        | wagmi's `createConfig()`, tRPC's `createTRPCReact()` — both use a config object                                                                                                   |
| **Recommendation** | Export a `createIndexerConfig()` that accepts `graphqlUrl` and optional overrides. Provider reads from config. Env var fallback: `NEXT_PUBLIC_GRAPHQL_URL` or `VITE_GRAPHQL_URL`. |

### TS-7: Error Handling (GraphQL + Network Errors)

| Aspect             | Detail                                                                                                                                                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | GraphQL errors are structurally different from HTTP errors; Hasura permission errors have specific shapes; developers need typed error objects                                                                                                                                                  |
| **Complexity**     | Medium                                                                                                                                                                                                                                                                                          |
| **Dependencies**   | TS-4 (service layer handles error normalization)                                                                                                                                                                                                                                                |
| **Example**        | Apollo Client has `ApolloError` with `graphQLErrors` + `networkError` separation; wagmi has typed `ConnectorAlreadyConnectedError` etc.                                                                                                                                                         |
| **Recommendation** | Create an `IndexerError` class that distinguishes: (1) network errors (server unreachable), (2) GraphQL errors (returned in `errors[]` array), (3) Hasura permission errors (specific error codes). The service layer catches and normalizes; hooks surface via TanStack Query's `error` field. |

**GraphQL error structure from Hasura:**

```typescript
// Network error (HTTP 500, timeout, etc.)
{ type: 'network', message: string, status?: number }

// GraphQL error (query syntax, validation)
{ type: 'graphql', errors: Array<{ message: string, extensions?: { code: string } }> }

// Hasura permission error (role-based access)
{ type: 'permission', message: 'field "X" not found in type', path: string[] }

// Partial data (GraphQL can return data + errors simultaneously)
{ type: 'partial', data: T, errors: GraphQLError[] }
```

### TS-8: Pagination Support (Offset-Based for Hasura)

| Aspect             | Detail                                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | Many query domains return lists (assets, NFTs, followers, events) that need pagination                                                                                                                                            |
| **Complexity**     | Medium                                                                                                                                                                                                                            |
| **Dependencies**   | TS-2 (TanStack Query), Hasura's `limit`/`offset` pagination                                                                                                                                                                       |
| **Example**        | TanStack Query's `useInfiniteQuery` with `getNextPageParam`                                                                                                                                                                       |
| **Recommendation** | Use `useInfiniteQuery` for list queries. Hasura supports `limit`/`offset` natively. `getNextPageParam` calculates next offset from current page length. Export both paginated (`useInfiniteX`) and single-page (`useX`) variants. |

**Source:** [TanStack Query Infinite Queries docs](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries) — HIGH confidence.

**Key pattern for offset pagination (Hasura-compatible):**

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: profileKeys.list(filters),
  queryFn: ({ pageParam = 0 }) =>
    profileService.list({ ...filters, offset: pageParam, limit: PAGE_SIZE }),
  initialPageParam: 0,
  getNextPageParam: (lastPage, _allPages, lastPageParam) => {
    // Hasura doesn't return cursor; use offset arithmetic
    if (lastPage.length < PAGE_SIZE) return undefined; // no more pages
    return lastPageParam + PAGE_SIZE;
  },
});
```

---

## Differentiators

Features that would set this package apart. Not expected, but make the package excellent for new developers.

### DF-1: Dual-Mode Hooks (Client-Side + Server Actions)

| Aspect                | Detail                                                                                                                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | New developers using Next.js App Router can use the same hooks whether they're fetching client-side or via server actions — zero configuration change                                                                                                    |
| **Complexity**        | High                                                                                                                                                                                                                                                     |
| **Dependencies**      | TS-4 (service layer), `next-safe-action`                                                                                                                                                                                                                 |
| **Example**           | tRPC seamlessly supports both RSC and client components; the reference marketplace already has this pattern                                                                                                                                              |
| **Recommendation**    | Each domain exports: (1) `useProfile()` — client-side hook calling service directly, (2) `useProfileAction()` — hook calling server action that calls service. The server action pattern works in Next.js App Router; the direct pattern works anywhere. |

**Architecture:**

```
Client-side path:  useProfile() → profileService.getByAddress() → execute() (typed fetch) → Hasura
Server-side path:  useProfileAction() → getProfileAction (server action) → profileService.getByAddress() → execute() (typed fetch) → Hasura
```

**Why both?** Server actions add security (GraphQL URL never exposed to client), caching benefits (server-side cache), and work in RSC. Direct hooks work in any React app, not just Next.js.

### DF-2: Query Key Exports for Cache Management

| Aspect                | Detail                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | Consumers can invalidate, prefetch, and manage cache for specific domains without knowing internal key structure                                                           |
| **Complexity**        | Low                                                                                                                                                                        |
| **Dependencies**      | TS-2 (query key factories)                                                                                                                                                 |
| **Example**           | wagmi exports `queryKey` from every hook AND `get<X>QueryOptions` for vanilla JS. This is a hallmark of well-designed TanStack Query wrappers.                             |
| **Recommendation**    | Export query key factories from a `@lsp-indexer/react/keys` entrypoint. Consumers use them for invalidation after mutations, prefetching on navigation, and SSR hydration. |

**Usage example:**

```typescript
import { profileKeys, assetKeys } from '@lsp-indexer/react/keys';

// After a profile update mutation, invalidate all profile queries
queryClient.invalidateQueries({ queryKey: profileKeys.all });

// Prefetch asset data on hover
queryClient.prefetchQuery({
  queryKey: assetKeys.detail(assetAddress),
  queryFn: () => assetService.getByAddress(assetAddress),
});
```

### DF-3: SSR Hydration Support (Next.js App Router)

| Aspect                | Detail                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | Zero-flash loading: data fetched on server is immediately available on client without a loading state                                                                                       |
| **Complexity**        | Medium                                                                                                                                                                                      |
| **Dependencies**      | TS-2, TS-5 (provider), `@tanstack/react-query` SSR features                                                                                                                                 |
| **Example**           | TanStack Query's `dehydrate`/`HydrationBoundary` pattern; wagmi's SSR guide                                                                                                                 |
| **Recommendation**    | Export `prefetchProfile`, `prefetchAssets`, etc. functions that work in Next.js `generateMetadata` or RSC. Provide a `HydrationBoundary` example in docs. Don't force SSR — make it opt-in. |

**Source:** [wagmi SSR guide](https://wagmi.sh/react/guides/ssr), TanStack Query Advanced SSR docs — HIGH confidence.

**Pattern:**

```typescript
// In server component (page.tsx)
import { getProfileQueryOptions } from '@lsp-indexer/react/query'

export default async function ProfilePage({ params }) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(getProfileQueryOptions(config, { address: params.address }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileComponent address={params.address} />
    </HydrationBoundary>
  )
}
```

### DF-4: `select` Transforms for Common Data Shapes

| Aspect                | Detail                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Value Proposition** | Many consumers need the same data transformations (e.g., profile with resolved images, asset with formatted balance). Pre-built selectors save repetitive work.    |
| **Complexity**        | Low-Medium                                                                                                                                                         |
| **Dependencies**      | TS-1 (types)                                                                                                                                                       |
| **Example**           | TanStack Query's `select` option for derived data without extra re-renders                                                                                         |
| **Recommendation**    | Export common selector functions: `selectProfileWithImages`, `selectAssetWithFormattedBalance`, `selectNftWithAttributes`. Consumers pass them as `select` option. |

**Pattern:**

```typescript
// Package exports pre-built selectors
export const selectProfileWithImages = (profile: RawProfile) => ({
  ...profile,
  avatarUrl: profile.lsp3Profile?.profileImage?.[0]?.url,
  backgroundUrl: profile.lsp3Profile?.backgroundImage?.[0]?.url,
});

// Consumer uses via select option
const { data } = useProfile({ address, select: selectProfileWithImages });
// data.avatarUrl is typed and available
```

### DF-5: Comprehensive TypeScript Types Export

| Aspect                | Detail                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | Consumers can import types for function parameters, component props, and other typed usage without reaching into codegen internals                 |
| **Complexity**        | Low                                                                                                                                                |
| **Dependencies**      | TS-1 (codegen)                                                                                                                                     |
| **Example**           | wagmi exports all types from `wagmi` and utility types from `wagmi/chains`                                                                         |
| **Recommendation**    | Re-export all codegen types from `@lsp-indexer/react/types`. Include utility types like `ProfileAddress`, `AssetAddress`, `NftId`, `TokenBalance`. |

### DF-6: Stale Time Defaults Per Domain

| Aspect                | Detail                                                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | Profile metadata changes rarely (staleTime: 5min), follower counts change moderately (staleTime: 30s), event lists change frequently (staleTime: 10s). Smart defaults reduce unnecessary refetches. |
| **Complexity**        | Low                                                                                                                                                                                                 |
| **Dependencies**      | TS-2, TS-6 (config)                                                                                                                                                                                 |
| **Example**           | wagmi uses different stale times for different query types                                                                                                                                          |
| **Recommendation**    | Set domain-specific `staleTime` defaults in config. Allow per-hook override. Profile/asset metadata: 5 min. Follower counts: 30s. Events: 10s. All overridable.                                     |

---

## Anti-Features

Things to deliberately NOT build in v1.1. Common mistakes in this domain.

### AF-1: Do NOT Build a Custom Cache Layer

| Anti-Feature                                                             | Why Avoid                                                                                                                                                                                                | What to Do Instead                                                                                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Custom in-memory cache, localStorage persistence, or deduplication logic | TanStack Query already provides all of this. Building custom caching creates bugs, stale data, and maintenance burden. Every major hooks library (wagmi, Apollo, tRPC) relies on TanStack Query's cache. | Use TanStack Query's built-in cache. For persistence, point users to `@tanstack/query-sync-storage-persister` (as wagmi does). |

### AF-2: Do NOT Build Advanced Real-Time Patterns Beyond Baseline Subscriptions

| Anti-Feature                                                                     | Why Avoid                                                                                                                                                                                                                                         | What to Do Instead                                                                                                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Polling, presence indicators, real-time notifications UX, optimistic sub updates | Baseline `graphql-ws` subscriptions (SUB-01–SUB-03) are in-scope for v1.1. But advanced patterns like polling fallbacks, presence systems, or complex optimistic UI on subscription events add significant complexity beyond the transport layer. | Ship baseline subscription hooks via `graphql-ws` in Phase 10. Defer advanced real-time UX patterns (presence, notifications, polling fallback) to v1.2. |

### AF-3: Do NOT Build Mutations/Write Hooks

| Anti-Feature                                                 | Why Avoid                                                                                                                                                                                                    | What to Do Instead                                                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useFollow()`, `useTransfer()`, or any write operation hooks | The indexer is **read-only**. Write operations happen on-chain via wallets, not through the indexer. Building write hooks would create confusion about the package's purpose and require wallet integration. | Package is explicitly read-only query hooks. Write operations are the consuming app's responsibility. After writes, consumers can invalidate relevant query keys. |

### AF-4: Do NOT Build Complex Query Composition/Joins

| Anti-Feature                                                                                              | Why Avoid                                                                                                                                      | What to Do Instead                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hooks that combine multiple GraphQL queries into a single hook (e.g., `useProfileWithAssetsAndFollowers`) | GraphQL already supports nested queries. Hasura generates these relationships automatically. Client-side joins are slower and harder to cache. | Let consumers compose: `useProfile` + `useOwnedAssets` in the same component. Or write a single GraphQL query that uses Hasura's relationship fields. Don't pre-compose at the hook level. |

### AF-5: Do NOT Build Apollo Client / urql Adapters

| Anti-Feature                                                                   | Why Avoid                                                                                                                                                                                    | What to Do Instead                                                                                                                                  |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Support for multiple GraphQL client libraries beyond the typed `fetch` wrapper | Dramatically increases maintenance surface. The package uses a ~30 LOC typed `fetch` wrapper (zero deps, no framework lock-in). Supporting Apollo and urql means tripling the service layer. | Ship with the typed `fetch` wrapper. It's zero deps, works everywhere. Consumers who want Apollo can use the generated types with their own client. |

### AF-6: Do NOT Build Automatic Schema Watching/Hot Reload

| Anti-Feature                                                                               | Why Avoid                                                                                                                                                      | What to Do Instead                                                                                                                |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Runtime schema introspection, automatic type regeneration, or schema validation at startup | Adds runtime overhead, requires network access at init, and creates failure modes. Schema changes happen at deploy time (when Hasura updates), not at runtime. | Generate types at build time. Commit them. Consumers get types from npm package. Schema validation happens in CI, not at runtime. |

### AF-7: Do NOT Build a Full GraphQL Client Abstraction

| Anti-Feature                                                                        | Why Avoid                                                                                                                                                                                          | What to Do Instead                                                                                                                                                              |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A general-purpose `useGraphqlQuery()` hook that accepts arbitrary GraphQL documents | This is what `@apollo/client` and `urql` are for. Building a general-purpose GraphQL client duplicates their work. The value of this package is **domain-specific** hooks with **semantic names**. | Keep hooks domain-specific: `useProfile`, `useNft`, `useFollowers`. Not `useQuery(PROFILE_QUERY, { variables })`. The abstraction level is "LUKSO data," not "GraphQL queries." |

---

## Hook Pattern Recommendations

### Pattern 1: Hook → Service → Execute (The Layered Pattern)

**Recommended.** This is the pattern used by tRPC, the reference implementation, and most production hooks packages.

```
┌──────────────────────────────────────────┐
│  Hook Layer (React)                       │
│  useProfile({ address }) → useQuery({     │
│    queryKey: profileKeys.detail(address),  │
│    queryFn: () => profileService.get(addr) │
│  })                                        │
├──────────────────────────────────────────┤
│  Service Layer (Framework-agnostic)       │
│  profileService.get(address) → execute(   │
│    ProfileByAddressQuery, { address }     │
│  )                                         │
├──────────────────────────────────────────┤
│  Execute Layer (typed fetch wrapper)      │
│  execute(query, variables) → POST /graphql│
└──────────────────────────────────────────┘
```

**Why this pattern:**

- Services work in any context (client, server, tests)
- Hooks add only React/TanStack Query concerns
- Server actions are a thin wrapper around services
- Testing: mock at service layer, not at fetch layer

### Pattern 2: Hook Return Shape (wagmi-Style)

Every hook should return the full TanStack Query result plus `queryKey`:

```typescript
function useProfile(params: { address: string; enabled?: boolean; select?: (data: Profile) => T }) {
  const config = useIndexerConfig();
  const queryKey = profileKeys.detail(params.address);

  return {
    ...useQuery({
      queryKey,
      queryFn: () => profileService.getByAddress(config.graphqlUrl, params.address),
      enabled: params.enabled !== false && !!params.address,
      staleTime: config.staleTimes.profile,
      select: params.select,
    }),
    queryKey, // Expose for cache management
  };
}
```

### Pattern 3: Consistent Hook Options

All hooks accept the same base options for consistency:

```typescript
interface BaseHookOptions<TData, TSelected = TData> {
  enabled?: boolean; // Default: true (disabled when required params missing)
  select?: (data: TData) => TSelected; // Transform the data
  staleTime?: number; // Override default stale time
  refetchInterval?: number | false; // Polling interval
  // Full TanStack Query options passthrough via `query` prop
  query?: Partial<UseQueryOptions>;
}
```

---

## Query Domain Organization Recommendation

### Structure: Per-Domain Files with Barrel Export

```
packages/react/src/
├── config/
│   ├── context.ts              # React context for config
│   └── types.ts                # IndexerConfig type
├── provider/
│   └── LuksoIndexerProvider.tsx # Provider component
├── graphql/
│   ├── documents/              # .graphql files per domain
│   │   ├── universal-profile.graphql
│   │   ├── digital-asset.graphql
│   │   ├── nft.graphql
│   │   ├── owned-assets.graphql
│   │   ├── follow.graphql
│   │   ├── creator-addresses.graphql
│   │   ├── lsp29-encrypted-asset.graphql
│   │   ├── lsp29-feed.graphql
│   │   ├── data-changed.graphql
│   │   ├── universal-receiver.graphql
│   │   └── universal-profile-stats.graphql
│   └── generated/              # codegen output (committed)
│       ├── graphql.ts
│       └── fragment-masking.ts
├── services/
│   ├── execute.ts              # typed fetch wrapper (~30 LOC)
│   ├── universal-profile.ts
│   ├── digital-asset.ts
│   ├── nft.ts
│   ├── owned-assets.ts
│   ├── follow.ts
│   ├── creator-addresses.ts
│   ├── lsp29-encrypted-asset.ts
│   ├── lsp29-feed.ts
│   ├── data-changed.ts
│   ├── universal-receiver.ts
│   └── universal-profile-stats.ts
├── hooks/
│   ├── universal-profile.ts     # useProfile, useProfiles, useProfileSearch
│   ├── digital-asset.ts         # useDigitalAsset, useDigitalAssets
│   ├── nft.ts                   # useNft, useNfts, useNftsByCollection
│   ├── owned-assets.ts          # useOwnedAssets, useOwnedTokens
│   ├── follow.ts                # useFollowers, useFollowing, useFollowCount
│   ├── creator-addresses.ts     # useCreatorAddresses
│   ├── lsp29-encrypted-asset.ts # useEncryptedAsset, useEncryptedAssets
│   ├── lsp29-feed.ts            # useEncryptedAssetFeed
│   ├── data-changed.ts          # useDataChangedEvents
│   ├── universal-receiver.ts    # useUniversalReceiverEvents
│   └── universal-profile-stats.ts # useProfileStats
├── keys/
│   └── index.ts                 # All query key factories
├── actions/                     # Server action wrappers (Next.js)
│   ├── universal-profile.ts
│   ├── digital-asset.ts
│   └── ... (mirrors services)
├── types/
│   └── index.ts                 # Re-exported codegen types + utility types
└── index.ts                     # Barrel export
```

### Why Per-Domain Files (Not Single File or Namespace Object)

| Approach                                      | Pros                                          | Cons                                           | Verdict      |
| --------------------------------------------- | --------------------------------------------- | ---------------------------------------------- | ------------ |
| **Per-domain files** (recommended)            | Tree-shakeable, clear ownership, easy to find | More files                                     | **Use this** |
| Single `hooks.ts` file                        | Easy to find                                  | Massive file, no tree-shaking, merge conflicts | Don't use    |
| Namespace object (`hooks.profile.useProfile`) | Discoverable via autocomplete                 | Not tree-shakeable, unusual pattern, verbose   | Don't use    |

### Import Patterns for Consumers

```typescript
// Primary: individual hook imports (tree-shakeable)
import { useProfile, useFollowers } from '@lsp-indexer/react';

// Types
import type { UniversalProfile, DigitalAsset } from '@lsp-indexer/react/types';

// Cache management
import { profileKeys, assetKeys } from '@lsp-indexer/react/keys';

// Server-side prefetching
import { getProfileQueryOptions } from '@lsp-indexer/react/query';

// Provider
import { LuksoIndexerProvider } from '@lsp-indexer/react';
```

---

## Feature Dependencies

```
TS-1 (GraphQL Codegen)
  └──→ TS-3 (Per-Domain Hooks)  ← needs types
  └──→ TS-4 (Service Layer)     ← needs typed queries
  └──→ DF-5 (Type Exports)      ← needs generated types

TS-2 (TanStack Query + Key Factories)
  └──→ TS-3 (Per-Domain Hooks)  ← hooks use useQuery
  └──→ TS-8 (Pagination)        ← uses useInfiniteQuery
  └──→ DF-2 (Key Exports)       ← exports key factories
  └──→ DF-3 (SSR Hydration)     ← uses prefetchQuery

TS-4 (Service Layer)
  └──→ TS-3 (Per-Domain Hooks)  ← hooks call services
  └──→ DF-1 (Dual-Mode)         ← server actions call services

TS-5 (Provider) + TS-6 (Config)
  └──→ TS-3 (Per-Domain Hooks)  ← hooks read config from context

TS-7 (Error Handling)
  └──→ TS-4 (Service Layer)     ← services normalize errors
```

**Critical path:** TS-1 → TS-4 → TS-2 → TS-3 → TS-5/TS-6 → TS-7/TS-8

---

## MVP Recommendation

### v1.1 Must Ship (Table Stakes)

1. **TS-1** GraphQL codegen pipeline — types are the foundation
2. **TS-4** Service layer for all 11 domains — data access works anywhere
3. **TS-2** TanStack Query integration with key factories — caching works
4. **TS-3** Per-domain hooks — the primary consumer API
5. **TS-5** Provider with create-or-reuse pattern — setup works
6. **TS-6** Environment-driven config — deployable
7. **TS-7** Error handling — errors are intelligible
8. **TS-8** Offset pagination (top 3-4 list domains) — lists are usable

### v1.1 Should Ship (Differentiators)

9. **DF-1** Dual-mode hooks (at least for top 3 domains) — Next.js story
10. **DF-2** Query key exports — cache management
11. **DF-5** Type exports — consumer DX

### Defer to v1.2

- **DF-3** SSR hydration (docs + examples, not code changes)
- **DF-4** Select transforms (can add incrementally)
- **DF-6** Domain-specific stale times (use sensible defaults, optimize later)

---

## Sources

| Source                                                                                                                             | Confidence | How Used                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| [TanStack Query v5 docs — Overview, Query Keys, Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/overview) | HIGH       | Query key patterns, infinite queries API, hook return shapes                                   |
| [wagmi v3 docs — TanStack Query integration](https://wagmi.sh/react/guides/tanstack-query)                                         | HIGH       | Query key export pattern, `get<X>QueryOptions` pattern, provider setup, SSR approach           |
| [GraphQL Code Generator — React Query guide](https://the-guild.dev/graphql/codegen/docs/guides/react-query)                        | HIGH       | `client` preset with `documentMode: 'string'`, `TypedDocumentString` pattern, execute function |
| [TanStack Query — Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)                | HIGH       | `useInfiniteQuery`, `getNextPageParam`, offset pagination pattern, `maxPages`                  |
| Reference implementation (chillwhales/marketplace)                                                                                 | HIGH       | 11 query domains, service→action→hook pattern, GraphQL execution patterns                      |
| Existing lsp-indexer codebase (PROJECT.md, schema.graphql, ARCHITECTURE.md)                                                        | HIGH       | 72+ entity types, Hasura auto-generation, TypeORM schema, constraint documentation             |

---

_Researched: 2026-02-16_
_Confidence: HIGH — patterns verified from official documentation of TanStack Query v5, wagmi v3, and GraphQL Code Generator. Domain organization based on existing reference implementation._

# Domain Pitfalls: React Hooks Package for GraphQL/Hasura

**Domain:** Publishable React hooks package consuming Hasura GraphQL API
**Researched:** 2026-02-16
**Mode:** Ecosystem — Pitfalls dimension for `packages/react` milestone
**Confidence:** HIGH (codebase analysis + official docs + domain patterns)

---

## Executive Summary

Building a publishable React hooks package that wraps a Hasura GraphQL API with both client-side (TanStack Query) and server-side (next-safe-action) patterns is a **deceptively complex integration problem**. The pitfalls fall into three severity tiers:

1. **Architecture pitfalls** (CRITICAL): Wrong package boundary decisions — mixing server-only code in client bundles, broken `exports` map, missing `"use client"` directives — produce packages that fail at install time or crash at runtime. These are the most expensive to fix because they require restructuring the entire package.

2. **Integration pitfalls** (HIGH): TanStack Query cache collisions, SSR hydration mismatches, Hasura naming convention conflicts with codegen, and next-safe-action boundary violations. These produce subtle bugs that appear only in production or specific consumption patterns.

3. **DX pitfalls** (MEDIUM/LOW): Type explosion from Hasura's deeply nested generated types, confusing API surface, missing `enabled` guards on conditional queries, and opaque error messages from Hasura permission failures.

The marketplace reference implementation exhibits **every class of anti-pattern** this package must avoid: mixin-based class composition (kills tree-shaking), 4-layer indirection for simple reads, hooks trapped in the app (not reusable), server-only restriction (no client-side consumption), and ad-hoc patterns per domain.

---

## Critical Pitfalls

Mistakes that will break the package for consumers if not addressed in the first phase.

### Pitfall C1: Server-Only Code Leaking Into Client Bundle

**Severity:** CRITICAL
**Phase to address:** Phase 1 (Package Structure)

**What goes wrong:** A file imported by a client-side hook (e.g., `useProfile`) transitively imports a module that uses Node.js-only APIs (`fs`, `crypto`), `"use server"` functions, or `next/headers`. The bundler includes the server code in the client bundle, and the app crashes at runtime in the browser with `Module not found: 'fs'` or similar.

**Why it happens:** In a dual-mode package (client + server), the dependency graph is shared. If a service function is used by both a client-side hook AND a server action, and that service imports anything server-only (even indirectly), the entire chain is pulled into the client bundle.

**This package specifically:** The package has 11 domains, each with a service + hooks + optional server actions. If the service layer imports modules with server-only APIs, or if the server action file isn't properly isolated, every client hook that uses that service will drag server code along.

**Warning signs:**

- Build errors mentioning Node.js built-in modules in client bundles
- Next.js "You're importing a component that needs server-only..." errors
- Bundle size unexpectedly large (server code included)

**Prevention:**

1. **Strict file-level separation:** `service.ts` (universal), `hooks.ts` (client-only, `"use client"`), `actions.ts` (server-only, `"use server"`). Never cross-import between hooks and actions.
2. **The service layer must be environment-agnostic:** Use only the typed `fetch()` wrapper (available in both Node.js and browser). No `node:` protocol imports. No server-only modules.
3. **Use `server-only` package as a build-time guardrail:** If a file should never appear in a client bundle, add `import 'server-only'` at the top. Next.js will error at build time instead of runtime.
4. **Package `exports` map must separate entry points:**
   ```json
   {
     "exports": {
       ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
       "./server": { "import": "./dist/server.js", "types": "./dist/server.d.ts" }
     }
   }
   ```
5. **Test with `next build`** in a consumer app early — don't wait until Phase 3 to discover import contamination.

**Confidence:** HIGH — This is the #1 cause of broken dual-mode packages in the Next.js ecosystem. Verified via Next.js App Router docs on server/client boundaries.

---

### Pitfall C2: Broken `package.json` `exports` Map

**Severity:** CRITICAL
**Phase to address:** Phase 1 (Package Structure)

**What goes wrong:** Consumer installs the package and gets `Module not found` errors because the `exports` field in `package.json` doesn't match the actual file structure, or because the `types` condition is missing/incorrect, or because `workspace:*` protocol leaks into the published package.

**Why it happens:** The `exports` map in `package.json` is the contract between your package and consumers. Getting it wrong means the package is unusable. Common mistakes:

- Missing `"types"` condition (TypeScript consumers can't find types)
- Wrong path (dist files in different location than declared)
- Using `"main"` instead of `"exports"` (doesn't support conditional exports)
- `workspace:*` protocol in dependencies (pnpm workspace feature, invalid in published packages)

**This package specifically:** With separate entry points for client hooks, server actions, and types, the exports map is complex:

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./server": { "types": "./dist/server.d.ts", "import": "./dist/server.js" },
    "./types": { "types": "./dist/types.d.ts" }
  }
}
```

**Warning signs:**

- `Cannot find module '@lsp-indexer/react'` in consumer projects
- TypeScript errors about missing types despite package being installed
- `npm pack` output missing expected files

**Prevention:**

1. **Always include `"types"` condition first** in each export — TypeScript resolves conditions in order.
2. **Run `npm pack --dry-run`** after every build to verify the `files` field includes all necessary outputs.
3. **Use `publint`** (`npx publint`) to validate the package.json exports map against actual files.
4. **Use `arethetypeswrong`** (`npx @arethetypeswrong/cli`) to verify TypeScript resolution works for all consumption patterns (ESM, CJS, bundler).
5. **Never publish `workspace:*` deps** — pnpm automatically resolves these during `pnpm publish`, but verify by checking the published package.json.
6. **Add `"sideEffects": false`** to enable tree-shaking by bundlers.

**Confidence:** HIGH — These are well-documented failure modes. Verified via Node.js `exports` documentation and pnpm workspace docs.

---

### Pitfall C3: Missing or Incorrect `"use client"` Directives

**Severity:** CRITICAL
**Phase to address:** Phase 1 (Package Structure)

**What goes wrong:** Consumer imports a hook in a React Server Component (RSC) and gets the error: `You're importing a component that needs 'use client'. It only works in a Client Component but none of its parents are marked with "use client"`.

**Why it happens:** In Next.js App Router, all components are Server Components by default. Any module that uses React hooks (`useState`, `useEffect`, `useQuery`) must be marked with `"use client"` at the top of the file, **including in published packages**. The directive must be in the **compiled output**, not just the source.

**This package specifically:** Every hook file across all 11 domains needs `"use client"`. If the build tool strips the directive during compilation (some do), the package breaks.

**Warning signs:**

- "Error: useState only works in Client Components" in consumer apps
- Works in development but fails in production builds
- Works with `"use client"` in consumer's wrapper but not when importing directly

**Prevention:**

1. **Add `"use client"` as the first line** in every file that exports React hooks.
2. **Verify the directive survives compilation:** After building, `grep -r '"use client"' dist/` should show it in the compiled files.
3. **Configure the bundler to preserve directives:** With tsup, use `banner` option. With unbuild, verify it's not stripped.
4. **Don't add `"use client"` to service files** — services should be environment-agnostic and importable from both client and server.
5. **Test by importing from a Server Component** — it should error unless wrapped in `"use client"`.

**Confidence:** HIGH — Verified via Next.js App Router docs on "use client" in third-party packages.

---

### Pitfall C4: TanStack Query Provider Missing or Nested Incorrectly

**Severity:** CRITICAL
**Phase to address:** Phase 1 (Package Structure)

**What goes wrong:** Consumer uses the package's hooks without wrapping their app in `QueryClientProvider`, or wraps it in the wrong place, and gets the runtime error: `No QueryClient set, use QueryClientProvider to set one`.

**Why it happens:** TanStack Query hooks (`useQuery`, `useMutation`) require a `QueryClientProvider` ancestor in the React tree. If the package doesn't provide guidance or a pre-configured provider, every consumer must figure this out themselves. Worse, if the package creates its own `QueryClient` internally, it conflicts with the consumer's existing `QueryClient`.

**This package specifically:** The package must support apps that already have TanStack Query set up (marketplace already uses it) AND apps that are starting fresh.

**Warning signs:**

- "No QueryClient set" errors in consumer apps
- Hooks returning `undefined` data silently (provider exists but is a different instance)
- Duplicate cache entries (two QueryClients)

**Prevention:**

1. **Don't implicitly create or hide a QueryClient inside hooks.** Hooks should assume a `QueryClientProvider` already exists in the app tree. Let consumers create and mount their own `QueryClient` / `QueryClientProvider` at the app root.
2. **Optionally export an explicit convenience provider** for apps that don't already have a `QueryClient` configured. This provider may create and manage a `QueryClient`, but only when the consumer opts into using it — no hidden extra `QueryClient` instances behind the hooks:
   ```tsx
   // Optional, opt-in entry point for apps without an existing QueryClient
   export { LspIndexerProvider } from './provider';
   ```
3. **List `@tanstack/react-query` as a `peerDependency`**, not a dependency. This ensures the consumer and the package share the same QueryClient instance.
4. **Document the provider requirement prominently** in README and JSDoc on every hook.
5. **Validate at runtime:** In development mode, hooks should check for QueryClient and throw a helpful error message pointing to the docs.

**Confidence:** HIGH — This is the standard pattern for any TanStack Query wrapper library. Verified via TanStack Query v5 docs.

---

### Pitfall C5: Generated Types Not Exposed Cleanly to Consumers

**Severity:** CRITICAL
**Phase to address:** Phase 1 (Package Structure + Codegen)

**What goes wrong:** Consumer wants to type a variable with the shape of a `UniversalProfile` from the package's GraphQL types, but the types are either not exported, buried in a generated namespace, or have names that collide with the consumer's own types.

**Why it happens:** GraphQL codegen generates types in a single file (e.g., `graphql.ts` or `types.ts`). If these aren't re-exported from the package's public API, consumers can't use them. If they're exported via `export *`, they may create circular dependencies or name collisions.

**This package specifically:** The schema has ~80 entity types (UniversalProfile, DigitalAsset, NFT, etc.) and Hasura generates complex query/response types. Consumers need:

- Return types from hooks (e.g., `UniversalProfile` shape)
- Input types for variables (e.g., `Universal_Profile_Bool_Exp` for filters)
- Enum types (e.g., `Lsp4_Token_Type_Enum`)

**Warning signs:**

- Consumers importing from `@lsp-indexer/react/dist/generated/graphql` (reaching into internals)
- TypeScript errors about incompatible types between package and consumer code
- Consumer duplicating type definitions that exist in the package

**Prevention:**

1. **Create a curated types entry point:** `@lsp-indexer/react/types` that re-exports only the types consumers need — not the entire codegen output.
2. **Use branded type aliases** for complex generated types:
   ```typescript
   // types/index.ts — curated public API
   export type {
     UniversalProfileQuery,
     UniversalProfileQueryVariables,
   } from '../generated/graphql';
   export type { Universal_Profile_Bool_Exp as ProfileFilter } from '../generated/graphql';
   ```
3. **Never `export *` from generated files** — it creates massive barrel exports that hurt tree-shaking and IDE performance.
4. **Commit generated types to the repo** — don't make consumers run codegen. The types are part of the package's public API.
5. **Version the generated types with the package** — if the Hasura schema changes, the types change, and consumers need a new version.

**Confidence:** HIGH — Based on marketplace's known issue #6 ("Generated types not exposed cleanly for consumers") and common patterns in GraphQL codegen packages.

---

## High Pitfalls

Mistakes that will cause DX degradation or runtime issues but won't completely break the package.

### Pitfall H1: TanStack Query Cache Collisions From Flat Query Keys

**Severity:** HIGH
**Phase to address:** Phase 2 (Query Domain Implementation)

**What goes wrong:** Two different queries return cached data from the wrong query because their query keys collide. For example, `useProfile("0xABC")` returns cached data from `useProfiles({ limit: 10 })` because both use `["profile"]` as a key prefix without sufficient specificity.

**Why it happens:** TanStack Query v5 uses structured query keys for cache lookup. If the key design is flat (e.g., `["profiles"]` for all profile queries), different queries with different variables share the same cache entry. The last query to resolve overwrites the previous one.

**This package specifically:** With 11 domains, each having multiple query variants (getById, getList, getByFilter, getAggregates), there could be 40+ distinct query types. Without a systematic key scheme, collisions are inevitable.

**Warning signs:**

- Hooks returning stale data that doesn't match the current variables
- `invalidateQueries` invalidating more queries than intended
- DevTools showing fewer cache entries than expected

**Prevention:**

1. **Use a hierarchical key factory pattern:**
   ```typescript
   export const profileKeys = {
     all: ['profiles'] as const,
     lists: () => [...profileKeys.all, 'list'] as const,
     list: (filters: ProfileFilters) => [...profileKeys.lists(), filters] as const,
     details: () => [...profileKeys.all, 'detail'] as const,
     detail: (address: string) => [...profileKeys.details(), address] as const,
   };
   ```
2. **Include ALL variables in the query key.** TanStack Query uses deep comparison, so object variables work.
3. **Export the key factories** so consumers can use them for manual invalidation:
   ```typescript
   import { profileKeys } from '@lsp-indexer/react';
   queryClient.invalidateQueries({ queryKey: profileKeys.all });
   ```
4. **Namespace keys with the package name** to avoid collision with the consumer's own queries:
   ```typescript
   const BASE = 'lsp-indexer' as const;
   export const profileKeys = {
     all: [BASE, 'profiles'] as const,
     // ...
   };
   ```

**Confidence:** HIGH — Verified via TanStack Query v5 docs on query keys. The hierarchical key factory is the recommended pattern.

---

### Pitfall H2: SSR Hydration Mismatch With TanStack Query

**Severity:** HIGH
**Phase to address:** Phase 2 or Phase 3 (SSR Support)

**What goes wrong:** Server-rendered HTML shows data, but on client hydration, the data briefly disappears (flash of empty state) or the client re-fetches data that was already fetched on the server. In worst cases, React throws a hydration mismatch error.

**Why it happens:** TanStack Query's server-side prefetching requires careful coordination between server and client. Data fetched on the server must be dehydrated into the HTML and rehydrated on the client. If the `QueryClient` isn't shared between server render and client hydration, or if `staleTime` is 0 (default), the client immediately refetches.

**This package specifically:** The package targets Next.js App Router (primary consumer). App Router uses React Server Components where data fetching happens in `async` server components, NOT in hooks. The hooks run on the client. If the package only provides client hooks, server-rendered pages can't prefetch — they'll always show a loading state on first render.

**Warning signs:**

- Flash of loading state on page load despite server-side data being available
- Network waterfall: page loads, then hooks fire client-side requests
- React hydration warnings about text content mismatch

**Prevention:**

1. **Provide both hook and service patterns:**
   - `useProfile(address)` — client-side hook for interactive use
   - `profileService.getProfile(address)` — plain async function for server components
2. **Document the prefetch pattern for App Router:**

   ```tsx
   // Server Component
   import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
   import { profileService } from '@lsp-indexer/react/server';

   export default async function Page({ params }) {
     const queryClient = new QueryClient();
     await queryClient.prefetchQuery({
       queryKey: profileKeys.detail(params.address),
       queryFn: () => profileService.getProfile(params.address),
     });
     return (
       <HydrationBoundary state={dehydrate(queryClient)}>
         <ProfileView address={params.address} />
       </HydrationBoundary>
     );
   }
   ```

3. **Set a reasonable default `staleTime`** (e.g., 30 seconds) in the package's hooks so prefetched data isn't immediately considered stale.
4. **Export `queryOptions` factories** (TanStack Query v5 pattern) so consumers can use them in both server prefetch and client hooks:
   ```typescript
   export function profileQueryOptions(address: string) {
     return queryOptions({
       queryKey: profileKeys.detail(address),
       queryFn: () => profileService.getProfile(address),
       staleTime: 30_000,
     });
   }
   ```

**Confidence:** HIGH — Verified via TanStack Query v5 SSR docs ("Server Rendering & Hydration" guide).

---

### Pitfall H3: Hasura snake_case vs TypeScript camelCase Mismatch

**Severity:** HIGH
**Phase to address:** Phase 1 (Codegen Setup)

**What goes wrong:** Hasura auto-generates GraphQL types using snake_case (e.g., `universal_profile`, `digital_asset`, `lsp3_profile`). GraphQL codegen produces TypeScript types with these snake_case names. Developers write `profile.lsp3_profile` instead of `profile.lsp3Profile`, creating inconsistency with TypeScript conventions and confusion for new developers.

**Why it happens:** Hasura maps PostgreSQL table names directly to GraphQL types. TypeORM entities use PascalCase in code but the underlying Postgres tables use snake_case. Hasura exposes the snake_case names in the GraphQL schema.

**This package specifically:** The schema has ~80 entity types all in snake_case from Hasura. The TypeORM schema.graphql uses PascalCase (`UniversalProfile`, `DigitalAsset`), but the Hasura-generated GraphQL schema will use snake_case (`universal_profile`, `digital_asset`). This creates a naming mismatch between:

- The TypeORM models (PascalCase)
- The Hasura GraphQL types (snake_case)
- The codegen output (follows Hasura naming)
- Consumer expectations (camelCase TypeScript)

**Warning signs:**

- Developer confusion about whether to use `profile.lsp3_profile` or `profile.lsp3Profile`
- IDE autocomplete showing snake_case properties
- Inconsistency between package's public API types and internal generated types

**Prevention:**

1. **Use GraphQL Codegen's `namingConvention` config** to transform generated type names:
   ```typescript
   // codegen.ts
   generates: {
     './src/generated/graphql.ts': {
       preset: 'client',
       config: {
         namingConvention: {
           typeNames: 'change-case-all#pascalCase',
           enumValues: 'change-case-all#upperCase',
         },
         // Note: field names in TypeScript follow the GraphQL schema
         // They remain snake_case from Hasura
       }
     }
   }
   ```
2. **Accept that query field names remain snake_case** — this is a GraphQL schema concern, not a codegen concern. The GraphQL query must use the field names the server expects.
3. **Create camelCase wrapper types** for the package's public API that map to the generated types:

   ```typescript
   // Public API type (curated)
   export interface Profile {
     address: string;
     lsp3Profile: Lsp3Profile | null;  // camelCase public API
   }

   // Internal: map from generated snake_case
   function mapProfile(raw: Universal_ProfileQuery): Profile { ... }
   ```

4. **Or: Accept snake_case in the public API** and document it. This is simpler and avoids a mapping layer. Many Hasura client libraries do this.
5. **Document the naming convention clearly** — whichever approach is chosen, make it explicit.

**Confidence:** HIGH — This is a known Hasura ecosystem issue. Verified via Hasura docs and GraphQL Codegen namingConvention config.

---

### Pitfall H4: next-safe-action Server/Client Boundary Violations

**Severity:** HIGH
**Phase to address:** Phase 2 (Server Actions)

**What goes wrong:** A server action defined with next-safe-action imports code that should only run on the client (e.g., React hooks, `window` access), or a client component tries to call a server action directly without proper serialization, causing build errors or runtime crashes.

**Why it happens:** next-safe-action creates a clean boundary between server and client: actions run on the server, hooks (`useAction`) run on the client. But if the action's Zod schema or return type imports something that uses client-only APIs, the boundary is violated.

**This package specifically:** Each domain has an optional server action. The action calls the service, the service makes a GraphQL request. If the service file also exports hook utilities or uses `useCallback`-style patterns, the server action's dependency tree is contaminated.

**Warning signs:**

- Build error: "Server Actions must only use serializable values"
- Runtime error: "window is not defined" in server actions
- Type error: "Functions cannot be passed directly to Client Components"
- Zod schemas duplicated between action definitions and client-side form validation

**Prevention:**

1. **Service layer must be a pure function layer** — no React imports, no browser APIs, no side effects. Just `async function getProfile(address: string): Promise<Profile>`.
2. **Actions only import from services, never from hooks.**
3. **Zod schemas should be defined in a shared file** importable by both actions and client components:
   ```
   schemas/profile.ts  (shared, no React imports)
   actions/profile.ts  (imports schema + service, "use server")
   hooks/profile.ts    (imports schema for validation, "use client")
   ```
4. **Return only serializable data from actions** — no Date objects, no Map/Set, no functions. Use plain objects with string dates.
5. **Export action definitions, not action implementations** — let consumers bind the action to next-safe-action's `useAction` hook themselves, or provide pre-bound hooks.

**Confidence:** MEDIUM — next-safe-action patterns are well-established but the specific interaction with a shared package is less documented. Based on next-safe-action docs and Next.js Server Actions documentation.

---

### Pitfall H5: Hasura Permission Errors Silently Returning Empty Data

**Severity:** HIGH
**Phase to address:** Phase 2 (Query Domain Implementation)

**What goes wrong:** A Hasura query returns empty results instead of an error because the consumer doesn't have the right permissions. The hook shows "no data found" instead of a permission error, and the developer spends hours debugging why data is missing.

**Why it happens:** Hasura's permission system is row-level and column-level. If a role doesn't have `select` permission on a table, Hasura returns an empty array (not an error) for list queries. For single-item queries, it returns `null`. The GraphQL response has status 200 with valid-looking data — just empty.

**This package specifically:** The Hasura endpoint may have different permission configurations for anonymous vs authenticated users. If the package doesn't handle permission boundaries, queries silently return empty results.

**Warning signs:**

- Queries returning empty results in some environments but not others
- Data visible in Hasura console but not through the package
- No errors in the console, hooks just show empty state

**Prevention:**

1. **The package should assume anonymous (public) access** unless explicitly configured otherwise. Document which Hasura role is expected.
2. **Support passing custom headers** (including `x-hasura-role` and `x-hasura-admin-secret`) through the GraphQL client config:
   ```typescript
   createLspIndexerClient({
     url: process.env.HASURA_URL,
     headers: {
       'x-hasura-admin-secret': process.env.HASURA_SECRET,
     },
   });
   ```
3. **Log or warn when a query returns unexpectedly empty results** in development mode — this helps catch permission issues early.
4. **Document the required Hasura permissions** for each domain.

**Confidence:** HIGH — Hasura permission behavior is well-documented. This is a common gotcha for Hasura consumers.

---

### Pitfall H6: Peer Dependency Version Conflicts

**Severity:** HIGH
**Phase to address:** Phase 1 (Package Structure)

**What goes wrong:** Consumer installs the package and gets conflicting React or TanStack Query versions. Two copies of React in the bundle cause the "Invalid hook call" error. Two copies of TanStack Query cause "No QueryClient set" because hooks look up the context from a different React tree.

**Why it happens:** If the package lists `react` or `@tanstack/react-query` as `dependencies` instead of `peerDependencies`, the package manager installs its own copy. When the consumer also has these installed, there are two copies.

**This package specifically:** The package depends on React 18+, TanStack Query v5, and possibly Zod. All must be `peerDependencies`.

**Warning signs:**

- "Invalid hook call. Hooks can only be called inside a function component"
- Two copies of React in the bundle (check with `npm ls react`)
- Hooks working in development (same version resolved) but failing in CI (different version)

**Prevention:**

1. **All framework libraries must be `peerDependencies`:**
   ```json
   {
     "peerDependencies": {
       "react": ">=18.0.0",
       "@tanstack/react-query": ">=5.0.0"
     },
     "peerDependenciesMeta": {
       "@tanstack/react-query": { "optional": false }
     }
   }
   ```
2. **Only list packages the consumer wouldn't have** as `dependencies`. For this package, that's likely just `graphql` (the graphql-js library for tagged template literals) if needed.
3. **Use `peerDependenciesMeta` to mark optional peers** — e.g., `next` and `zod` for server action support.
4. **Test installation in a clean consumer project** as part of CI.

**Confidence:** HIGH — Standard npm package best practice.

---

### Pitfall H7: GraphQL Codegen Schema Drift

**Severity:** HIGH
**Phase to address:** Phase 1 (Codegen Pipeline)

**What goes wrong:** The Hasura schema evolves (new column, renamed field, new table), but the generated types in the package aren't updated. Consumers use the package with the old types, and queries fail at runtime with GraphQL errors like "field X not found on type Y".

**Why it happens:** The codegen pipeline runs against the Hasura introspection endpoint. If the pipeline doesn't run automatically when the schema changes (i.e., when `packages/typeorm/schema.graphql` changes and Hasura applies the new metadata), the generated types go stale.

**This package specifically:** The schema source is `packages/typeorm/schema.graphql` → TypeORM → PostgreSQL → Hasura. Changes flow through 4 layers before reaching the package's codegen. Any break in this chain leaves types stale.

**Warning signs:**

- GraphQL runtime errors about unknown fields
- TypeScript compiles but queries fail at runtime
- Package and Hasura have different understandings of the schema

**Prevention:**

1. **Run codegen as a build step** — `pnpm build` in `packages/react` should always regenerate types first.
2. **Commit generated types** — don't require consumers or CI to have access to the Hasura endpoint. Generated types are source-controlled alongside the schema.
3. **Add a codegen script in the monorepo root** that regenerates types when the schema changes:
   ```json
   { "scripts": { "codegen": "pnpm --filter @lsp-indexer/react codegen" } }
   ```
4. **Use `schema.graphql` file as input** (not introspection endpoint) for local development — this way codegen works offline and doesn't depend on a running Hasura instance.
5. **Validate in CI:** Compare generated types against the checked-in types. If they differ, fail the build.

**Confidence:** HIGH — This is a universal codegen concern. The schema chain (TypeORM → PostgreSQL → Hasura → codegen) is specific to this project.

---

## Medium Pitfalls

Should address to prevent DX issues and technical debt, but won't block shipping.

### Pitfall M1: Missing `enabled` Guards on Conditional Queries

**Severity:** MEDIUM
**Phase to address:** Phase 2 (Query Domain Implementation)

**What goes wrong:** A hook fires a GraphQL query even when its required parameter is `undefined` or `null`. For example, `useProfile(address)` fires immediately even when `address` is `undefined` (before route params resolve), sending `null` to Hasura and getting an error or empty result.

**Why it happens:** TanStack Query fires queries immediately unless `enabled: false` is set. If the hook doesn't guard on required parameters, it fires with invalid inputs.

**Prevention:**

1. **All hooks with required parameters must use `enabled` guard:**
   ```typescript
   export function useProfile(address: string | undefined) {
     return useQuery({
       queryKey: profileKeys.detail(address!),
       queryFn: () => profileService.getProfile(address!),
       enabled: !!address, // Don't fire until address is defined
     });
   }
   ```
2. **Use the `skipToken` pattern** (TanStack Query v5):
   ```typescript
   export function useProfile(address: string | undefined) {
     return useQuery({
       queryKey: profileKeys.detail(address ?? ''),
       queryFn: address ? () => profileService.getProfile(address) : skipToken,
     });
   }
   ```
3. **Accept `undefined` in hook signatures** — making the parameter required but letting it be undefined is the standard pattern.

**Confidence:** HIGH — Standard TanStack Query pattern.

---

### Pitfall M2: GraphQL Codegen Output Bloat

**Severity:** MEDIUM
**Phase to address:** Phase 1 (Codegen Setup)

**What goes wrong:** The codegen output file is 10,000+ lines because it generates types for the entire Hasura schema — every table, every relationship, every aggregate, every `_bool_exp`, every `_order_by`, every `_insert_input`, etc. This slows down TypeScript compilation, IDE responsiveness, and increases bundle size.

**Why it happens:** Hasura auto-generates a rich GraphQL schema from PostgreSQL. For each table, Hasura creates: query type, subscription type, aggregate type, `_bool_exp` filter type, `_order_by` type, `_insert_input` type, `_set_input` type, `_on_conflict` type, etc. GraphQL codegen generates TypeScript types for ALL of these.

**This package specifically:** With ~80 entity types in the schema, Hasura generates ~800+ GraphQL types. The codegen output could exceed 20,000 lines.

**Warning signs:**

- `generated/graphql.ts` file exceeding 10,000 lines
- IDE becoming slow when editing files that import generated types
- TypeScript compiler taking >10 seconds

**Prevention:**

1. **Use the `client` preset with `documentMode: 'string'`** — this only generates types for operations you actually write, not the entire schema:
   ```typescript
   generates: {
     './src/generated/': {
       preset: 'client',
       config: {
         documentMode: 'string',
       },
     },
   },
   ```
2. **Write specific GraphQL operations** (queries/fragments) for each domain rather than relying on auto-generated types for the full schema.
3. **Use fragments for reusable field selections** to keep operations DRY without generating types for unused fields.
4. **Don't generate mutation types** — the package is read-only (indexer data consumption). Exclude mutation types from codegen.
5. **Consider splitting codegen per domain** if the single file becomes unmanageable.

**Confidence:** HIGH — Verified via GraphQL Codegen docs on client preset with `documentMode: 'string'`.

---

### Pitfall M3: Stale Closures in Hook Callbacks

**Severity:** MEDIUM
**Phase to address:** Phase 2 (Query Domain Implementation)

**What goes wrong:** A hook's `onSuccess` or `select` callback captures a stale variable from a previous render, causing it to operate on outdated state.

**Why it happens:** JavaScript closures capture variables by reference at the time the closure is created. If a TanStack Query hook's `queryFn` or `select` callback uses a variable that changes between renders, the callback may use the old value.

**Prevention:**

1. **Include all dynamic values in the `queryKey`** — TanStack Query re-creates the query (and its callbacks) when the key changes.
2. **Don't use `onSuccess`/`onError` on `useQuery`** — these were removed in TanStack Query v5. Use `select` for data transformation and effect-based handling for side effects.
3. **Keep `queryFn` callbacks simple** — they should only fetch data, not perform side effects.
4. **Use `queryOptions` factory pattern** to ensure queryFn and key are always in sync.

**Confidence:** HIGH — Well-documented TanStack Query v5 pattern.

---

### Pitfall M4: Hasura `_bool_exp` Type Explosion in Filters

**Severity:** MEDIUM
**Phase to address:** Phase 2 (Query Domain Implementation)

**What goes wrong:** Exposing Hasura's raw `_bool_exp` filter types in the package's public API creates an overwhelming API surface. Developers see types with 40+ optional fields, deeply nested `_and`/`_or`/`_not` combinators, and every comparison operator for every field.

**Why it happens:** Hasura generates exhaustive filter types that cover every possible query combination. While powerful, they're not user-friendly for a hooks library.

**This package specifically:** `Universal_Profile_Bool_Exp` alone would have fields for every column, every relationship, and every comparison operator. For 11 domains, this creates enormous type surface area.

**Prevention:**

1. **Create simplified filter types** for common use cases:

   ```typescript
   // Public API — simplified, domain-specific
   interface ProfileListOptions {
     address?: string;
     search?: string;  // matches on name
     limit?: number;
     offset?: number;
     orderBy?: 'name' | 'createdAt';
   }

   // Internal: map to Hasura _bool_exp
   function buildProfileWhere(opts: ProfileListOptions): Universal_Profile_Bool_Exp { ... }
   ```

2. **Offer an escape hatch** for advanced consumers who need raw Hasura filters:
   ```typescript
   interface ProfileListOptions {
     // ... simplified options
     where?: Universal_Profile_Bool_Exp; // Advanced: raw Hasura filter
   }
   ```
3. **Export the raw filter types** from a separate entry point (`@lsp-indexer/react/types`) for advanced users.

**Confidence:** MEDIUM — Based on patterns from other Hasura client libraries. The specific approach depends on how much abstraction the package wants to provide.

---

### Pitfall M5: Monorepo Build Order Dependencies

**Severity:** MEDIUM
**Phase to address:** Phase 1 (Package Structure)

**What goes wrong:** `packages/react` depends on `packages/typeorm` (for the schema), but the build order isn't configured, so CI builds `packages/react` before `packages/typeorm` is built, and codegen fails because the schema file doesn't exist yet.

**Why it happens:** pnpm workspaces don't automatically determine build order. You must either explicitly declare workspace dependencies in `package.json` or configure task ordering in the build tool.

**This package specifically:** The dependency chain is: `packages/typeorm` (schema.graphql) → `packages/react` (codegen reads schema → builds hooks). If `packages/react` doesn't declare a dependency on `packages/typeorm`, `pnpm -r build` may build them in the wrong order.

**Warning signs:**

- CI builds fail intermittently (race condition in build order)
- `schema.graphql not found` errors during codegen
- Works locally (incremental) but fails on fresh CI (parallel)

**Prevention:**

1. **Declare the workspace dependency:**
   ```json
   // packages/react/package.json
   {
     "devDependencies": {
       "@chillwhales/typeorm": "workspace:*"
     }
   }
   ```
2. **pnpm automatically resolves build order** from workspace dependencies. `pnpm -r build` builds `typeorm` first.
3. **For codegen, reference the schema file by relative path**, not by npm package import:
   ```typescript
   // codegen.ts
   schema: '../typeorm/schema.graphql',
   ```
4. **Test CI builds with `--no-cache`** to catch ordering issues.

**Confidence:** HIGH — Standard pnpm workspace behavior.

---

### Pitfall M6: Missing `files` Field Causing Bloated npm Package

**Severity:** MEDIUM
**Phase to address:** Phase 1 (Package Structure)

**What goes wrong:** `npm publish` includes source files, test files, config files, and other development artifacts in the published package, inflating the download size from ~50KB to >500KB.

**Why it happens:** By default, npm publishes everything not in `.gitignore`. If the `files` field in `package.json` isn't configured, source TypeScript files, test fixtures, codegen config, and build scripts all get published.

**Prevention:**

1. **Always set the `files` field:**
   ```json
   {
     "files": ["dist", "README.md", "LICENSE"]
   }
   ```
2. **Run `npm pack --dry-run`** before publishing to verify only intended files are included.
3. **Check the package size:** `npx package-size @lsp-indexer/react` or `bundlephobia.com`.

**Confidence:** HIGH — Standard npm publishing practice.

---

### Pitfall M7: Error Handling Gaps in GraphQL Responses

**Severity:** MEDIUM
**Phase to address:** Phase 2 (Service Layer)

**What goes wrong:** The service layer treats all GraphQL responses as successful if the HTTP status is 200. But GraphQL can return a 200 response with an `errors` array. The hook shows stale data or empty data without surfacing the GraphQL error.

**Why it happens:** GraphQL over HTTP returns 200 even for query errors (permissions, syntax, validation). The error is in the response body's `errors` field, not the HTTP status.

**Prevention:**

1. **The service's `execute` function must check for `errors`:**
   ```typescript
   async function execute<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
     const response = await fetch(url, {
       method: 'POST',
       body: JSON.stringify({ query, variables }),
     });
     const json = await response.json();
     if (json.errors?.length) {
       throw new GraphQLError(json.errors);
     }
     return json.data as T;
   }
   ```
2. **Create a custom `GraphQLError` class** that includes the error array and original query for debugging.
3. **TanStack Query's `error` state will properly capture thrown errors** — the hook's `error` property will contain the `GraphQLError`.
4. **Log errors in development** with full query and variables for debugging.

**Confidence:** HIGH — Standard GraphQL client pattern.

---

## Low Pitfalls

Nice to avoid but won't block development or cause significant issues.

### Pitfall L1: Overly Complex Generic Types Degrading IDE Performance

**Severity:** LOW
**Phase to address:** Phase 2 (Query Domain Implementation)

**What goes wrong:** Hook return types use deeply nested generics that TypeScript struggles to display. When a developer hovers over `useProfile()`, instead of seeing `{ data: Profile | undefined, isLoading: boolean, ... }`, they see a 50-line inferred type that's unreadable.

**Prevention:**

1. **Use explicit return types** on hooks instead of relying on inference:
   ```typescript
   export function useProfile(address: string | undefined): UseQueryResult<Profile> { ... }
   ```
2. **Create simple result type aliases** for complex generic types.
3. **Test IDE experience** — hover over hooks in VSCode and verify the tooltip is readable.

---

### Pitfall L2: Aggregate Query Gotchas With Hasura

**Severity:** LOW
**Phase to address:** Phase 2 (Query Domain Implementation)

**What goes wrong:** An aggregate query (`*_aggregate`) returns `null` for the aggregate value instead of `0` when no rows match, causing a `TypeError: Cannot read property 'count' of null`.

**Prevention:**

1. **Always null-check aggregate results:** `data?.aggregate?.count ?? 0`
2. **Create typed wrapper functions** that normalize aggregate results:
   ```typescript
   function getCount(aggregate: { aggregate?: { count?: number | null } | null } | null): number {
     return aggregate?.aggregate?.count ?? 0;
   }
   ```

---

### Pitfall L3: Forgetting to Set `staleTime` Leading to Excessive Refetches

**Severity:** LOW
**Phase to address:** Phase 2 (Query Domain Implementation)

**What goes wrong:** Hooks refetch on every window focus, component mount, and navigation because TanStack Query's default `staleTime` is 0 (data is immediately stale after fetch). This creates unnecessary load on the Hasura endpoint.

**Prevention:**

1. **Set sensible defaults per domain:**

   ```typescript
   // Blockchain data changes slowly — 60s stale time is reasonable
   const DEFAULT_STALE_TIME = 60_000;

   export function useProfile(address: string | undefined) {
     return useQuery({
       queryKey: profileKeys.detail(address!),
       queryFn: () => profileService.getProfile(address!),
       enabled: !!address,
       staleTime: DEFAULT_STALE_TIME,
     });
   }
   ```

2. **Allow consumers to override** via options parameter.
3. **Consider different stale times for different data types:** profiles (60s), transfers (30s), follows (60s).

---

### Pitfall L4: `export *` Creating Circular Dependencies

**Severity:** LOW
**Phase to address:** Phase 1 (Package Structure)

**What goes wrong:** Barrel files (`index.ts`) that re-export everything from every domain create circular dependency chains. TypeScript may silently resolve types as `any`, or the bundler may produce incorrect output.

**Prevention:**

1. **Use explicit, curated exports** in barrel files:
   ```typescript
   // index.ts
   export { useProfile, useProfiles } from './domains/profile/hooks';
   export { profileService } from './domains/profile/service';
   export type { Profile, ProfileListOptions } from './domains/profile/types';
   ```
2. **Never `export * from`** across domain boundaries.
3. **Use a linter rule** like `eslint-plugin-import/no-cycle` to detect circular imports.

---

## Marketplace Anti-Patterns to Explicitly Avoid

The existing chillwhales/marketplace implementation has 6 known issues. Each maps to specific pitfalls in this document.

### Anti-Pattern 1: Mixin-Based Class Pattern for Combining Services

**Marketplace problem:** Services use a mixin class pattern to compose functionality (e.g., `class ProfileService extends AssetMixin(BaseMixin(Service))`). This kills tree-shaking because the entire class hierarchy is pulled in even if only one method is used.

**How the package avoids this:** Use plain functions, not classes. Each service is a collection of standalone `async` functions:

```typescript
// Good: plain functions, individually tree-shakeable
export const profileService = {
  getProfile: async (address: string) => { ... },
  getProfiles: async (opts: ProfileListOptions) => { ... },
};

// Bad: class hierarchy
class ProfileService extends BaseService {
  async getProfile(address: string) { ... }
}
```

**Maps to:** Pitfall C1 (server/client boundary), C2 (tree-shaking via `sideEffects: false`)

---

### Anti-Pattern 2: 4-Layer Call Chain for Simple Reads

**Marketplace problem:** Hook → Action → Service Singleton → GraphQL. Four layers of indirection for what should be: Hook → Service → GraphQL.

**How the package avoids this:** Client-side pattern is 2 layers: Hook → Service. Server-side pattern is 3 layers: Hook → Action → Service. Never more.

```
Client path:  useProfile() → profileService.getProfile() → fetch(graphql)
Server path:  useProfileAction() → getProfileAction() → profileService.getProfile() → fetch(graphql)
```

**Maps to:** Pitfall H4 (next-safe-action boundary), architecture simplicity

---

### Anti-Pattern 3: Hooks Live in the App, Not the Package

**Marketplace problem:** Hooks are defined in the app's `hooks/` directory, not in a shared package. They can't be reused across apps.

**How the package avoids this:** This is the entire purpose of `packages/react`. All hooks are in the package, exported as public API. The app imports and uses them.

**Maps to:** The core mission of this milestone.

---

### Anti-Pattern 4: Server-Only Restriction on Services

**Marketplace problem:** Services use `import 'server-only'`, preventing client-side consumption. Client components can't call services directly — they must go through server actions.

**How the package avoids this:** Services are environment-agnostic (use only `fetch`). Client hooks call services directly. Server actions also call services. The service layer is the shared core.

**Maps to:** Pitfall C1 (server-only code in client bundle)

---

### Anti-Pattern 5: No Consistent Pattern Across Domains

**Marketplace problem:** Each domain has ad-hoc hook implementations. Some use `useQuery`, some use `useSuspenseQuery`, some use custom state. No predictable pattern for new developers.

**How the package avoids this:** Every domain follows the exact same structure:

```
domains/{name}/
  service.ts      — async functions calling GraphQL
  hooks.ts        — "use client" TanStack Query hooks wrapping service
  actions.ts      — "use server" next-safe-action wrapping service (optional)
  keys.ts         — query key factory
  types.ts        — domain-specific types
  fragments.ts    — GraphQL fragments for the domain
```

**Maps to:** All pitfalls — consistency prevents all of them.

---

### Anti-Pattern 6: Generated Types Not Exposed Cleanly

**Marketplace problem:** Consumers can't import GraphQL types from the shared package. They either re-define types or reach into internal paths.

**How the package avoids this:** Curated type exports via `@lsp-indexer/react/types` entry point.

**Maps to:** Pitfall C5 (generated types exposure)

---

## Phase-Specific Warnings

| Phase Topic                       | Likely Pitfall                                                        | Severity | Mitigation                                                                |
| --------------------------------- | --------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| Package structure (exports, dirs) | C1, C2, C3: server/client split, exports map, "use client"            | CRITICAL | Get this right first — everything builds on it                            |
| Codegen pipeline setup            | H3, H7, M2: naming conventions, schema drift, output bloat            | HIGH     | Use `client` preset with `documentMode: 'string'`, commit generated types |
| TanStack Query provider           | C4: missing provider, duplicate QueryClient                           | CRITICAL | peerDependency, don't create own QueryClient                              |
| Query domain implementation       | H1, M1, M3: cache collisions, missing enabled guards, stale closures  | HIGH     | Hierarchical key factory, `enabled` guards on every hook                  |
| Server action integration         | H4: boundary violations                                               | HIGH     | Strict file separation, service layer is the shared core                  |
| SSR/hydration support             | H2: hydration mismatch                                                | HIGH     | Export `queryOptions` factories, set `staleTime`                          |
| Hasura integration                | H5, M4, L2: permission errors, \_bool_exp complexity, aggregate nulls | HIGH     | Simplified filter types, error checking, null-safe aggregates             |
| Publishing/monorepo               | M5, M6, H6: build order, missing files, peer dep conflicts            | MEDIUM   | Workspace deps, `files` field, `peerDependencies`                         |
| TypeScript DX                     | C5, L1, L4: type exposure, IDE perf, circular deps                    | MEDIUM   | Curated type exports, explicit return types                               |
| New developer onboarding          | Anti-Pattern 5: inconsistent patterns                                 | MEDIUM   | Enforce same structure for all 11 domains                                 |

---

## Sources

- **TanStack Query v5 — Query Keys:** https://tanstack.com/query/latest/docs/framework/react/guides/query-keys (HIGH confidence)
- **TanStack Query v5 — SSR & Hydration:** https://tanstack.com/query/latest/docs/framework/react/guides/ssr (HIGH confidence)
- **GraphQL Codegen — React Query Guide:** https://the-guild.dev/graphql/codegen/docs/guides/react-query (HIGH confidence)
- **GraphQL Codegen — Client Preset:** https://the-guild.dev/graphql/codegen/plugins/presets/preset-client (HIGH confidence)
- **Next.js — Server Components & "use client":** https://nextjs.org/docs/app/building-your-application/rendering/client-components (HIGH confidence)
- **Next.js — Server Actions:** https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations (HIGH confidence)
- **pnpm Workspaces:** https://pnpm.io/workspaces (HIGH confidence)
- **Node.js — Package exports:** https://nodejs.org/api/packages.html#exports (HIGH confidence)
- **Hasura — Permissions:** https://hasura.io/docs/latest/auth/authorization/permissions/ (MEDIUM confidence — based on training data)
- **Codebase analysis:** Direct reading of schema.graphql, package.json, existing research files (HIGH confidence)
- **Marketplace anti-patterns:** From milestone context (project owner's assessment) (HIGH confidence)

---

_Researched: 2026-02-16_
_Confidence: HIGH — Findings combine direct codebase analysis, verified official documentation, and well-established patterns from the React/GraphQL/Hasura ecosystem._