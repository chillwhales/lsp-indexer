# Phase 7: Package Foundation - Research

**Researched:** 2026-02-17
**Domain:** React hooks library package scaffolding, build tooling, GraphQL codegen, error handling, entry points, Next.js test app
**Confidence:** HIGH

## Summary

Phase 7 scaffolds a publishable React hooks package (`packages/react`) with dual ESM+CJS+DTS builds, GraphQL codegen from Hasura schema, a typed `IndexerError` class, correct multi-entry-point exports (`@lsp-indexer/react`, `@lsp-indexer/react/server`, `@lsp-indexer/react/types`), and a minimal Next.js dev playground (`apps/test`). This is the foundation phase — no domain-specific hooks yet.

The prior milestone research (STACK.md, ARCHITECTURE.md, PITFALLS.md from 2026-02-16) is comprehensive and HIGH confidence. This phase research reconciles those findings with the CONTEXT.md decisions (particularly: **no provider component**, env vars directly, specific env var names) and deep-dives into the Claude's Discretion areas: build tooling, codegen config, error taxonomy, and test app design.

**Primary recommendation:** Use tsup 8.5.1 with per-entry-point banner config for `"use client"`, `@graphql-codegen/cli` 6.1.1 with client-preset 5.2.2 for codegen, and Next.js 15 for the test app. Build `IndexerError` following Apollo Client v4's category-based taxonomy pattern.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Provider API design:**

   - No `<IndexerProvider>` component — hooks call GraphQL directly using env vars
   - Consumers must set up their own `QueryClientProvider` with TanStack Query
   - Environment variables: `NEXT_PUBLIC_INDEXER_URL` (public HTTP), `INDEXER_URL` (private HTTP), `NEXT_PUBLIC_INDEXER_WS_URL` (public WS), `INDEXER_WS_URL` (private WS)
   - When a hook fires and the required env var is missing or malformed, throw immediately with clear error message

2. **Error handling shape:**

   - `IndexerError` with fine-grained subcategories (e.g., `NETWORK_TIMEOUT`, `NETWORK_UNREACHABLE`, `GRAPHQL_VALIDATION`, `PERMISSION_DENIED`)
   - Error messages should be helpful with recovery hints
   - Rich + serializable: `category`, `code`, `message`, `statusCode`, `originalError`, `query`, `.toJSON()`
   - Follow industry standards — align with how Apollo, urql handle errors
   - Hooks are thin wrappers: rename `data` to domain name, pass all TanStack Query props through as-is

3. **Test app scope:**

   - Dev playground — interactive pages for manually testing hooks during development
   - Developer sets env vars: `NEXT_PUBLIC_INDEXER_URL`, `INDEXER_URL`, `NEXT_PUBLIC_INDEXER_WS_URL`, `INDEXER_WS_URL`
   - Phase 7 delivers: app shell, proper structure, entry point import validation

4. **Codegen workflow:**
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

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

The established libraries/tools for this phase:

### Core (Build-time & Package)

| Library                        | Version  | Purpose                   | Why Standard                                                            |
| ------------------------------ | -------- | ------------------------- | ----------------------------------------------------------------------- |
| tsup                           | ^8.5.1   | ESM+CJS+DTS bundler       | esbuild-powered, handles `"use client"` banners, used by TanStack Query |
| typescript                     | ^5.9.2   | Type checking + DTS       | Match monorepo root version                                             |
| @graphql-codegen/cli           | ^6.1.1   | GraphQL codegen runner    | Official, current stable, supports TS config                            |
| @graphql-codegen/client-preset | ^5.2.2   | Type generation preset    | The recommended modern approach, includes typescript + operations       |
| @graphql-codegen/schema-ast    | ^5.0.0   | Schema file output        | Generates local .graphql from introspection                             |
| graphql                        | ^16.12.0 | GraphQL core (devDep)     | Required by codegen at build-time only — NOT shipped                    |
| @0no-co/graphqlsp              | ^1.15.2  | TS LSP plugin for GraphQL | IDE autocomplete for graphql() calls                                    |
| @parcel/watcher                | ^2.1.0   | Codegen watch mode        | Optional peer dep of @graphql-codegen/cli                               |

### Core (Runtime — shipped)

| Library    | Version | Purpose                 | Why Standard                                     |
| ---------- | ------- | ----------------------- | ------------------------------------------------ |
| graphql-ws | ^6.0.0  | WebSocket subscriptions | Only runtime dep; Phase 10 subscriptions need it |

