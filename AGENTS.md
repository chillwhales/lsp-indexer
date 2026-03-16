# AGENTS.md

Guidelines for AI coding agents working in this repository.

## ⚠️ Documentation — MANDATORY

**Every code change MUST include corresponding documentation updates.** The test app (`apps/test`) contains MDX documentation pages that serve as the public-facing docs for the `@lsp-indexer` packages. When you modify any package (`node`, `react`, `next`, `types`, or the indexer), you MUST update the relevant docs page(s):

| Change                                     | Update                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| New hook or server action                  | `apps/test/src/app/docs/react/page.mdx` and/or `docs/next/page.mdx`               |
| New fetch function, parser, or key factory | `apps/test/src/app/docs/node/page.mdx`                                            |
| New type, filter, sort, or include field   | `apps/test/src/app/docs/node/page.mdx` and domain tables in `docs/react/page.mdx` |
| New domain (e.g., new entity type)         | All docs pages + supported domains table in `apps/test/src/app/(home)/page.mdx`   |
| Indexer pipeline, Docker, or env changes   | `apps/test/src/app/docs/indexer/page.mdx`                                         |
| New env variable                           | `apps/test/.env.example` + quickstart + relevant package docs                     |
| Subscription or provider changes           | `docs/react/page.mdx` and/or `docs/next/page.mdx` + quickstart                    |

**Do NOT skip documentation. Outdated docs are worse than no docs.**

## Project Overview

LUKSO blockchain indexer — pnpm monorepo with 3 packages:

| Package                | Purpose                              | Build                                      |
| ---------------------- | ------------------------------------ | ------------------------------------------ |
| `@chillwhales/abi`     | ABI codegen (Subsquid typegen)       | `pnpm --filter=@chillwhales/abi build`     |
| `@chillwhales/typeorm` | Entity codegen from `schema.graphql` | `pnpm --filter=@chillwhales/typeorm build` |
| `@chillwhales/indexer` | Blockchain indexer (active)          | `pnpm --filter=@chillwhales/indexer build` |

Stack: TypeScript, Subsquid framework, TypeORM, Hasura GraphQL, LUKSO LSP standards.

## Build & Dev Commands

```bash
# Build specific package (most common)
pnpm --filter=@chillwhales/indexer build

# Build all packages
pnpm build

# Rebuild typeorm after schema.graphql changes (codegen + tsc)
pnpm --filter=@chillwhales/typeorm build

# Format all files
pnpm format
```

**Important**: If `Follower` or other entity imports fail in indexer, rebuild typeorm first — codegen generates entities from `packages/typeorm/schema.graphql`.

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

### Imports — automatically sorted by Prettier

Import statements are automatically organized by `prettier-plugin-organize-imports` with no blank lines between them:

```typescript
import { v4 as uuidv4 } from 'uuid';
import { LSP5DataKeys } from '@lukso/lsp5-contracts';
import { LSP5ReceivedAsset } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { bytesToHex, Hex, hexToBytes } from 'viem';
import { mergeUpsertEntities, populateByUP } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
```

The plugin automatically groups and sorts imports (third-party → scoped packages → internal). Do not manually add blank lines between import groups — let the plugin handle all formatting.

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

### Type Assertions (`as`) — Avoid Unless Proven Necessary

**Do NOT add `as X` casts defensively.** If TypeScript infers the correct type, trust it. Only use `as` when there is a genuine type boundary that the compiler cannot resolve.

**Rules:**

1. **Never cast to satisfy a hunch.** If you're not sure two types align, check the signatures — don't slap `as` on it.
2. **Never cast a return type that already matches.** If `buildNestedInclude()` returns `T | undefined` and the consumer expects `T | undefined`, no cast is needed.
3. **Never cast compatible function types.** If `useCreatorsNext` and `useCreatorsReact` have compatible signatures, assigning one where the other is expected needs no `as unknown as typeof ...` double-cast.
4. **Never cast a property access to its own type.** If `obj.address` is typed as `string`, writing `{obj.address as string}` in JSX is pointless.
5. **Unused type imports are a smell.** If you import `NftInclude` only to use it in `as NftInclude`, and removing the cast also removes the import — the cast was unnecessary.

**Legitimate uses of `as` (rare):**

- **Service boundary casts:** `as ProfileResult<I>` after `stripExcluded()` — TypeScript cannot infer that runtime stripping narrows the generic type parameter. This is a genuine type-system limitation.
- **Cross-domain parser sub-selections:** `as any` on nested sub-selections where codegen types omit fields that the primary parser expects. These are documented inline.

**Test:** If you remove an `as` cast and the code still compiles with `pnpm build` — the cast was unnecessary. Always try removing it first.

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

- **Never push directly to a PR base branch** — always create a feature branch and open a PR to it. This applies to `main`, epic branches, and any other branch that has an open PR.
- **Check for existing open PRs** from the current branch before creating a new one: `gh pr list --head $(git branch --show-current) --state open`
- **Branch naming**: `feat/indexer-<name>` per issue
- **All PRs target**: `refactor/indexer-v2-react` (not `main`)
- **Commit format**: `feat(indexer): description (#issue)` or `feat: description (closes #issue)`
- **After merge**: delete local + remote branch, `git fetch --prune`
- **Never merge PRs** without user review

### Issue Management (Required)

