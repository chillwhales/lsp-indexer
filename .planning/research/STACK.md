# Technology Stack: packages/react

**Project:** LSP Indexer — React Hooks Package
**Researched:** 2026-02-16
**Mode:** Ecosystem — Stack dimension for standalone React hooks library
**Overall confidence:** HIGH

## Executive Summary

The recommended stack from the `chillwhales/marketplace` reference implementation is **current and well-chosen**. All libraries are actively maintained, at recent stable versions, and integrate cleanly. The key architectural insight is that **GraphQL Codegen's `client-preset` with `documentMode: 'string'` is the modern, recommended approach** — it generates typed `TypedDocumentString` wrappers that work with any client including `graphql-request` and TanStack Query, without needing library-specific codegen plugins like `@graphql-codegen/typescript-react-query`.

**One notable change since the reference implementation:** Zod v4 is now the `latest` tag on npm (v4.3.6). However, `next-safe-action` v8 uses [Standard Schema](https://github.com/standard-schema/standard-schema), meaning it works with both Zod v3 and v4. **Recommend using Zod v3 (`zod@^3.24.1`) for stability** — v4 is brand new and introduces breaking API changes (`z.object()` → `z.interface()` for optionals, new import paths). Migrate to v4 in a future milestone.

## Core Dependencies (Runtime — shipped in the package)

These are `dependencies` in the package's `package.json` — bundled into the published output.

| Library           | Version    | Purpose                                    | Rationale                                                                                                                                                                                                                                                                 |
| ----------------- | ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `graphql-request` | `^7.4.0`   | GraphQL HTTP client                        | Minimal, isomorphic, first-class `TypedDocumentNode` support. 6.1k stars, actively maintained on the `graphql-request` branch (main repo evolved to "Graffle" for advanced use). Perfect for a library: no framework lock-in, works in Node, browsers, and edge runtimes. |
| `graphql`         | `^16.12.0` | GraphQL core (peer dep of graphql-request) | Required by `graphql-request` and `@graphql-codegen/*`. v16 is the stable line — v17 exists but is not widely adopted.                                                                                                                                                    |

**Note:** `graphql` and `graphql-request` are the ONLY runtime dependencies this package should ship. Everything else (`@tanstack/react-query`, `next-safe-action`, `zod`, `react`, `viem`) must be **peer dependencies** — the consuming app provides them. This keeps the package lightweight and avoids version conflicts.

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
  documents: ['src/**/*.ts', '!src/gql/**/*'],
  ignoreNoDocuments: true,
  generates: {
    // Generated types + graphql() function
    './src/gql/': {
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
    external: ['react', '@tanstack/react-query', 'graphql-request', 'graphql'],
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
    external: [
      'react',
      '@tanstack/react-query',
      'next-safe-action',
      'zod',
      'graphql-request',
      'graphql',
    ],
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
      exclude: ['src/gql/**', 'src/test/**'],
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

**Why:** These are full GraphQL client frameworks with caches, subscriptions, etc. Way too heavy for a hooks library that just needs to send queries. `graphql-request` is the right abstraction — minimal, no cache opinions, works everywhere.

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
  "name": "@chillwhales/react",
  "version": "0.1.0"
}
```

Follows the monorepo's `@chillwhales/*` naming convention.

### Environment Variable Convention

The package should use a configurable GraphQL URL, not hardcoded:

```typescript
// src/config.ts
export function getGraphQLUrl(): string {
  const url =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL // Client-side (Next.js)
      : process.env.HASURA_GRAPHQL_URL; // Server-side

  if (!url) {
    throw new Error(
      'GraphQL URL not configured. Set NEXT_PUBLIC_HASURA_GRAPHQL_URL (client) or HASURA_GRAPHQL_URL (server).',
    );
  }
  return url;
}
```

The consuming app can also override via a provider:

```typescript
// Consumer usage
<LspIndexerProvider graphqlUrl="https://my-hasura.example.com/v1/graphql">
  <App />
</LspIndexerProvider>
```

## Package Exports Structure

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./client": {
      "import": { "types": "./dist/client.d.ts", "default": "./dist/client.js" },
      "require": { "types": "./dist/client.d.cts", "default": "./dist/client.cjs" }
    },
    "./server": {
      "import": { "types": "./dist/server.d.ts", "default": "./dist/server.js" },
      "require": { "types": "./dist/server.d.cts", "default": "./dist/server.cjs" }
    }
  },
  "files": ["dist", "README.md"],
  "sideEffects": false
}
```

Three entry points:

- `@chillwhales/react` — Core types, config, GraphQL client
- `@chillwhales/react/client` — Client-side TanStack Query hooks (has `"use client"` banner)
- `@chillwhales/react/server` — Server-side next-safe-action wrappers (optional Next.js import)

## Installation Commands

### For the package itself (in `packages/react`)

```bash
# Core dependencies
pnpm add graphql-request graphql

# Dev dependencies — codegen
pnpm add -D @graphql-codegen/cli @graphql-codegen/client-preset @graphql-codegen/schema-ast @graphql-codegen/introspection @parcel/watcher @0no-co/graphqlsp

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
pnpm add @chillwhales/react @tanstack/react-query react

# Full (client + server patterns)
pnpm add @chillwhales/react @tanstack/react-query react next-safe-action zod
```

## Version Summary Table

| Package                          | Recommended      | Latest on npm                    | Notes                                          |
| -------------------------------- | ---------------- | -------------------------------- | ---------------------------------------------- |
| `graphql-request`                | `^7.4.0`         | 7.4.0                            | Stable, maintained on `graphql-request` branch |
| `graphql`                        | `^16.12.0`       | 16.12.0                          | Stable line, v17 exists but not widely adopted |
| `@tanstack/react-query`          | `^5.0.0` (peer)  | 5.90.21                          | Very active, weekly releases                   |
| `next-safe-action`               | `^8.0.0` (peer)  | 8.0.11                           | Uses Standard Schema, stable                   |
| `zod`                            | `^3.24.0` (peer) | 4.3.6 (latest), 3.24.4 (v3 line) | Intentionally pin to v3 — see rationale        |
| `viem`                           | `^2.0.0` (peer)  | 2.46.1                           | Very active, weekly releases                   |
| `@graphql-codegen/cli`           | `^6.1.1` (dev)   | 6.1.1                            | Current stable                                 |
| `@graphql-codegen/client-preset` | `^5.2.2` (dev)   | 5.2.2                            | Current stable                                 |
| `@graphql-codegen/schema-ast`    | `^5.0.0` (dev)   | 5.0.0                            | Current stable                                 |
| `tsup`                           | `^8.5.1` (dev)   | 8.5.1                            | Current stable                                 |
| `vitest`                         | `^3.2.0` (dev)   | 4.0.18 (latest)                  | Intentionally pin to v3 — see rationale        |
| `@testing-library/react`         | `^16.3.2` (dev)  | 16.3.2                           | Current stable                                 |
| `happy-dom`                      | `^20.0.0` (dev)  | 20.x                             | Current stable                                 |
| `msw`                            | `^2.0.0` (dev)   | 2.x                              | Current stable                                 |
| `@0no-co/graphqlsp`              | `^1.15.2` (dev)  | 1.15.2                           | Current stable                                 |
| `@parcel/watcher`                | `^2.1.0` (dev)   | 2.x                              | For codegen watch mode                         |
| `typescript`                     | `^5.9.2` (dev)   | 5.9.2                            | Match monorepo root                            |

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
