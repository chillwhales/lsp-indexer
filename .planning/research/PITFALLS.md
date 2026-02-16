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
