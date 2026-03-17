# T01: 20.1-structured-logging-overhaul 01

**Slice:** S26 — **Milestone:** M001

## Description

Establish structured logging conventions and migrate core infrastructure (registry, config, startup) from console.* / bare string logs to structured `(attrs, message)` pattern.

Purpose: Foundation for Grafana/Loki queryability — all bootstrap and registry logs become filterable by step, component, plugin/handler name.
Output: LOGGING.md reference + zero console.* calls in registry/config/startup files.

## Must-Haves

- [ ] "Registry discovery logs emit structured fields (step, component, file, pluginName) queryable in Grafana"
- [ ] "Zero console.* calls remain in registry.ts, config.ts, or index.ts"
- [ ] "Startup logs in index.ts include structured metadata attrs (not bare strings)"
- [ ] "LOGGING.md reference document exists with field naming conventions"

## Files

- `packages/indexer/LOGGING.md`
- `packages/indexer/src/core/registry.ts`
- `packages/indexer/src/app/bootstrap.ts`
- `packages/indexer/src/app/config.ts`
- `packages/indexer/src/app/index.ts`
