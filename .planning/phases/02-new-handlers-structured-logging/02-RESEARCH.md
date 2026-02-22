# Phase 2: New Handlers & Structured Logging - Research

**Researched:** 2026-02-06
**Domain:** V2 EntityHandler implementation (Follower, LSP6 verification) + structured JSON logging
**Confidence:** HIGH

## Summary

Phase 2 has three distinct workstreams: (1) a new Follower handler for Follow/Unfollow events, (2) verification and unit testing of the existing LSP6Controllers handler, and (3) structured logging across all 6 pipeline steps.

The Follower handler is straightforward — the V1 implementation is only 66 lines, the `Follow`/`Follower`/`Unfollow` TypeORM entities already exist in `@chillwhales/typeorm`, the `generateFollowId` utility already exists in V2's `utils/index.ts`, and the V2 EventPlugin + EntityHandler patterns are well-established by Phase 1. The LSP6Controllers handler already exists as a 456-line compiled JS file with full implementation — the work is verification and testing, not building from scratch.

For structured logging, the key discovery is that Subsquid's `context.log` already supports structured attributes natively — its `info(attributes, msg)` overload passes arbitrary objects as log record fields. The current codebase wraps structured data in `JSON.stringify()` which produces a string message containing JSON rather than true structured fields. The structured logger should wrap `context.log` to provide a consistent field schema (`step`, `entityType`, `blockRange`, etc.) without the `JSON.stringify()` wrapper, plus add a file sink for rotation.

**Primary recommendation:** Wrap Subsquid's `context.log.child()` with a thin logger factory that injects standard fields per pipeline step, and use `pino` for the file logging sink with rotation.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Log output format & content

- Minimal base fields on every log line: `level`, `step`, `message`, `timestamp`
- Additional fields vary per log call (entity type, count, handler name, etc.)
- Output to both stdout and file — stdout for production, rotating file for local dev convenience
- Four severity levels: `debug`, `info`, `warn`, `error`

#### Log filtering granularity

- Logs filterable by pipeline step (`step` field), entity type, and block range
- These fields must be present on relevant log lines beyond the base 4
- Structured JSON lines everywhere — both stdout and file, use `jq` for local filtering
- `debug` level on by default in dev (`NODE_ENV`), off in prod (info+)
- `LOG_LEVEL` env var overrides the auto-detected default regardless of environment

#### LSP6 handler scope

- `lsp6Controllers.handler.ts` (575 lines) already exists with full implementation — HNDL-03 is "verify correctness against V1 behavior, fix if needed" not build from scratch
- Handler already implements: queueClear for delete-then-reinsert, merge-upsert via persist hints, sub-entity linking with orphan cleanup
- Unit tests required to prove the delete-and-recreate cycle works correctly

#### Follower handler behavior

