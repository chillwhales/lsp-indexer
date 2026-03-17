# Research: Phase 3.1 — Improve Debug Logging Strategy

**Research Date:** 2026-02-11  
**Phase Goal:** Create structured debug logging infrastructure with configurable log levels and component-specific debug flags, enabling faster debugging of worker pool, metadata fetch, and pipeline issues.

## Problem Context

During PR #152 (worker pool optimization), debugging required adding `console.log` statements because existing logging wasn't granular enough to trace worker operations. Need debug-level logging that can be toggled via environment variables without code changes.

## Current Infrastructure

**Existing Logging Setup (from Phase 2):**

- Dual-output: Subsquid `Logger.child()` + pino for file rotation
- `LOG_LEVEL` env var already controls log level (info/warn/debug)
- Step-based loggers (EXTRACT, PERSIST_RAW, HANDLE, etc.)
- Handler log calls use `step` + `handler` dual fields
- Structured JSON output with consistent field schemas

**Tech Stack:**

- pino 9.6.0 (already installed)
- pino-roll 1.1.0 (file rotation)
- worker_threads (MetadataWorkerPool)
- TypeScript + Node.js 22

## Research Findings

### 1. Debug Logging Patterns with Pino

**Recommended Approach: Component-Specific Child Loggers**

Pino's child logger pattern is ideal for component-specific filtering:

```typescript
// Create component-specific loggers
const createComponentLogger = (logger: Logger, component: string) => {
  return logger.child({ component });
};

// Usage
const workerPoolLogger = createComponentLogger(baseLogger, 'worker_pool');
workerPoolLogger.debug({ workerId, queueSize }, 'Processing batch');
```

**Benefits:**

- Native pino feature (no additional dependencies)
- Child logger creation is fast (~26ms for 10k loggers)
- Automatic field binding (component appears in every log entry)
- Works seamlessly with existing pino setup

**Level Filtering:**
Pino supports 6 levels: `trace` (10) < `debug` (20) < `info` (30) < `warn` (40) < `error` (50) < `fatal` (60)

### 2. Component-Specific Filtering Strategy

**Option A: Custom Mixin (Recommended)**

Use pino's `mixin` option to filter by `DEBUG_COMPONENTS` env var:

```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  mixin() {
    const enabledComponents = process.env.DEBUG_COMPONENTS?.split(',').map((c) => c.trim()) || [];
    // If DEBUG_COMPONENTS is empty, enable all; otherwise filter
    const isEnabled = enabledComponents.length === 0 || enabledComponents.includes(this.component);
    return { debug_enabled: isEnabled };
  },
});
```

**Usage:**

```bash
# Enable debug for all components
LOG_LEVEL=debug npm start

# Enable debug for specific components only
LOG_LEVEL=debug DEBUG_COMPONENTS=worker_pool,metadata_fetch npm start
```

**Option B: pino-debug Integration**

The `pino-debug` package can intercept `debug()` calls and route through pino:

```typescript
import pinodebug from 'pino-debug';
pinodebug(logger, {
  auto: true, // intercept all debug() calls
  map: {
    'worker_pool:*': 'debug',
    'metadata_fetch:*': 'debug',
  },
});
```

**Tradeoffs:**

- ✓ Familiar `DEBUG` env var patterns (e.g., `DEBUG=worker_pool:*`)
- ✓ 10x performance improvement over raw debug library
- ✗ Additional dependency
- ✗ May be overkill if only need simple component filtering

**Recommendation:** Start with Option A (custom mixin). Only adopt `pino-debug` if complex namespace patterns become necessary.

### 3. Performance Impact

**Zero-Cost Debug Logging (from pino docs):**

```typescript
// Performance-optimized pattern
if (logger.isLevelEnabled('debug')) {
  logger.debug({ workerId, queueSize }, 'Processing batch');
}
```

**Benchmarks (from pino docs):**

- Disabled log levels: near-zero overhead (noop check)
- Child logger creation: ~26ms for 10k loggers
- Log call with disabled level: < 1ns (early return)

**Verdict:** Debug logging can be added liberally without performance concerns when disabled.

### 4. Worker Thread Considerations

**Challenge:** MetadataWorkerPool uses worker_threads for parallel metadata fetching. Logging across threads requires coordination.

**Option A: Worker Posts Messages to Main Thread**

```typescript
// In worker thread
parentPort?.postMessage({
  type: 'log',
  level: 'debug',
  component: 'metadata_worker',
  data: { workerId, url, duration },
});

// In main thread
worker.on('message', (msg) => {
  if (msg.type === 'log') {
    logger[msg.level]({ component: msg.component, ...msg.data });
  }
});
```