### Peer Dependencies (Consumer provides)

| Library               | Version              | Required? | Purpose                   |
| --------------------- | -------------------- | --------- | ------------------------- |
| react                 | ^18.0.0 \|\| ^19.0.0 | Yes       | React core                |
| @tanstack/react-query | ^5.0.0               | Yes       | Data fetching hooks       |
| next-safe-action      | ^8.0.0               | Optional  | Server actions (Phase 11) |
| zod                   | ^3.24.0              | Optional  | Schema validation         |
| viem                  | ^2.0.0               | Optional  | Address/Hex types         |

### Test App (apps/test)

| Library               | Version | Purpose           | Why Standard                                                           |
| --------------------- | ------- | ----------------- | ---------------------------------------------------------------------- |
| next                  | ^15.0.0 | Next.js framework | Stable production version; v16 is latest but v15 is more battle-tested |
| react                 | ^19.0.0 | React runtime     | Next.js 15 supports React 19                                           |
| react-dom             | ^19.0.0 | React DOM         | Required by Next.js                                                    |
| @tanstack/react-query | ^5.0.0  | Query client      | Required by hooks package                                              |

### Validation Tools

| Library               | Version      | Purpose                          | When to Use                                         |
| --------------------- | ------------ | -------------------------------- | --------------------------------------------------- |
| publint               | latest (npx) | Package.json exports validation  | Run after build to validate exports map             |
| @arethetypeswrong/cli | latest (npx) | TypeScript resolution validation | Run after build to check ESM/CJS/bundler resolution |

### Alternatives Considered

| Instead of            | Could Use          | Tradeoff                                                                                                         |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| tsup                  | unbuild            | unbuild uses rollup, better for Nuxt/UnJS ecosystem. tsup is React ecosystem standard (TanStack, Zustand, Jotai) |
| tsup                  | plain tsc + rollup | More control but 10x more config. Not worth it for this package.                                                 |
| Next.js 15 (test app) | Next.js 16         | v16 is `latest` on npm (16.1.6) but very recent. v15 is battle-tested, has all features needed for the test app  |
| Next.js (test app)    | Vite               | Simpler but doesn't validate App Router patterns (RSC, `"use client"`) which is the primary consumption context  |

**Installation (packages/react):**

```bash
# Runtime dependency
pnpm add graphql-ws

# Dev dependencies — codegen
pnpm add -D graphql @graphql-codegen/cli @graphql-codegen/client-preset @graphql-codegen/schema-ast @0no-co/graphqlsp @parcel/watcher

# Dev dependencies — build
pnpm add -D tsup typescript

# Dev dependencies — peer deps for development
pnpm add -D react react-dom @types/react @types/react-dom @tanstack/react-query
```

**Installation (apps/test):**

```bash
# App dependencies
pnpm add next@^15 react@^19 react-dom@^19 @tanstack/react-query @lsp-indexer/react
pnpm add -D typescript @types/react @types/react-dom
```

## Architecture Patterns

### Recommended Project Structure (Phase 7 — Foundation Only)

```
packages/react/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── codegen.ts
├── src/
│   ├── index.ts                    # Main entry: re-exports client, types, errors, env
│   ├── server.ts                   # Server entry: server-side client factory + types
│   ├── types.ts                    # Types entry: pure type re-exports
│   │
│   ├── client/                     # GraphQL client (typed fetch wrapper)
│   │   ├── index.ts                # createIndexerClient(), getClientUrl(), getServerUrl()
│   │   ├── execute.ts              # Typed execute function
│   │   └── env.ts                  # Env var reading + validation + error throwing
│   │
│   ├── errors/                     # IndexerError class + categories
│   │   ├── index.ts                # Re-exports
│   │   └── indexer-error.ts        # IndexerError class with subcategories
│   │
│   ├── graphql/                    # GENERATED — codegen output (committed)
│   │   ├── graphql.ts              # TypedDocumentString, generated types
│   │   ├── fragment-masking.ts     # Fragment utilities
│   │   └── gql.ts                  # graphql() tagged template function
│   │
│   └── documents/                  # GraphQL query documents (committed, hand-written)
│       └── index.ts                # (empty in Phase 7 — populated in Phase 8+)
│
├── dist/                           # Build output (gitignored)
│
apps/test/
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.local.example
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with QueryClientProvider
│   │   ├── page.tsx                # Landing page with navigation links
│   │   └── providers.tsx           # "use client" QueryClientProvider wrapper
│   └── lib/
│       └── query-client.ts         # QueryClient factory
```

