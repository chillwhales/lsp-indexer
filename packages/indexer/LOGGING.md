# Structured Logging Field Reference

Field naming conventions for the indexer's structured logging.

All logs use the `(attrs, message)` pattern — structured fields in the first argument, a human-readable message string in the second.

## Core Fields (required on every log call)

| Field                                | Type           | Description                                          | Example                    |
| ------------------------------------ | -------------- | ---------------------------------------------------- | -------------------------- |
| `step`                               | `PipelineStep` | Pipeline step identifier                             | `'BOOTSTRAP'`, `'EXTRACT'` |
| `component` or `handler` or `plugin` | `string`       | Component emitting the log — use exactly one variant | `'registry'`, `'startup'`  |

Use `component` for infrastructure (registry, config, startup, worker). Use `handler` for EntityHandlers. Use `plugin` for EventPlugins.

These fields are typically set once via `logger.child({ step, component })` and inherited by all subsequent log calls.

## Common Optional Fields

| Field          | Type     | Description                       | Example                        |
| -------------- | -------- | --------------------------------- | ------------------------------ |
| `address`      | `string` | Ethereum address                  | `'0x1234...'`                  |
| `category`     | `string` | EntityCategory value              | `'UniversalProfile'`           |
| `durationMs`   | `number` | Timing in milliseconds            | `142`                          |
| `entityType`   | `string` | Entity bag key                    | `'Transfer'`, `'LSP4Metadata'` |
| `count`        | `number` | Numeric count of items            | `12`                           |
| `file`         | `string` | Source file path (discovery logs) | `'/path/to/foo.plugin.js'`     |
| `plugin`       | `string` | Specific event plugin name        | `'lsp7Transfer'`               |
| `handler`      | `string` | Specific entity handler name      | `'lsp4TokenName'`              |
| `pluginCount`  | `number` | Number of discovered plugins      | `11`                           |
| `handlerCount` | `number` | Number of discovered handlers     | `20`                           |
| `error`        | `string` | Error message string              | `'Connection refused'`         |
| `batchIndex`   | `number` | Batch processing index            | `0`                            |
| `totalCount`   | `number` | Total items in set                | `150`                          |
| `workerId`     | `number` | Worker thread identifier          | `1`                            |
| `threadId`     | `number` | Node.js thread ID                 | `42`                           |
| `poolSize`     | `number` | Worker pool size                  | `4`                            |
| `blockRange`   | `string` | Block range for this batch        | `'100-200'`                    |
| `blockNumber`  | `number` | Current block number              | `200`                          |

## Examples

### Correct — structured attrs + message

```typescript
// Discovery logging
this.logger?.warn({ file }, 'Invalid module export, skipping');

// Startup summary
logger.info(
  { step: 'BOOTSTRAP', component: 'startup', subscriptionCount: subscriptions.length },
  'Processor configured with log subscriptions from registry',
);

// Pipeline step with timing
dualLogger.info(
  { entityType: 'Transfer', count: entities.size, durationMs: elapsed },
  'Persisted raw entities',
);
```

### Anti-patterns — avoid these

```typescript
// ❌ JSON.stringify in log args — defeats structured querying
logger.info({ data: JSON.stringify(config) }, 'Config loaded');

// ❌ Template string embedding data — not queryable
logger.info(`Discovered ${count} plugins in ${dir}`);

// ❌ Bare string without attrs — no structured fields to filter on
logger.info('Pipeline configuration created');

// ✅ Instead, always use (attrs, message):
logger.info({ step: 'BOOTSTRAP', component: 'startup' }, 'Pipeline configuration created');
```

## Creating Child Loggers

Use `logger.child()` to set persistent fields:

```typescript
// Set step + component once, inherited by all calls
const bootLogger = logger.child({ step: 'BOOTSTRAP', component: 'registry' });
bootLogger.info({ pluginCount: 11 }, 'Discovered event plugins');
// Output includes: { step: 'BOOTSTRAP', component: 'registry', pluginCount: 11 }
```

For pipeline steps with block ranges, use `createStepLogger()` or `createDualLogger()` from `core/logger.ts`.