**Benefits:**

- Centralized logging (all logs go through main thread logger)
- Consistent formatting
- Single log file

**Option B: Each Worker Creates Own Logger**

```typescript
// In worker thread
import { pino } from 'pino';
const logger = pino({
  /* same config as main */
}).child({
  component: 'metadata_worker',
  workerId: workerData.id,
});
```

**Benefits:**

- Simpler implementation (no message passing)
- Workers log directly to file

**Tradeoffs:**

- Multiple file handles (one per worker)
- Workers inherit env vars (DEBUG_COMPONENTS works automatically)

**Recommendation:** Start with Option A (message passing) for centralized logging. If performance becomes an issue, switch to Option B.

### 5. Integration Strategy

**Existing Logger Location:** `src/lib/logger.ts` (from Phase 2)

**Minimal Changes Required:**

1. **Add component field to logger creation:**

   ```typescript
   export const createComponentLogger = (component: string) => {
     return logger.child({ component });
   };
   ```

2. **Update worker pool to use component logger:**

   ```typescript
   const workerLogger = createComponentLogger('worker_pool');
   workerLogger.debug({ availableWorkers, queueSize }, 'Submitting batch');
   ```

3. **Add debug logging to metadata handlers:**

   ```typescript
   const metadataLogger = createComponentLogger('metadata_fetch');
   metadataLogger.debug({ url, contentType }, 'Fetching metadata');
   ```

4. **Optional: Add mixin for DEBUG_COMPONENTS filtering**

**No refactoring needed.** Existing logger infrastructure supports this pattern natively.

### 6. Component Naming Convention

**Recommended Components:**

| Component         | Scope                                   |
| ----------------- | --------------------------------------- |
| `worker_pool`     | MetadataWorkerPool batch scheduling     |
| `metadata_worker` | Individual worker thread operations     |
| `metadata_fetch`  | LSP3/LSP4/LSP29 metadata fetch handlers |
| `pipeline`        | Pipeline step orchestration             |
| `handler`         | EntityHandler execution (existing)      |
| `plugin`          | EventPlugin extraction (existing)       |
| `bootstrap`       | Application startup (existing)          |

**Existing fields:**

- `step`: Pipeline step (EXTRACT, HANDLE, VERIFY, etc.)
- `handler`: Handler name (e.g., 'LSP3MetadataFetchHandler')

**New field:**

- `component`: High-level component name for debug filtering

## Recommended Implementation Plan

**Plan 1: Logger Utility Enhancement**

- Add `createComponentLogger()` helper to logger.ts
- Add `DEBUG_COMPONENTS` env var filtering via mixin
- Update logger tests to verify component filtering

**Plan 2: Worker Pool Debug Logging**

- Add component logger to MetadataWorkerPool
- Log batch submission, worker availability, queue size
- Log worker completion and error states
- Use message passing for worker thread logs

**Plan 3: Metadata Handler Debug Logging**

- Add debug logging to LSP3/LSP4/LSP29 fetch handlers
- Log URL, content type, parse success/failure
- Log retry attempts and backoff delays

**Plan 4: Pipeline Debug Logging** (optional, lower priority)

- Add debug logging to pipeline orchestration
- Log batch sizes, handler execution order, timing

## Open Questions

1. **Log verbosity:** Should debug logs include full entity objects or just IDs/counts?

   - **Recommendation:** IDs/counts only (avoid huge log files)

2. **Existing step/handler fields:** Keep or replace with component?

   - **Recommendation:** Keep existing fields, add component as additional field

3. **Worker thread strategy:** Message passing or independent loggers?
   - **Recommendation:** Start with message passing for centralized logging

## References

- Pino API docs: https://github.com/pinojs/pino/blob/master/docs/api.md
- Pino child loggers: https://github.com/pinojs/pino/blob/master/docs/child-loggers.md
- pino-debug package: https://github.com/pinojs/pino-debug
- debug library: https://github.com/debug-js/debug

## Confidence Levels

- **Debug logging patterns:** HIGH (pino official docs, existing codebase)
- **Component filtering:** HIGH (pino mixin pattern well-documented)
- **Worker thread logging:** MEDIUM (multiple valid approaches)
- **Performance impact:** HIGH (pino benchmarks, logger.isLevelEnabled() pattern)

---

**Next Step:** Use this research to create executable PLAN.md files for Phase 3.1