- Build new Follower EntityHandler — raw event plugins (`follow.plugin.ts`, `unfollow.plugin.ts`) already exist
- Follow events: create `Follower` entities with deterministic IDs (matching V1's `generateFollowId`)
- Unfollow events: use `queueDelete()` to remove `Follower` entities — follow V2 pipeline conventions
- Unit tests required to prove correct behavior (V1 data comparison deferred to Phase 5)

### Claude's Discretion

- Logger architecture: whether to wrap Subsquid's `context.log` or build a standalone logger module
- Log file rotation strategy and location
- Exact filterable fields beyond `step`, entity type, and block range

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core

| Library            | Version | Purpose                                            | Why Standard                                                                |
| ------------------ | ------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `@subsquid/logger` | 1.4.0   | Already in dependency tree; provides `context.log` | Native to the framework, already structured                                 |
| `pino`             | 9.x     | File-based structured JSON logging with rotation   | Industry standard for Node.js structured logging, minimal overhead          |
| `pino-roll`        | 1.x     | Log file rotation for pino                         | Official pino rotation plugin, handles file rotation without external tools |
| `vitest`           | 3.x     | Unit test runner                                   | Already used in compiled tests, follows existing patterns                   |

### Supporting

| Library                | Version     | Purpose                                           | When to Use          |
| ---------------------- | ----------- | ------------------------------------------------- | -------------------- |
| `@chillwhales/typeorm` | (workspace) | Entity types (Follow, Follower, Unfollow, LSP6\*) | Already a dependency |
| `@chillwhales/abi`     | (workspace) | LSP26FollowerSystem event ABI                     | Already a dependency |

### Alternatives Considered

| Instead of       | Could Use                              | Tradeoff                                                                                |
| ---------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| pino + pino-roll | winston                                | Winston is heavier, slower; pino is faster for JSON lines                               |
| pino + pino-roll | fs.createWriteStream + manual rotation | Manual rotation is error-prone (file handles, size checks, race conditions)             |
| pino (file only) | Wrapping context.log for both          | context.log writes to stderr with its own format; we need stdout + file with OUR format |

**Installation:**

```bash
pnpm add pino pino-roll
pnpm add -D vitest @types/node
```

## Architecture Patterns

### Recommended Project Structure

```
packages/indexer-v2/src/
├── core/
│   ├── logger.ts              # Logger factory: createStepLogger(step, context?)
│   └── __tests__/
│       ├── logger.test.ts     # Logger unit tests
│       └── ...
├── handlers/
│   ├── follower.handler.ts    # NEW: Follower EntityHandler
│   ├── lsp6Controllers.handler.ts  # EXISTS: verify + test
│   └── __tests__/
│       ├── follower.handler.test.ts      # NEW
│       └── lsp6Controllers.handler.test.ts  # NEW
├── plugins/events/
│   ├── follow.plugin.ts       # TO BUILD: Follow EventPlugin
│   └── unfollow.plugin.ts     # TO BUILD: Unfollow EventPlugin
```

### Pattern 1: Subsquid Logger — Structured Attributes (Native API)

**What:** Subsquid's `context.log` already supports passing an attributes object before the message string.

**Confidence:** HIGH — verified by reading `@subsquid/logger@1.4.0` source code.

The Subsquid Logger has this API:

```typescript
// Overloaded methods on Logger class:
info(msg?: string): void;
info(attributes?: object, msg?: string): void;
debug(msg?: string): void;
debug(attributes?: object, msg?: string): void;
// ... same for warn, error, trace, fatal

// Child logger with persistent attributes:
child(attributes: object): Logger;
child(ns: string, attributes?: object): Logger;
```

When called with `context.log.info({ step: 'EXTRACT', count: 5 }, 'Extracted entities')`, it produces a `LogRecord` with those attributes merged in. The `addAttributes()` function copies all keys except reserved ones (`time`, `level`, `ns`, `msg`) into the record.

**Current anti-pattern in codebase:**

```typescript
// BAD: wraps structured data in JSON.stringify, making it a single string message
context.log.info(JSON.stringify({ message: 'Persisted entities', count: 5 }));
// Produces: { level: "INFO", ns: "...", msg: "{\"message\":\"Persisted entities\",\"count\":5}" }
```

**Correct pattern:**

```typescript
// GOOD: pass structured attributes directly
context.log.info({ step: 'PERSIST_RAW', entityType: 'Follow', count: 5 }, 'Persisted raw entities');
// Produces: { level: 2, ns: "...", msg: "Persisted raw entities", step: "PERSIST_RAW", entityType: "Follow", count: 5 }
```

### Pattern 2: Logger Factory for Pipeline Steps

**What:** A thin factory function that creates step-scoped child loggers with consistent base fields.

**Why:** Ensures every log line from a pipeline step has the `step` field without manual repetition.

```typescript
// core/logger.ts
import { Logger } from '@subsquid/logger';

export type PipelineStep =
  | 'EXTRACT'
  | 'PERSIST_RAW'
  | 'HANDLE'
  | 'CLEAR_SUB_ENTITIES'
  | 'DELETE_ENTITIES'
  | 'PERSIST_DERIVED'
  | 'VERIFY'
  | 'ENRICH';

export function createStepLogger(
  baseLogger: Logger,
  step: PipelineStep,
  blockRange?: { from: number; to: number },
): Logger {
  const attrs: Record<string, unknown> = { step };
  if (blockRange) {
    attrs.blockRange = `${blockRange.from}-${blockRange.to}`;
  }
  return baseLogger.child(attrs);
}
```

Usage in `pipeline.ts`:

```typescript
const stepLog = createStepLogger(context.log, 'PERSIST_RAW', {
  from: context.blocks[0]?.header.height,
  to: context.blocks[context.blocks.length - 1]?.header.height,
});
stepLog.info({ entityType: type, count: entities.size }, 'Persisted raw entities');
```

### Pattern 3: Dual Output — Subsquid stdout + Pino file

**What:** Keep Subsquid's `context.log` for stdout (it already outputs structured JSON to stderr via its JSON sink), and add a pino instance for file logging.

**Why:** Subsquid controls `context.log`'s sink. We can't easily redirect it to a file. But we can create a standalone pino logger that writes to a rotating file and call it in parallel.

**Architecture recommendation:**

```typescript
// core/logger.ts
import pino from 'pino';

// File logger (only created once at startup)
let fileLogger: pino.Logger | null = null;

export function initFileLogger(logDir: string) {
  fileLogger = pino(
    { level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug') },
    pino.transport({
      target: 'pino-roll',
      options: {
        file: `${logDir}/indexer`,
        frequency: 'daily',
        mkdir: true,
        extension: '.log',
      },
    }),
  );
}

export function getFileLogger(): pino.Logger | null {
  return fileLogger;
}
```

### Pattern 4: Follower EntityHandler — Follow/Unfollow

**What:** An EntityHandler that listens to raw `Follow` and `Unfollow` entity bags, creates `Follower` entities with deterministic IDs on Follow, and queues `Follower` deletions on Unfollow.

**Why this is a handler, not just a plugin:** The V1 `followerSystemHandler` receives populated follow/unfollow entities and creates identifiable `Follower` entities. In V2, raw Follow/Unfollow events are persisted by EventPlugins (Step 2), then the Follower handler (Step 3) creates derived `Follower` entities.

```typescript
// handlers/follower.handler.ts
const FOLLOWER_TYPE = 'Follower';

const FollowerHandler: EntityHandler = {
  name: 'follower',
  listensToBag: ['Follow', 'Unfollow'],

  async handle(hctx, triggeredBy) {
    if (triggeredBy === 'Follow') {
      const follows = hctx.batchCtx.getEntities<Follow>('Follow');
      for (const follow of follows.values()) {
        const id = generateFollowId({
          followerAddress: follow.followerAddress,
          followedAddress: follow.followedAddress,
        });
        const entity = new Follower({
          id,
          timestamp: follow.timestamp,
          blockNumber: follow.blockNumber,
          logIndex: follow.logIndex,
          transactionIndex: follow.transactionIndex,
          address: follow.address,
          followerAddress: follow.followerAddress,
          followedAddress: follow.followedAddress,
          followerUniversalProfile: null,
          followedUniversalProfile: null,
        });
        hctx.batchCtx.addEntity(FOLLOWER_TYPE, entity.id, entity);
        // Queue enrichment for both UP FKs
        hctx.batchCtx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: follow.followerAddress,
          entityType: FOLLOWER_TYPE,
          entityId: entity.id,
          fkField: 'followerUniversalProfile',
        });
        hctx.batchCtx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: follow.followedAddress,
          entityType: FOLLOWER_TYPE,
          entityId: entity.id,
          fkField: 'followedUniversalProfile',
        });
      }
    }

    if (triggeredBy === 'Unfollow') {
      const unfollows = hctx.batchCtx.getEntities<Unfollow>('Unfollow');
      const entitiesToDelete: Follower[] = [];
      for (const unfollow of unfollows.values()) {
        const id = generateFollowId({
          followerAddress: unfollow.followerAddress,
          followedAddress: unfollow.unfollowedAddress, // Note: V1 uses 'unfollowedAddress'
        });
        entitiesToDelete.push(new Follower({ id }));
      }
      if (entitiesToDelete.length > 0) {
        hctx.batchCtx.queueDelete({
          entityClass: Follower,
          entities: entitiesToDelete,
        });
      }
    }
  },
};
```

### Pattern 5: Follow/Unfollow EventPlugins

**What:** Two EventPlugin files that decode LSP26 Follow and Unfollow events into raw entities.

**Key details from codebase investigation:**

- LSP26 contract address: `0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA` (from V1 `constants/index.ts:29`)
- LSP26 contract deployed at block 3179471+ (from `.planning/codebase/INTEGRATIONS.md:55`)
- Follow event decodes: `{ follower: address, addr: address }` — follower follows addr
- Unfollow event decodes: `{ unfollower: address, addr: address }` — unfollower unfollows addr
- Both are contract-scoped plugins (LSP26 is a singleton contract)

```typescript
// plugins/events/follow.plugin.ts
const FollowPlugin: EventPlugin = {
  name: 'follow',
  topic0: LSP26FollowerSystem.events.Follow.topic,
  contractFilter: { address: '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA', fromBlock: 3179471 },
  requiresVerification: [EntityCategory.UniversalProfile],
  extract(log, block, ctx) {
    const { follower, addr } = LSP26FollowerSystem.events.Follow.decode(log);
    const entity = new Follow({
      id: v4(),
      timestamp: new Date(block.header.timestamp),
      blockNumber: block.header.height,
      logIndex: log.logIndex,
      transactionIndex: log.transactionIndex,
      address: log.address,
      followerAddress: follower,
      followedAddress: addr,
      followerUniversalProfile: null,
      followedUniversalProfile: null,
    });
    ctx.addEntity('Follow', entity.id, entity);
    // Queue enrichment for both UPs
    ctx.queueEnrichment({ ... });
  },
};
```

### Anti-Patterns to Avoid

- **Wrapping context.log with JSON.stringify:** This is the current anti-pattern. Use the native attributes overload instead.
- **Building a custom log rotation system:** Use `pino-roll` or `pino/file` transport. File handle management, size-based rotation, and error recovery are complex.
- **Setting FKs directly in handlers:** The V2 pattern is to set FKs to `null` and use `queueEnrichment()` for FK resolution in Step 6. The only exception is handler-created entities referencing other handler-created entities (like OwnedToken → OwnedAsset).
- **Using `store.upsert()` directly in handlers:** Handlers add entities to BatchContext; the pipeline handles persistence.

## Don't Hand-Roll

| Problem                       | Don't Build                           | Use Instead                                                             | Why                                                                          |
| ----------------------------- | ------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Log file rotation             | Custom fs.write + rename + size check | `pino-roll` or `pino` file transport                                    | Race conditions with concurrent writes, error recovery, cleanup of old files |
| Log level filtering           | Custom if-statements per level        | Subsquid Logger's `level` property + pino's built-in level filtering    | Both libraries handle level comparison efficiently                           |
| Structured JSON serialization | Custom `JSON.stringify` wrappers      | Subsquid Logger attributes + pino's built-in serialization              | Both handle circular refs, BigInt, Date, etc.                                |
| Deterministic Follow ID       | New ID generation                     | Existing `generateFollowId()` in `@/utils`                              | Already matches V1 format `"{followerAddress} - {followedAddress}"`          |
| Event decoding                | Manual ABI decoding                   | `LSP26FollowerSystem.events.Follow.decode(log)` from `@chillwhales/abi` | Type-safe, tested, matches V1                                                |

**Key insight:** The V2 pipeline already handles entity persistence, FK resolution, and delete operations. Handlers should only populate BatchContext — never call `store.*` directly.

## Common Pitfalls

### Pitfall 1: Follow vs Follower Entity Confusion

**What goes wrong:** Three entity types exist — `Follow` (raw event), `Follower` (derived deterministic entity), and `Unfollow` (raw event). Easy to mix them up.
**Why it happens:** V1 used `Follow` for both the raw event and the identifiable entity (same TypeORM class with different IDs). V2 has separate `Follow` (uuid ID, raw event) and `Follower` (deterministic ID, handler-created).
**How to avoid:** Use clear entity type keys in BatchContext: `'Follow'` for raw events, `'Follower'` for handler-derived entities. The `Follow` EventPlugin creates `Follow` entities; the `FollowerHandler` creates `Follower` entities.
**Warning signs:** If handler creates entities with uuid IDs, it's creating raw events not derived entities.

### Pitfall 2: Unfollow → Follower Address Field Mismatch

**What goes wrong:** The Unfollow entity has `unfollowedAddress` but Follow has `followedAddress`. Using the wrong field in `generateFollowId` would produce a non-matching ID, failing to delete the correct Follower.
**Why it happens:** The schema uses different column names for the address being acted upon depending on the event type.
**How to avoid:** When computing the Follower ID for deletion, use `unfollow.unfollowedAddress` (not `unfollow.followedAddress`).
**Warning signs:** Follower entities persist in the DB after unfollow events.

### Pitfall 3: queueDelete Needs Real Entity Instances

**What goes wrong:** `queueDelete` is processed in Step 4a via `store.remove(request.entities)`. TypeORM's `remove()` needs entity instances with at least the `id` field set.
**Why it happens:** The pipeline code at `pipeline.js:214-216` calls `await context.store.remove(request.entities)`.
**How to avoid:** Create minimal entity instances: `new Follower({ id: computedId })`. Don't need to populate all fields — just the ID.
**Warning signs:** TypeORM errors about missing primary column.

### Pitfall 4: LSP6 queueClear vs queueDelete Semantics

**What goes wrong:** Confusing `queueClear` (sub-entity FK-based deletion) with `queueDelete` (direct entity deletion).
**Why it happens:** Both remove entities, but through different mechanisms.
**How to avoid:**

- `queueClear<T>({ subEntityClass, fkField, parentIds })` — finds sub-entities where `fkField IN parentIds`, then removes. Used by LSP6 for permissions/calls/datakeys linked to controllers.
- `queueDelete<T>({ entityClass, entities })` — directly removes the passed entity instances. Used by Follower handler for Unfollow.
  **Warning signs:** Using queueDelete when you mean queueClear (or vice versa).

### Pitfall 5: Subsquid Logger Outputs to stderr, Not stdout

**What goes wrong:** Assuming `context.log` writes to stdout. It actually writes to stderr (via `prettyStderrSink` or `jsonLinesStderrSink`).
**Why it happens:** Subsquid's default sinks target stderr. The user decision says "stdout for production."
**How to avoid:** For the file logger, use pino writing to a file. For stdout, either configure Subsquid's `setRootSink()` to write to stdout, or accept stderr as the "console" output and document it. Since the user wants structured JSON everywhere, consider using `setRootSink()` with a custom sink that writes to stdout.
**Warning signs:** Logs appearing on stderr instead of stdout in production.

### Pitfall 6: Follow/Unfollow EventPlugins Don't Exist Yet

**What goes wrong:** The CONTEXT.md says "raw event plugins already exist" but they do NOT exist in the V2 compiled code. V1 has `utils/follow/index.ts` and `utils/unfollow/index.ts`, but no V2 EventPlugins were built.
**Why it happens:** The context may have assumed V1 utils = V2 plugins. They need to be built as V2 EventPlugin implementations.
**How to avoid:** Plan tasks to build both `follow.plugin.ts` and `unfollow.plugin.ts` as V2 EventPlugin implementations, following the pattern in `executed.plugin.js`.
**Warning signs:** N/A — this is a planning correction.

## Code Examples

### V2 EntityHandler Interface (Verified from compiled type declarations)

```typescript
// Source: packages/indexer-v2/lib/core/types/handler.d.ts
export interface EntityHandler {
  readonly name: string;
  readonly listensToBag: string[];
  readonly postVerification?: boolean;
  readonly dependsOn?: string[];
  handle(hctx: HandlerContext, triggeredBy: string): void | Promise<void>;
}

export interface HandlerContext {
  store: Store;
  context: Context; // Subsquid DataHandlerContext<Store, FieldSelection>
  isHead: boolean;
  batchCtx: IBatchContext;
  workerPool: IMetadataWorkerPool;
}
```

### BatchContext Entity Operations (Verified from compiled type declarations)

```typescript
// Source: packages/indexer-v2/lib/core/types/batchContext.d.ts
export interface IBatchContext {
  addEntity(type: string, id: string, entity: unknown): void;
  getEntities<T>(type: string): Map<string, T>;
  removeEntity(type: string, id: string): void;
  hasEntities(type: string): boolean;

  queueDelete<T extends Entity>(request: DeleteRequest<T>): void;
  queueClear<T extends Entity>(request: ClearRequest<T>): void;
  queueEnrichment<T extends Entity>(request: EnrichmentRequest<T>): void;
  setPersistHint<T extends Entity>(type: string, hint: PersistHint<T>): void;
}

// DeleteRequest for queueDelete (used by Follower handler)
export interface DeleteRequest<T extends Entity> {
  entityClass: EntityConstructor<T>;
  entities: T[];
}

// ClearRequest for queueClear (used by LSP6 handler)
export interface ClearRequest<T extends Entity> {
  subEntityClass: EntityConstructor<T>;
  fkField: FKFields<T> & string;
  parentIds: string[];
}
```

### TypeORM Entities for Follow/Follower/Unfollow (Verified from source)

```typescript
// Source: @chillwhales/typeorm/src/model/generated/follow.model.ts
export class Follow {
  constructor(props?: Partial<Follow>) {
    Object.assign(this, props);
  }
  id!: string;
  timestamp!: Date;
  blockNumber!: number;
  logIndex!: number;
  transactionIndex!: number;
  address!: string; // Contract address (LSP26)
  followerAddress!: string;
  followedAddress!: string;
  followerUniversalProfile!: UniversalProfile | undefined | null;
  followedUniversalProfile!: UniversalProfile | undefined | null;
}

// Source: @chillwhales/typeorm/src/model/generated/follower.model.ts
// IDENTICAL SHAPE to Follow — same fields, same FKs
export class Follower {
  constructor(props?: Partial<Follower>) {
    Object.assign(this, props);
  }
  id!: string; // Deterministic: "{followerAddress} - {followedAddress}"
  timestamp!: Date;
  blockNumber!: number;
  logIndex!: number;
  transactionIndex!: number;
  address!: string;
  followerAddress!: string;
  followedAddress!: string;
  followerUniversalProfile!: UniversalProfile | undefined | null;
  followedUniversalProfile!: UniversalProfile | undefined | null;
}

// Source: @chillwhales/typeorm/src/model/generated/unfollow.model.ts
export class Unfollow {
  constructor(props?: Partial<Unfollow>) {
    Object.assign(this, props);
  }
  id!: string;
  timestamp!: Date;
  blockNumber!: number;
  logIndex!: number;
  transactionIndex!: number;
  address!: string;
  followerAddress!: string;
  unfollowedAddress!: string; // NOTE: "unfollowed" not "followed"
  followerUniversalProfile!: UniversalProfile | undefined | null;
  unfollowedUniversalProfile!: UniversalProfile | undefined | null; // Different FK name too
}
```

### Subsquid Logger API (Verified from @subsquid/logger@1.4.0 source)

```typescript
// Source: @subsquid/logger/lib/logger.d.ts
export class Logger {
  child(attributes: object): Logger;
  child(ns: string, attributes?: object): Logger;

  info(msg?: string): void;
  info(attributes?: object, msg?: string): void; // <-- KEY: structured attributes!

  debug(msg?: string): void;
  debug(attributes?: object, msg?: string): void;

  warn(msg?: string): void;
  warn(attributes?: object, msg?: string): void;

  error(msg?: string): void;
  error(attributes?: object, msg?: string): void;
}

// The LogRecord structure (what sinks receive):
export interface LogRecord {
  time: number;
  level: LogLevel; // 0=TRACE, 1=DEBUG, 2=INFO, 3=WARN, 4=ERROR, 5=FATAL
  ns: string;
  msg?: string;
  // ...plus any attributes added via child() or write()
}
```

### V1 Follower System Handler (Reference Implementation)

```typescript
// Source: packages/indexer/src/app/handlers/followerSystemHandler.ts (66 lines total)
// Follow: create identifiable entities with deterministic IDs
const identifiableFollowsMap = new Map(
  populatedFollowEntities.map((follow) => {
    const id = Utils.generateFollowId({
      followerAddress: follow.followerAddress,
      followedAddress: follow.followedAddress,
    });
    return [id, new Follow({ ...follow, id })];
  }),
);
await context.store.upsert([...identifiableFollowsMap.values()]);

// Unfollow: remove identifiable entities using generateFollowId
const identifiableUnfollowsMap = new Map(
  populatedUnfollowEntities.map((unfollow) => {
    const id = Utils.generateFollowId({
      followerAddress: unfollow.followerAddress,
      followedAddress: unfollow.unfollowedAddress, // Note: unfollowedAddress
    });
    return [id, new Unfollow({ ...unfollow, id })];
  }),
);
await context.store.remove([...identifiableUnfollowsMap.values()]);
```

### How Pipeline Processes queueDelete (Verified from pipeline.js)

```typescript
// Source: packages/indexer-v2/lib/core/pipeline.js lines 211-223
// Step 4a: DELETE ENTITIES
const deleteQueue = batchCtx.getDeleteQueue();
if (deleteQueue.length > 0) {
  for (const request of deleteQueue) {
    if (request.entities.length > 0) {
      await context.store.remove(request.entities);
      context.log.info(
        JSON.stringify({
          message: 'Deleted entities',
          entityClass: request.entityClass.name,
          count: request.entities.length,
        }),
      );
    }
  }
}
```

### How Pipeline Processes queueClear (Verified from pipeline.js)

```typescript
// Source: packages/indexer-v2/lib/core/pipeline.js lines 191-204
// Step 3.5: CLEAR SUB-ENTITIES
const clearQueue = batchCtx.getClearQueue();
if (clearQueue.length > 0) {
  for (const request of clearQueue) {
    const existing = await store.find(request.subEntityClass, {
      where: { [request.fkField]: In(request.parentIds) },
    });
    if (existing.length > 0) {
      await store.remove(existing);
    }
  }
}
```

### V2 LSP6Controllers Handler — Key Behaviors (Verified from compiled JS)

```typescript
// Source: packages/indexer-v2/lib/handlers/lsp6Controllers.handler.js
// 1. Sets persist hint for cross-batch merge
hctx.batchCtx.setPersistHint(CONTROLLER_TYPE, {
  entityClass: LSP6Controller,
  mergeFields: [
    'arrayIndex',
    'permissionsRawValue',
    'allowedCallsRawValue',
    'allowedDataKeysRawValue',
  ],
});

// 2. Uses mergeEntitiesFromBatchAndDb for existing controller lookup
const existingControllers = await mergeEntitiesFromBatchAndDb(
  hctx.store,
  hctx.batchCtx,
  CONTROLLER_TYPE,
  LSP6Controller,
  potentialIds,
);

// 3. Queues clear for sub-entities before re-insert
hctx.batchCtx.queueClear({
  subEntityClass: LSP6Permission,
  fkField: 'controller',
  parentIds: controllerIds,
});

// 4. Links sub-entities to parent controllers, removes orphans
linkSubEntitiesToController(hctx, PERMISSION_TYPE, controllers);
```

### Existing Test Mock Patterns (Verified from compiled tests)

```typescript
// Source: packages/indexer-v2/lib/core/__tests__/pipeline.test.js
// Mock store with tracking
function createMockStore() {
  const insertedEntities: any[] = [];
  const upsertedEntities: any[] = [];
  return {
    insert: vi.fn((entities) => {
      insertedEntities.push(...entities);
      return Promise.resolve();
    }),
    upsert: vi.fn((entities) => {
      upsertedEntities.push(...entities);
      return Promise.resolve();
    }),
    findBy: vi.fn(() => Promise.resolve([])),
    find: vi.fn(() => Promise.resolve([])),
    remove: vi.fn(() => Promise.resolve()),
    insertedEntities,
    upsertedEntities,
  };
}

// Mock context
function createMockContext(store, blocks = [mockBlock]) {
  return {
    blocks,
    store,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    isHead: false,
  };
}
```

## State of the Art

| Old Approach (V1)                                                 | Current Approach (V2)                                                   | Impact                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `store.upsert()`/`store.remove()` directly in handlers            | `batchCtx.addEntity()` + `queueDelete()` + pipeline handles persistence | Handlers are testable without DB                        |
| `JSON.stringify()` wrapped in `context.log.info()`                | Native `context.log.info(attributes, msg)`                              | True structured fields instead of embedded JSON strings |
| `Follow` entity reused for both raw event and identifiable entity | Separate `Follow` (raw, uuid) and `Follower` (derived, deterministic)   | Clear separation of concerns                            |
| Manual `findBy` + `remove` for sub-entity cleanup                 | `queueClear({ subEntityClass, fkField, parentIds })`                    | Pipeline handles the delete-then-reinsert pattern       |

**Note:** V1 used `Follow` entities for both raw events and identifiable records (same class, different IDs). V2 uses `Follow` for raw events and `Follower` for handler-created identifiable records. This is already reflected in the `@chillwhales/typeorm` schema.

## Open Questions

1. **Subsquid stdout vs stderr**

   - What we know: Subsquid's `context.log` default sinks write to stderr, not stdout. The user decision says "stdout for production."
   - What's unclear: Whether we should override Subsquid's root sink to write to stdout, or accept stderr as the production console output.
   - Recommendation: Use `setRootSink()` from `@subsquid/logger` to redirect to stdout in production. This is a single line at startup. Alternatively, accept stderr and document it — most container environments capture both stdout and stderr.

2. **Vitest configuration for TypeScript source**

   - What we know: V2 currently has no `src/` directory and no `package.json`. Tests exist only as compiled JS.
   - What's unclear: Whether Phase 2 should create the full TypeScript project structure or just add source files alongside compiled ones.
   - Recommendation: Create a minimal `vitest.config.ts` and add TypeScript source files. The planner should include a task to set up the V2 package infrastructure if it doesn't exist from Phase 1.

3. **Follow EventPlugin enrichment for raw events**
   - What we know: Raw `Follow` events have `followerUniversalProfile` and `followedUniversalProfile` FK fields. The `Follower` handler also needs UP enrichment.
   - What's unclear: Should both the EventPlugin AND the handler queue UP enrichment for the same addresses? Double enrichment would be harmless (deduplicated in Step 5) but wasteful.
   - Recommendation: EventPlugins queue enrichment for raw entity FKs. The Follower handler queues enrichment for `Follower` entity FKs. The same addresses will be verified once (Step 5 deduplicates by address), and each entity gets its own FK enriched in Step 6.

## Sources

### Primary (HIGH confidence)

- `@subsquid/logger@1.4.0` source code — Logger class API, sinks, LogRecord structure (verified from `node_modules`)
- `@chillwhales/typeorm` source — Follow, Follower, Unfollow entity schemas (verified from `node_modules`)
- `@chillwhales/abi` — LSP26FollowerSystem event ABI (verified from `node_modules`)
- V2 compiled code — EntityHandler interface, BatchContext, pipeline.js, lsp6Controllers.handler.js, ownedAssets.handler.js, totalSupply.handler.js (verified from `packages/indexer-v2/lib/`)
- V1 source — followerSystemHandler.ts, permissionsUpdateHandler.ts, follow/unfollow utils, constants (verified from `packages/indexer/src/`)

### Secondary (MEDIUM confidence)

- pino library — standard recommendation for Node.js structured logging based on ecosystem knowledge and npm download counts

### Tertiary (LOW confidence)

- None — all findings are from primary sources

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — verified all existing dependencies from source, pino is well-established
- Architecture: HIGH — all patterns derived from reading actual V2 compiled code and V1 source
- Pitfalls: HIGH — identified from actual code differences between V1 and V2

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable domain — TypeORM entities and pipeline interfaces are unlikely to change)