### Pattern 1: No Provider — Env Var Based Client (LOCKED DECISION)

**What:** Hooks read GraphQL URL from environment variables directly. No `<IndexerProvider>` component.
**When to use:** Always — this is a locked decision.

The client module reads env vars and throws `IndexerError` immediately if missing:

```typescript
// src/client/env.ts
import { IndexerError } from '../errors';

export function getClientUrl(): string {
  const url = process.env.NEXT_PUBLIC_INDEXER_URL;
  if (!url) {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'MISSING_ENV_VAR',
      message:
        'NEXT_PUBLIC_INDEXER_URL is not set. Set this environment variable to your Hasura GraphQL HTTP endpoint (e.g., https://indexer.example.com/v1/graphql).',
    });
  }
  try {
    new URL(url);
  } catch {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'INVALID_URL',
      message: `NEXT_PUBLIC_INDEXER_URL is not a valid URL: "${url}". Expected a full URL like https://indexer.example.com/v1/graphql.`,
    });
  }
  return url;
}

export function getServerUrl(): string {
  const url = process.env.INDEXER_URL ?? process.env.NEXT_PUBLIC_INDEXER_URL;
  if (!url) {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'MISSING_ENV_VAR',
      message:
        'Neither INDEXER_URL nor NEXT_PUBLIC_INDEXER_URL is set. Set INDEXER_URL for server-side GraphQL requests.',
    });
  }
  return url;
}
```

**Key implication:** Since there's no provider, the `execute` function calls `getClientUrl()` or `getServerUrl()` at invocation time. This means:

- Client hooks call `getClientUrl()` on each query execution
- Server utilities call `getServerUrl()`
- The URL is resolved lazily, not at React tree mount time
- Env var errors surface as `IndexerError` instances caught by TanStack Query's error state

### Pattern 2: Typed Fetch Wrapper with TypedDocumentString

**What:** A ~30 LOC wrapper around `fetch` that leverages `TypedDocumentString` from codegen for full type safety.
**When to use:** All GraphQL queries in the package.

```typescript
// src/client/execute.ts
import type { TypedDocumentString } from '../graphql/graphql';
import { IndexerError } from '../errors';

export async function execute<TResult, TVariables>(
  url: string,
  document: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/graphql-response+json',
    },
    body: JSON.stringify({
      query: document.toString(),
      variables: variables ?? undefined,
    }),
  });

  if (!response.ok) {
    throw IndexerError.fromHttpResponse(response);
  }

  const json = (await response.json()) as {
    data?: TResult;
    errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
  };

  if (json.errors?.length) {
    throw IndexerError.fromGraphQLErrors(json.errors, document.toString());
  }

  if (!json.data) {
    throw new IndexerError({
      category: 'GRAPHQL',
      code: 'EMPTY_RESPONSE',
      message: 'GraphQL response contained neither data nor errors.',
      query: document.toString(),
    });
  }

  return json.data;
}
```

### Pattern 3: tsup Multi-Entry with Selective "use client" Banner

**What:** tsup config that builds three entry points, applying `"use client"` only to the client entry.
**When to use:** Build configuration for this package.

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry — client hooks + services + types + errors
  // Needs "use client" because it exports hooks that use React
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    banner: { js: '"use client";' },
    external: [
      'react',
      '@tanstack/react-query',
      'graphql-ws',
      'next-safe-action',
      'zod',
      'server-only',
    ],
    treeshake: true,
  },
  // Server entry — no "use client" banner
  {
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: [
      'react',
      '@tanstack/react-query',
      'graphql-ws',
      'next-safe-action',
      'zod',
      'server-only',
    ],
    treeshake: true,
  },
  // Types entry — pure types, no runtime, no banner
  {
    entry: { types: 'src/types.ts' },
    format: ['esm', 'cjs'],
    dts: { only: true }, // Only generate .d.ts, no JS
    external: ['react', '@tanstack/react-query'],
  },
]);
```

**Note on types entry:** For `@lsp-indexer/react/types` which is pure type re-exports, tsup's `dts: { only: true }` generates only `.d.ts` files. However, the `exports` map still needs a JS entry for Node.js module resolution to work. Use an empty JS file or a file that only re-exports types (which compiles to empty JS). The simpler approach: just generate normal ESM/CJS for types too — the JS output will be minimal (just re-exports).