Before starting work: check for existing issue (`gh issue list --search "..."`), create if missing, label `in-progress`. After completing: close with commit reference or `gh issue close`. Use epic + sub-task structure for large features.

## Key Architecture Patterns (indexer)

### Enrichment Queue Architecture

**Philosophy**: Store all raw blockchain data, regardless of verification. FK references to UniversalProfile, DigitalAsset, and NFT entities are resolved via an enrichment queue after verification. Invalid addresses result in null FKs rather than entity removal.

### Pipeline (6 steps)

```
1. EXTRACT           EventPlugins decode events → BatchContext, queue enrichments
2. PERSIST RAW       Batch-persist all raw event entities from step 1
3. HANDLE            EntityHandlers run → derived entities into BatchContext, queue enrichments
4. PERSIST DERIVED   Batch-persist all handler entities from step 3
5. VERIFY            Collect unique addresses from enrichment queue, batch supportsInterface()
                     Create core entities (UP, DA, NFT) for valid addresses only
6. ENRICH            Group enrichment requests by (entityType, entityId)
                     Batch UPDATE FK references on already-persisted entities
```

### EventPlugin Structure

EventPlugins are **pure extractors**:

- Decode blockchain events into base entities
- Store entities in BatchContext with **null FK references initially**
- Queue enrichment requests via `ctx.queueEnrichment()` for FK resolution
- The pipeline handles all persistence (no `persist()` method on plugins)

```typescript
const LSP7TransferPlugin: EventPlugin = {
  name: 'lsp7Transfer',
  topic0: LSP7DigitalAsset.events.Transfer.topic,
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  extract(log, block, ctx) {
    // Decode event
    const { from, to, amount } = LSP7DigitalAsset.events.Transfer.decode(log);

    // Create base entity with null FKs
    const entity = new Transfer({
      id: uuidv4(),
      address: log.address,
      from,
      to,
      amount,
      digitalAsset: null, // FK initially null
    });

    // Add to BatchContext
    ctx.addEntity('LSP7Transfer', entity.id, entity);

    // Queue enrichment for digitalAsset FK
    ctx.queueEnrichment({
      category: EntityCategory.DigitalAsset,
      address: log.address,
      entityType: 'LSP7Transfer',
      entityId: entity.id,
      fkField: 'digitalAsset',
    });
  },
};
```

### EntityHandler Structure

EntityHandlers are **unified processors** for all derived entity creation (data keys, tallies, NFTs, metadata):

```typescript
const LSP4TokenNameHandler: EntityHandler = {
  name: 'lsp4TokenName',
  listensToBag: ['DataChanged'], // Subscribe to entity bag

  async handle(hctx, triggeredBy) {
    const events = hctx.batchCtx.getEntities<DataChanged>(triggeredBy);

    for (const event of events.values()) {
      // Filter by data key
      if (event.dataKey !== LSP4_TOKEN_NAME_KEY) continue;

      // Create derived entity
      const entity = new LSP4TokenName({
        id: event.address,
        address: event.address,
        value: hexToString(event.dataValue),
        digitalAsset: null, // FK initially null
      });

      // Add to BatchContext (pipeline persists)
      hctx.batchCtx.addEntity('LSP4TokenName', entity.id, entity);

      // Queue enrichment for digitalAsset FK
      hctx.batchCtx.queueEnrichment({
        category: EntityCategory.DigitalAsset,
        address: event.address,
        entityType: 'LSP4TokenName',
        entityId: entity.id,
        fkField: 'digitalAsset',
      });
    }
  },
};
```

### Enrichment Queue

Enrichment requests specify:

- `category`: EntityCategory to verify (UniversalProfile, DigitalAsset) or 'NFT'
- `address`: Address to verify
- `tokenId?`: For NFT category only
- `entityType`: Which entity type to enrich (e.g., 'Transfer', 'LSP4TokenName')
- `entityId`: Which entity id to enrich
- `fkField`: Which field on the entity to set the FK reference

After verification, the pipeline batch-updates entities with valid FK references. Invalid addresses result in null FKs (entity is still stored with raw data).

### File Structure

```
packages/indexer/src/
├── core/
│   ├── types.ts              # EventPlugin, EntityHandler, EnrichmentRequest interfaces
│   ├── batchContext.ts       # Shared entity bag + enrichment queue
│   ├── registry.ts           # Plugin/handler discovery
│   ├── pipeline.ts           # 6-step processBatch() orchestrator
│   ├── verification.ts       # Batch supportsInterface() via Multicall3
│   └── metadataWorkerPool.ts # Worker threads for IPFS/HTTP fetching
├── plugins/
│   └── events/               # EventPlugins (11 files)
│       ├── lsp7Transfer.plugin.ts
│       ├── dataChanged.plugin.ts
│       └── ...
├── handlers/                 # EntityHandlers (~20 files)
│   ├── lsp4TokenName.handler.ts
│   ├── totalSupply.handler.ts
│   ├── nft.handler.ts
│   └── ...
└── utils/
    └── index.ts              # Shared utilities
```

### Naming Conventions

| Element       | Convention             | Example                    |
| ------------- | ---------------------- | -------------------------- |
| Plugin files  | `camelCase.plugin.ts`  | `lsp7Transfer.plugin.ts`   |
| Handler files | `camelCase.handler.ts` | `lsp4TokenName.handler.ts` |
| Core files    | `camelCase.ts`         | `batchContext.ts`          |
