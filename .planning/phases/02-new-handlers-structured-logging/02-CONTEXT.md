# Phase 2: New Handlers & Structured Logging - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Follower and permissions handlers deliver complete event coverage for remaining V1 entity types, while structured logging provides observability across all pipeline steps. The LSP6 controller handler already exists and needs verification, the Follower handler needs to be built, and structured logging needs to replace all ad-hoc logging.

</domain>

<decisions>
## Implementation Decisions

### Log output format & content

- Minimal base fields on every log line: `level`, `step`, `message`, `timestamp`
- Additional fields vary per log call (entity type, count, handler name, etc.)
- Output to both stdout and file — stdout for production, rotating file for local dev convenience
- Four severity levels: `debug`, `info`, `warn`, `error`

### Log filtering granularity

- Logs filterable by pipeline step (`step` field), entity type, and block range
- These fields must be present on relevant log lines beyond the base 4
- Structured JSON lines everywhere — both stdout and file, use `jq` for local filtering
- `debug` level on by default in dev (`NODE_ENV`), off in prod (info+)
- `LOG_LEVEL` env var overrides the auto-detected default regardless of environment

### LSP6 handler scope

- `lsp6Controllers.handler.ts` (575 lines) already exists with full implementation — HNDL-03 is "verify correctness against V1 behavior, fix if needed" not build from scratch
- Handler already implements: queueClear for delete-then-reinsert, merge-upsert via persist hints, sub-entity linking with orphan cleanup
- Unit tests required to prove the delete-and-recreate cycle works correctly

### Follower handler behavior

- Build new Follower EntityHandler — raw event plugins (`follow.plugin.ts`, `unfollow.plugin.ts`) already exist
- Follow events: create `Follower` entities with deterministic IDs (matching V1's `generateFollowId`)
- Unfollow events: use `queueDelete()` to remove `Follower` entities — follow V2 pipeline conventions
- Unit tests required to prove correct behavior (V1 data comparison deferred to Phase 5)

### Claude's Discretion

- Logger architecture: whether to wrap Subsquid's `context.log` or build a standalone logger module
- Log file rotation strategy and location
- Exact filterable fields beyond `step`, entity type, and block range

</decisions>

<specifics>
## Specific Ideas

- The existing pipeline already logs ad-hoc JSON via `context.log.info(JSON.stringify({...}))` — the structured logger should replace all of these with consistent field schemas
- `generateFollowId` utility already exists in `packages/indexer-v2/src/utils/index.ts` — reuse it for the Follower handler
- V1's `followerSystemHandler.ts` uses `context.store.upsert` for follows and `context.store.remove` for unfollows — V2 equivalent uses `batchCtx.addEntity()` and `queueDelete()`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 02-new-handlers-structured-logging_
_Context gathered: 2026-02-06_