### Pattern 4: Package.json Exports Map

**What:** Conditional exports for three entry points with proper TypeScript resolution.
**When to use:** Package.json configuration.

```json
{
  "name": "@lsp-indexer/react",
  "version": "0.1.0",
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
    "./server": {
      "types": "./dist/server.d.ts",
      "import": "./dist/server.js",
      "require": "./dist/server.cjs"
    },
    "./types": {
      "types": "./dist/types.d.ts",
      "import": "./dist/types.js",
      "require": "./dist/types.cjs"
    }
  },
  "files": ["dist"],
  "sideEffects": false
}
```

**Critical:** `"types"` condition MUST come first in each export — TypeScript resolves conditions in order.

### Pattern 5: Codegen Dual Schema Source

**What:** Codegen configured to introspect from live Hasura OR fall back to local schema file.
**When to use:** `codegen.ts` configuration.

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const hasuraUrl = process.env.HASURA_GRAPHQL_ENDPOINT;
const hasuraSecret = process.env.HASURA_ADMIN_SECRET;

// Use Hasura introspection if endpoint is available, otherwise fall back to local schema
const schema = hasuraUrl
  ? [
      {
        [hasuraUrl]: {
          headers: {
            ...(hasuraSecret ? { 'x-hasura-admin-secret': hasuraSecret } : {}),
          },
        },
      },
    ]
  : '../typeorm/schema.graphql';

const config: CodegenConfig = {
  schema,
  documents: ['src/documents/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    './src/graphql/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        useTypeImports: true,
        enumsAsTypes: true,
        scalars: {
          DateTime: 'string',
          BigInt: 'string',
          numeric: 'string',
        },
      },
    },
  },
};

export default config;
```

**Important caveat:** The `packages/typeorm/schema.graphql` is a Subsquid entity schema, NOT a full Hasura GraphQL schema. It lacks `_bool_exp`, `_order_by`, aggregate types, etc. When using the local file fallback, codegen will generate types for the entity types only, not the Hasura query/filter types. For Phase 7 (no domain hooks yet), this is fine — we just need the codegen pipeline to work. Full Hasura introspection is needed starting Phase 8.

### Anti-Patterns to Avoid

- **`<IndexerProvider>` component:** LOCKED DECISION — no provider. Hooks read env vars directly.
- **Hardcoded URLs:** All URLs come from environment variables. Never hardcode a GraphQL endpoint.
- **`export *` from generated files:** Always use curated, explicit re-exports.
- **Server code in main entry:** `src/server.ts` is a separate entry point. Never import server-only code from `src/index.ts`.
- **Creating a QueryClient internally:** Consumer provides their own QueryClientProvider. Package never creates one.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                   | Don't Build                         | Use Instead                                     | Why                                                           |
| ------------------------- | ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| ESM+CJS dual builds       | Custom rollup/webpack config        | tsup                                            | 10 lines of config vs 200+                                    |
| GraphQL type generation   | Manual TypeScript types from schema | @graphql-codegen/client-preset                  | Schema has 80+ entity types, manual types are unmaintainable  |
| TypedDocumentString       | Custom string-with-types wrapper    | codegen's `documentMode: 'string'`              | Codegen generates this automatically with full type inference |
| Package export validation | Manual testing of import paths      | publint + arethetypeswrong                      | Catches export issues that manual testing misses              |
| GraphQL error parsing     | Custom JSON response parsing        | Pattern from official codegen React Query guide | Standard `execute` wrapper handles all edge cases             |

**Key insight:** The codegen client-preset with `documentMode: 'string'` + a thin `execute()` wrapper gives you the entire typed GraphQL pipeline in ~30 lines. Don't build a custom query client.

## Common Pitfalls

### Pitfall 1: pnpm-workspace.yaml Must Include apps/\*

**What goes wrong:** The test app at `apps/test` won't be part of the pnpm workspace because current config only has `packages/*`.
**Why it happens:** The workspace config needs explicit inclusion of the apps directory.
**How to avoid:** Update `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Warning signs:** `pnpm install` in apps/test doesn't resolve `@lsp-indexer/react` as a workspace dependency.

### Pitfall 2: "use client" Banner Stripped by Minification

**What goes wrong:** The `"use client"` directive is stripped or moved during build, breaking Next.js App Router.
**Why it happens:** Some build tools treat string literals at the top of files as dead code.
**How to avoid:** Use tsup's `banner` option (not a source-level directive). After build, verify:

```bash
head -1 dist/index.js  # Should show: "use client";
```

**Warning signs:** `Error: useState only works in Client Components` in consumer apps.

### Pitfall 3: Codegen Generates Nothing Without Documents

**What goes wrong:** Running codegen with `documents: ['src/documents/**/*.ts']` but no files matching the glob produces no output.
**Why it happens:** Client-preset only generates types for operations in document files. With no documents, there's nothing to generate.
**How to avoid:** Set `ignoreNoDocuments: true` in codegen config. In Phase 7, create a minimal placeholder document so codegen produces output:

