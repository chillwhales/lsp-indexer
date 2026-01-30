# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

LUKSO blockchain indexer — pnpm monorepo with 4 packages:

| Package                   | Purpose                                  | Build                                         |
| ------------------------- | ---------------------------------------- | --------------------------------------------- |
| `@chillwhales/abi`        | ABI codegen (Subsquid typegen)           | `pnpm --filter=@chillwhales/abi build`        |
| `@chillwhales/typeorm`    | Entity codegen from `schema.graphql`     | `pnpm --filter=@chillwhales/typeorm build`    |
| `@chillwhales/indexer`    | v1 indexer (legacy, read-only reference) | `pnpm --filter=@chillwhales/indexer build`    |
| `@chillwhales/indexer-v2` | v2 indexer (active development)          | `pnpm --filter=@chillwhales/indexer-v2 build` |

Stack: TypeScript, Subsquid framework, TypeORM, Hasura GraphQL, LUKSO LSP standards.

## Build & Dev Commands

```bash
# Build specific package (most common)
pnpm --filter=@chillwhales/indexer-v2 build

# Build all packages
pnpm build

# Rebuild typeorm after schema.graphql changes (codegen + tsc)
pnpm --filter=@chillwhales/typeorm build

# Format all files
pnpm format
```

**Important**: If `Follower` or other entity imports fail in indexer-v2, rebuild typeorm first — codegen generates entities from `packages/typeorm/schema.graphql`.

There are no tests, no ESLint, and no git hooks configured. The only code quality tool is Prettier.

## Formatting (Prettier)

- 2-space indentation, 100 char print width
- Single quotes, trailing commas everywhere
- `prettier-plugin-organize-imports` handles import sorting automatically

## TypeScript Config

- Target: `es2020`, Module: `commonjs`
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Path alias: `@/*` maps to `src/*` (e.g., `import { populateByUP } from '@/core/pluginHelpers'`)

## Code Style

### Imports — 3 groups separated by blank lines

```typescript
// Group 1: Third-party packages
import { v4 as uuidv4 } from 'uuid';

// Group 2: Scoped org packages (@chillwhales, @subsquid, @lukso, viem, typeorm)
import { LSP5DataKeys } from '@lukso/lsp5-contracts';
import { LSP5ReceivedAsset } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { bytesToHex, Hex, hexToBytes } from 'viem';

// Group 3: Internal path-aliased imports (@/...) or relative (./)
import { mergeUpsertEntities, populateByUP } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
```

Core files (`core/*.ts`) use relative imports for siblings (`./types`). All others use `@/` aliases.

### Naming Conventions

| Element             | Convention                          | Example                            |
| ------------------- | ----------------------------------- | ---------------------------------- |
| Plugin files        | `camelCase.plugin.ts`               | `lsp7Transfer.plugin.ts`           |
| Core files          | `camelCase.ts`                      | `pluginHelpers.ts`                 |
| Constants           | `UPPER_SNAKE_CASE`                  | `ENTITY_TYPE`, `LSP5_LENGTH_KEY`   |
| Variables/functions | `camelCase`                         | `batchCtx`, `extractLength`        |
| Classes             | `PascalCase`                        | `PluginRegistry`, `BatchContext`   |
| Interfaces          | `I` prefix for behavioral contracts | `IBatchContext`, `IPluginRegistry` |
| Type aliases        | `PascalCase` (no prefix)            | `VerifyFn`, `Plugin`, `Block`      |
| Enums               | `PascalCase` name + members         | `EntityCategory.UniversalProfile`  |
| Plugin objects      | `PascalCase` + `Plugin` suffix      | `LSP7TransferPlugin`               |

### Types

- Explicit return types on every function and method
- Prefer `unknown` over `any` — `any` only for TypeORM constructor signatures with `eslint-disable` comment
- Generics with constraints: `<T extends { address: string; digitalAsset?: unknown }>`
- Plugins call helpers with explicit type params: `populateByDA<Transfer>(ctx, TYPE)`

### Functions

| Context              | Style                                     |
| -------------------- | ----------------------------------------- |
| Top-level / exported | `function` declaration                    |
| Private helpers      | `function` declaration                    |
| Plugin methods       | Shorthand method syntax on object literal |
| Inline callbacks     | Arrow functions only                      |

No top-level arrow functions. Never use `export default function` — use named const + `export default`.

### Exports

- **Plugin files**: Single `export default` of a typed const (last line of file)
- **Core modules**: Named exports only (`export class`, `export function`, `export type`)

### Comments

- File-level JSDoc block on every plugin: summary, behavior, tracked addresses, port-from-v1 refs
- Section separators: `// ---------------------------------------------------------------------------`
- JSDoc on public interfaces and helper functions with `@param`, `@throws`
- Inline comments for non-obvious decisions only

### Error Handling

- No try/catch in plugins — errors propagate to pipeline/framework
- Throw on critical invariants (duplicate topic0 in registry)
- `console.warn` + skip for non-critical issues (plugin discovery)
- Early return on empty data: `if (entities.size === 0) return;`
- Null-safe conditional linking in populate phase

## Git & GitHub Workflow

- **Branch naming**: `feat/indexer-v2-<name>` per issue
- **All PRs target**: `refactor/indexer-v2` (not `main`)
- **Commit format**: `feat(indexer-v2): description (#issue)` or `feat: description (closes #issue)`
- **After merge**: delete local + remote branch, `git fetch --prune`
- **Never merge PRs** without user review

### Issue Management (Required)

Before starting work: check for existing issue (`gh issue list --search "..."`), create if missing, label `in-progress`. After completing: close with commit reference or `gh issue close`. Use epic + sub-task structure for large features.

## Key Architecture Patterns (indexer-v2)

### Plugin Structure

Every plugin implements `EventPlugin` or `DataKeyPlugin` interface with phases: `extract()` -> `populate()` -> `persist()` and optional `handle()`, `clearSubEntities()`.

### Persist Strategies

| Helper                | When to Use                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `insertEntities`      | Append-only event logs (UUID ids)                                        |
| `upsertEntities`      | Single-source deterministic entities                                     |
| `insertNewEntities`   | FK stubs that must not overwrite other plugins' data                     |
| `mergeUpsertEntities` | Multi-source merged entities (reads DB first, preserves non-null fields) |

**Critical**: `store.upsert()` does full row replacement. Multi-source entities MUST use `mergeUpsertEntities` to prevent cross-batch data loss.

### Populate Helpers

All plugins must use shared helpers from `core/pluginHelpers.ts`:

- `populateByUP` — link to verified UniversalProfile
- `populateByDA` — link to verified DigitalAsset
- `populateByUPAndDA` — link to either/both

### Entity Type Constants

Each plugin declares: `const ENTITY_TYPE = 'EntityName'` for BatchContext keys.

### DataKeyPlugins

- Do NOT call `ctx.trackAddress()` — the parent DataChanged/TokenIdDataChanged meta-plugin handles it
- Factory plugins (`createDataChangedPlugin(registry)`) capture registry in closure for data key routing