```typescript
// src/documents/_placeholder.ts
import { graphql } from '../graphql';

// Placeholder to ensure codegen generates base types.
// Remove when real documents are added in Phase 8.
export const _PlaceholderQuery = graphql(`
  query _Placeholder {
    __typename
  }
`);
```

**Warning signs:** `src/graphql/` directory is empty or has only boilerplate after codegen run.

### Pitfall 4: ESLint Fails on React Package Due to Missing tsconfig.json Path

**What goes wrong:** Root ESLint's `parserOptions.project` doesn't include the new package's tsconfig, causing type-aware rules to fail.
**Why it happens:** The root `eslint.config.ts` lists specific tsconfig paths. New packages must be added.
**How to avoid:** The root eslint config already includes `'./packages/*/tsconfig.json'` as a glob, so `packages/react/tsconfig.json` will be picked up automatically. But verify it works. The `apps/*` directory needs to be added:

```typescript
// eslint.config.ts parserOptions.project:
project: [
  './tsconfig.json',
  './packages/*/tsconfig.json',
  './apps/*/tsconfig.json',  // ADD THIS
],
```

**Warning signs:** ESLint errors like "Parsing error: No project config file found for..."

### Pitfall 5: Next.js Test App Must Use React 19 for Next.js 15

**What goes wrong:** Next.js 15 with React 18 has some incompatibilities, particularly with the App Router.
**Why it happens:** Next.js 15 defaults to React 19 patterns (async components, etc.).
**How to avoid:** Use React 19 in the test app. The hooks package supports `react ^18.0.0 || ^19.0.0` as a peer dep, so React 19 in the test app is fine.

### Pitfall 6: graphql Package Must Be devDependency, Not dependency

**What goes wrong:** The `graphql` package is shipped in the bundle, adding ~200KB to consumer bundles.
**Why it happens:** `graphql` is listed as a dependency instead of devDependency.
**How to avoid:** `graphql` is ONLY needed for codegen at build-time. List it as `devDependencies`. The `documentMode: 'string'` config means the generated code uses plain strings, not `graphql-tag` AST nodes.

## IndexerError Taxonomy (Claude's Discretion — Recommendation)

### Research: Industry Error Patterns

**Apollo Client v4** (verified via official docs 2026-02-17):
Apollo v4 has a sophisticated error hierarchy with 7 distinct error classes:

- `CombinedGraphQLErrors` — multiple GraphQL errors in one response
- `CombinedProtocolErrors` — protocol-level errors (subscription)
- `LinkError` — network/link chain errors
- `ServerError` — HTTP response errors (non-2xx)
- `ServerParseError` — response JSON parse failures
- `UnconventionalError` — non-standard error format
- `LocalStateError` — local state/cache errors

Key design: errors are categorized by **where they originate** (network, server, GraphQL, local).

**urql** (from training data):
urql uses a simpler `CombinedError` class that wraps both network errors and GraphQL errors into one type with properties: `graphQLErrors`, `networkError`, `message`, `response`.

### Recommended IndexerError Design

Align with Apollo's "categorize by origin" approach but simplified for our use case:

```typescript
// src/errors/indexer-error.ts

export type IndexerErrorCategory =
  | 'NETWORK' // Fetch failed (timeout, unreachable, DNS)
  | 'HTTP' // Non-2xx HTTP response
  | 'GRAPHQL' // GraphQL-level errors in response
  | 'CONFIGURATION' // Missing/invalid env vars, bad setup
  | 'PARSE'; // Response JSON parse failure

export type IndexerErrorCode =
  // Network errors
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_UNREACHABLE'
  | 'NETWORK_ABORTED'
  | 'NETWORK_UNKNOWN'
  // HTTP errors
  | 'HTTP_UNAUTHORIZED' // 401
  | 'HTTP_FORBIDDEN' // 403
  | 'HTTP_NOT_FOUND' // 404
  | 'HTTP_TOO_MANY_REQUESTS' // 429
  | 'HTTP_SERVER_ERROR' // 5xx
  | 'HTTP_UNKNOWN' // Other non-2xx
  // GraphQL errors
  | 'GRAPHQL_VALIDATION' // Schema validation error
  | 'GRAPHQL_EXECUTION' // Execution error
  | 'PERMISSION_DENIED' // Hasura permission error
  | 'GRAPHQL_UNKNOWN' // Unknown GraphQL error
  // Configuration errors
  | 'MISSING_ENV_VAR'
  | 'INVALID_URL'
  // Parse errors
  | 'RESPONSE_NOT_JSON'
  | 'EMPTY_RESPONSE';

export interface IndexerErrorOptions {
  category: IndexerErrorCategory;
  code: IndexerErrorCode;
  message: string;
  statusCode?: number;
  originalError?: Error;
  query?: string;
  graphqlErrors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

export class IndexerError extends Error {
  readonly category: IndexerErrorCategory;
  readonly code: IndexerErrorCode;
  readonly statusCode: number | undefined;
  readonly originalError: Error | undefined;
  readonly query: string | undefined;
  readonly graphqlErrors:
    | Array<{ message: string; extensions?: Record<string, unknown> }>
    | undefined;

  constructor(options: IndexerErrorOptions) {
    super(options.message);
    this.name = 'IndexerError';
    this.category = options.category;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
    this.query = options.query;
    this.graphqlErrors = options.graphqlErrors;
  }

  /** Serializable representation for server-side logging */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      category: this.category,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      query: this.query,
      graphqlErrors: this.graphqlErrors,
    };
  }

  /** Factory: create from HTTP response */
  static fromHttpResponse(response: Response): IndexerError {
    const codeMap: Record<number, IndexerErrorCode> = {
      401: 'HTTP_UNAUTHORIZED',
      403: 'HTTP_FORBIDDEN',
      404: 'HTTP_NOT_FOUND',
      429: 'HTTP_TOO_MANY_REQUESTS',
    };
    const code =
      codeMap[response.status] ?? (response.status >= 500 ? 'HTTP_SERVER_ERROR' : 'HTTP_UNKNOWN');

    const hints: Record<string, string> = {
      HTTP_UNAUTHORIZED:
        'Check your authentication headers (x-hasura-admin-secret or Authorization).',
      HTTP_FORBIDDEN:
        'Check your Hasura role permissions. You may need to add x-hasura-role header.',
      HTTP_NOT_FOUND:
        'Check that NEXT_PUBLIC_INDEXER_URL points to a valid Hasura GraphQL endpoint.',
      HTTP_TOO_MANY_REQUESTS: 'Rate limited by the server. Wait and retry.',
    };

    return new IndexerError({
      category: 'HTTP',
      code,
      message:
        `${code}: HTTP ${response.status} ${response.statusText}. ${hints[code] ?? ''}`.trim(),
      statusCode: response.status,
    });
  }

  /** Factory: create from GraphQL errors array */
  static fromGraphQLErrors(
    errors: Array<{ message: string; extensions?: Record<string, unknown> }>,
    query?: string,
  ): IndexerError {
    // Check for Hasura permission errors
    const isPermission = errors.some(
      (e) =>
        e.extensions?.code === 'access-denied' ||
        e.message.includes('not allowed') ||
        e.message.includes('permission'),
    );

    const isValidation = errors.some(
      (e) =>
        e.extensions?.code === 'validation-failed' ||
        (e.message.includes('field') && e.message.includes('not found')),
    );

    const code: IndexerErrorCode = isPermission
      ? 'PERMISSION_DENIED'
      : isValidation
        ? 'GRAPHQL_VALIDATION'
        : 'GRAPHQL_UNKNOWN';

    const hints: Record<string, string> = {
      PERMISSION_DENIED: 'Check that your Hasura role has SELECT permission on the queried table.',
      GRAPHQL_VALIDATION:
        "The query references fields that don't exist in the schema. Run codegen to update types.",
    };

    return new IndexerError({
      category: 'GRAPHQL',
      code,
      message: `${code}: ${errors.map((e) => e.message).join('; ')}. ${hints[code] ?? ''}`.trim(),
      graphqlErrors: errors,
      query,
    });
  }

  /** Factory: create from network fetch error */
  static fromNetworkError(error: Error): IndexerError {
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
    const code: IndexerErrorCode = isTimeout ? 'NETWORK_TIMEOUT' : 'NETWORK_UNKNOWN';

    return new IndexerError({
      category: 'NETWORK',
      code,
      message: `${code}: ${error.message}. Check your network connection and that the Hasura endpoint is reachable.`,
      originalError: error,
    });
  }
}
```

**Confidence: HIGH** — Error categories derived from Apollo Client v4's documented error hierarchy (verified 2026-02-17), adapted for Hasura-specific error patterns.

## Test App Design (Claude's Discretion — Recommendation)

### Recommended Structure

```
apps/test/
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.local.example
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Landing page: connection status + domain links
│   │   ├── providers.tsx           # "use client" wrapper: QueryClientProvider
│   │   ├── profiles/
│   │   │   └── page.tsx            # Phase 8: Universal Profiles playground
│   │   ├── assets/
│   │   │   └── page.tsx            # Phase 9: Digital Assets playground
│   │   └── ... (more pages added per phase)
│   │
│   └── components/
│       ├── nav.tsx                  # Simple navigation sidebar
│       └── connection-status.tsx    # Shows env var status + Hasura connectivity
```

### Phase 7 Delivers

1. **App shell** with root layout, providers, navigation
2. **Connection status page** that validates:
   - `NEXT_PUBLIC_INDEXER_URL` is set
   - `INDEXER_URL` is set (server-side check)
   - Can reach the Hasura endpoint (simple fetch to `__typename`)
3. **Import validation** — the page imports from all three entry points:
   ```typescript
   import { IndexerError } from '@lsp-indexer/react';
   import { getServerUrl } from '@lsp-indexer/react/server';
   import type { IndexerErrorCategory } from '@lsp-indexer/react/types';
   ```
   If any import fails, the build catches it immediately.

### .env.local.example

```bash
# Required: Public Hasura GraphQL HTTP endpoint (exposed to browser)
NEXT_PUBLIC_INDEXER_URL=https://your-hasura-instance.com/v1/graphql

# Required: Private Hasura GraphQL HTTP endpoint (server-side only)
INDEXER_URL=https://your-hasura-instance.com/v1/graphql

# Optional: Public WebSocket endpoint (for subscriptions - Phase 10)
# NEXT_PUBLIC_INDEXER_WS_URL=wss://your-hasura-instance.com/v1/graphql

# Optional: Private WebSocket endpoint (server-side subscriptions - Phase 10)
# INDEXER_WS_URL=wss://your-hasura-instance.com/v1/graphql
```

## Code Examples

### Package.json Scripts (packages/react)

```json
{
  "scripts": {
    "build": "pnpm codegen && tsup",
    "clean": "rm -rf dist/",
    "codegen": "graphql-codegen --config codegen.ts",
    "codegen:watch": "graphql-codegen --config codegen.ts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "validate": "pnpm build && npx publint && npx @arethetypeswrong/cli --pack ."
  }
}
```

### Root-Level Convenience Scripts

```json
{
  "scripts": {
    "codegen": "pnpm --filter @lsp-indexer/react codegen",
    "dev:test": "pnpm --filter test dev"
  }
}
```

### tsconfig.json (packages/react)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Note:** `noEmit: true` because tsup handles the build. TypeScript is used only for type checking (`tsc --noEmit`).

### QueryClientProvider in Test App (apps/test)

```typescript
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 minute — blockchain data doesn't change rapidly
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### next.config.ts (apps/test)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable transpilation of workspace package
  transpilePackages: ['@lsp-indexer/react'],
};

export default nextConfig;
```

## State of the Art

| Old Approach                            | Current Approach                       | When Changed            | Impact                                                                                   |
| --------------------------------------- | -------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| graphql-request                         | Typed fetch wrapper                    | 2025 (graffle rename)   | graphql-request is now "Graffle" — heavier, different API. Use raw fetch.                |
| @graphql-codegen/typescript-react-query | client-preset + documentMode: 'string' | Codegen v4+             | client-preset is officially recommended; plugin approach generates too-opinionated hooks |
| `gql` tagged template (graphql-tag)     | `graphql()` from codegen output        | Codegen v4+             | No runtime graphql-tag dependency needed                                                 |
| Provider pattern for URL config         | Environment variable reading           | This project's decision | Simpler, no React context overhead, works in server components                           |
| Next.js 14 Pages Router                 | Next.js 15 App Router                  | 2024                    | App Router is the default; test app uses it                                              |
| Vitest v2                               | Vitest v3 (pin, NOT v4)                | 2025                    | v4 drops Node 18, has breaking changes. v3 is stable LTS-equivalent                      |

**Deprecated/outdated:**

- `graphql-request` — renamed to Graffle, actively evolving into a different product
- `@graphql-codegen/typescript-react-query` — community plugin, replaced by client-preset pattern
- `@testing-library/react-hooks` — merged into `@testing-library/react` v13+
- Provider-based URL injection (for THIS project) — user decided against it

## Open Questions

Things that couldn't be fully resolved:

1. **Local schema fallback limitations**

   - What we know: `packages/typeorm/schema.graphql` is a Subsquid entity schema, not a full Hasura schema. It lacks `_bool_exp`, `_order_by`, aggregate types.
   - What's unclear: Whether codegen can generate useful types from this partial schema for Phase 7's purposes.
   - Recommendation: In Phase 7, create a minimal placeholder document (`__typename` query) that works with any schema. Full Hasura introspection will be needed starting Phase 8. Consider keeping a committed `schema.graphql` in `packages/react/` that's a snapshot of the full Hasura schema (generated via introspection, committed to repo).

2. **Next.js 15 vs 16 for test app**

   - What we know: Next.js `latest` on npm is v16.1.6. Next.js 15 is the previous stable.
   - What's unclear: Whether Next.js 16 has any breaking changes that affect the test app.
   - Recommendation: Use Next.js 15 for stability. It supports React 18+19, has all App Router features needed. Upgrade to 16 later if needed.

3. **"use client" banner on main entry vs per-hook**
   - What we know: tsup's `banner` option applies to the entire output file, not per-export.
   - What's unclear: Whether having `"use client"` on the main entry (which also re-exports types and services) causes issues when imported in server components.
   - Recommendation: For Phase 7 (foundation only, no hooks yet), don't add `"use client"` to the main entry yet. Add it when hooks are introduced in Phase 8. Phase 7's main entry exports only: `IndexerError`, `execute`, env var helpers, and types — all of which work in both client and server. The `"use client"` banner should be added to the specific file that exports hooks, or deferred to Phase 8 when actual hooks exist.

## Sources

### Primary (HIGH confidence)

- `packages/typeorm/schema.graphql` — 924 lines, direct file read (entity schema source)
- `.planning/research/STACK.md` — Comprehensive stack research from 2026-02-16
- `.planning/research/ARCHITECTURE.md` — Package architecture from 2026-02-16
- `.planning/research/PITFALLS.md` — Domain pitfalls from 2026-02-16
- GraphQL Codegen official docs — https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config (fetched 2026-02-17)
- GraphQL Codegen React Query guide — https://the-guild.dev/graphql/codegen/docs/guides/react-query (fetched 2026-02-17)
- GraphQL Codegen schema field docs — https://the-guild.dev/graphql/codegen/docs/config-reference/schema-field (fetched 2026-02-17)
- Apollo Client v4 error handling docs — https://www.apollographql.com/docs/react/data/error-handling (fetched 2026-02-17)
- npm registry — tsup@8.5.1, @graphql-codegen/cli@6.1.1, @graphql-codegen/client-preset@5.2.2, next@16.1.6 (fetched 2026-02-17)

### Secondary (MEDIUM confidence)

- Monorepo analysis — `pnpm-workspace.yaml`, `eslint.config.ts`, existing `packages/*/package.json` patterns
- Apollo Client v4 error class hierarchy (sidebar navigation from docs page, not full source code)

### Tertiary (LOW confidence)

- urql error handling pattern (from training data, not verified with current docs)
- Next.js 16 breaking changes assessment (v16 is very recent, limited migration docs available)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — All versions verified via npm registry, codegen config verified via official docs
- Architecture: HIGH — Reconciled CONTEXT.md decisions with prior ARCHITECTURE.md research, patterns verified
- Error taxonomy: HIGH — Derived from Apollo Client v4 official docs, adapted for Hasura patterns
- Build tooling: HIGH — tsup 8.5.1 verified as current, banner support confirmed
- Test app: MEDIUM — Next.js 15 vs 16 decision is reasonable but unverified against v16 docs
- Codegen config: HIGH — Official React Query guide pattern followed exactly

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days — stable libraries, no major releases expected)

---

_Phase: 07-package-foundation_
_Researched: 2026-02-17_