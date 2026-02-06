# Research Summary

**Project:** LSP Indexer V2 — Completing the Rewrite
**Synthesized:** 2026-02-06

---

## Executive Summary

This is a **completion project**, not a greenfield build. The V2 rewrite of the LUKSO LSP Indexer already has its core architecture implemented (6-step pipeline, BatchContext, PluginRegistry, 11 EventPlugins, 15 DataKey handlers) — but only as compiled JavaScript with lost TypeScript source. The remaining work is: reconstruct ~12 missing components as TypeScript, wire them together, validate data parity against V1, and cut over to production.

The stack is **stable and well-chosen** — no technology migrations are needed. Subsquid SDK (gateway API), TypeORM, Viem, PostgreSQL 17, Node.js 22, Hasura v2.46 are all current. The critical risk is not technology but **data parity**: V2 must produce identical database state to V1 for the same blockchain data, while V1 has known bugs (missing `break` statements, spin-wait hangs) that complicate comparison. The enrichment queue architecture intentionally changes V1's entity lifecycle (null FKs instead of entity removal), creating expected divergences that must be carefully managed during validation.

The recommended approach is a **4-phase completion**: (1) migrate remaining handlers to the EntityHandler interface, (2) build metadata fetch handlers and structured logging, (3) wire up the entry point and test end-to-end, (4) validate against V1 and deploy. Each phase has well-defined boundaries, clear dependencies, and documented pitfalls to avoid. The plugin architecture means post-cutover enhancements (new LSP standards, IPFS fallback, health endpoints) are trivially addable as single files.

---

## Consensus Findings

These points emerged independently across multiple research dimensions:

1. **No technology changes needed.** STACK confirms all versions are current. ARCHITECTURE confirms the existing patterns work. FEATURES confirms the framework handles most table-stakes features automatically. **Action: Do not migrate, upgrade, or introduce new dependencies during V2 completion.**

2. **V1-V2 data parity is the #1 risk.** FEATURES identifies it as the highest-risk feature. PITFALLS dedicates 5 of 22 pitfalls to parity risks. ARCHITECTURE documents the structural divergence (null FKs vs entity removal). **Action: Build the comparison tooling early, with an exclusion list for known V1 bugs.**

3. **Replace the spin-wait anti-pattern.** FEATURES flags it as a differentiator fix. PITFALLS calls it CRITICAL (Pitfall 10 — infinite loop risk). ARCHITECTURE's MetadataWorkerPool solves it. STACK recommends `p-limit` over worker threads for I/O-bound work. **Action: Use `Promise.allSettled()` + `p-limit` for all metadata fetching.**

4. **Handler ordering is critical.** ARCHITECTURE documents a 9-handler dependency chain. PITFALLS identifies 4 ordering-related pitfalls (Pitfalls 14, 16, 17). FEATURES notes handler dependencies in its dependency graph. **Action: Use explicit handler registration order in the entry point, not filesystem discovery order.**

5. **The pipeline is already built — wire, don't redesign.** ARCHITECTURE confirms `processBatch()`, `BatchContext`, `PluginRegistry` are complete in compiled JS. FEATURES confirms 11 EventPlugins and core infrastructure exist. **Action: Reconstruct TypeScript from compiled JS for complex components; rewrite from patterns for simple handlers.**

6. **Subsquid handles most infrastructure concerns automatically.** STACK confirms crash recovery, reorg handling, and batch processing are framework-provided. FEATURES confirms these are table stakes that come "free." PITFALLS confirms batch idempotency is framework-level. **Action: Don't rebuild what Subsquid provides.**

---

## Stack Assessment

**Summary:** The stack is frozen — no changes needed for V2 completion.

| Component                  | Version   | Verdict                                                |
| -------------------------- | --------- | ------------------------------------------------------ |
| Subsquid SDK (gateway API) | 1.27.2    | **Keep** — stable, do NOT migrate to Portal API (beta) |
| Viem                       | ^2.33.2   | **Keep** — correct choice over ethers.js               |
| TypeORM                    | ^0.3.25   | **Keep** — required by Subsquid, no alternatives       |
| Node.js                    | 22 LTS    | **Keep** — stable `worker_threads`, native `fetch()`   |
| PostgreSQL                 | 17-alpine | **Keep** — latest stable                               |
| Hasura                     | v2.46.0   | **Keep** — no v3 migration until v2 EOL                |
| TypeScript                 | ^5.9.2    | **Keep**                                               |
| pnpm                       | 10.15.0   | **Keep**                                               |

**Key decision:** Use async concurrency control (`p-limit`) for metadata fetching, not worker threads. Metadata fetching is I/O-bound (HTTP/IPFS), not CPU-bound.

**Post-V2 opportunities (defer):**

- Subsquid Portal SDK migration (significant API change, 5-10x faster sync)
- Multi-stage Docker build (image size optimization)
- Replace axios with native `fetch()`
- Replace `uuid` with `crypto.randomUUID()`

---

## Feature Priorities

### Must-Have (Table Stakes)

| Feature                                 | Status                 | Work Needed                                             |
| --------------------------------------- | ---------------------- | ------------------------------------------------------- |
| Crash recovery                          | ✅ Framework-provided  | None                                                    |
| Chain reorg handling                    | ✅ Framework-provided  | None                                                    |
| Metadata fetch retry with backoff       | 🔄 V1 pattern exists   | Replace spin-wait with `Promise.allSettled` + `p-limit` |
| Structured logging                      | 🔴 Missing             | Build thin wrapper around `context.log`                 |
| Data completeness (all events captured) | 🔄 Partially done      | Verify V2 topic subscriptions match V1                  |
| Idempotent re-processing                | ✅ Pattern established | Maintain upsert/insert split                            |
| V1 → V2 data comparison                 | 🔴 Missing             | Build comparison tooling                                |
| Docker deployment                       | ✅ V1 config exists    | Adapt for V2                                            |

### Should-Have (Differentiators — V2's value proposition)

| Feature                                      | Status                | Work Needed                 |
| -------------------------------------------- | --------------------- | --------------------------- |
| Plugin architecture (1-file-per-handler)     | ✅ Core implemented   | Complete remaining handlers |
| Enrichment queue with deferred FK resolution | ✅ Implemented (#101) | Validate correctness        |
| Concurrency-limited metadata fetching        | 🔴 Missing            | Build with `p-limit`        |
| LRU address verification cache               | ✅ Implemented (#17)  | None                        |
| Batch-level processing metrics               | 🔴 Missing            | Add to structured logging   |

### Defer to Post-Cutover

- HTTP health endpoint
- IPFS gateway fallback (multiple gateways)
- New LSP standards (LSP9, LSP10, etc.)
- Marketplace indexing (explicitly removed)
- Multi-chain support
- Redis/message queues
- Custom GraphQL resolvers

---

## Architecture Recommendations

### Pipeline (Exists — Don't Change)

```
EXTRACT → PERSIST RAW → HANDLE → CLEAR SUB-ENTITIES → PERSIST DERIVED → VERIFY → ENRICH
```

All 6 steps implemented in compiled JS. The pipeline correctly handles: sealed entity types, merge-upsert patterns, clear queues for sub-entities, batch verification, and FK enrichment.

### Remaining Components (Build Order)

| #   | Component                                        | Risk   | Depends On                       |
| --- | ------------------------------------------------ | ------ | -------------------------------- |
| 1   | Refactor totalSupply/ownedAssets/decimals (#105) | LOW    | Compiled V2 patterns             |
| 2   | FormattedTokenId handler (#113)                  | LOW    | NFT handler (exists)             |
| 3   | Delete legacy code (#106)                        | LOW    | #105 complete                    |
| 4   | Follower system handler (#52)                    | LOW    | V1 port                          |
| 5   | Permissions handler (#50)                        | LOW    | May already exist in compiled V2 |
| 6   | LSP3 metadata fetch (#53)                        | MEDIUM | Worker pool, `p-limit`           |
| 7   | LSP4 metadata fetch (#54)                        | MEDIUM | Worker pool, `p-limit`           |
| 8   | LSP29 metadata fetch (#55)                       | MEDIUM | Worker pool, `p-limit`           |
| 9   | Structured logging (#94)                         | LOW    | Parallelizable                   |
| 10  | Processor configuration (#57)                    | LOW    | Registry (exists)                |
| 11  | Entry point & startup (#58)                      | MEDIUM | All handlers                     |
| 12  | Integration testing (#59)                        | MEDIUM | Entry point                      |

### Critical Architecture Patterns

1. **Merge-upsert for cross-batch data integrity** — use `mergeEntitiesFromBatchAndDb()` and `setPersistHint()` to prevent field overwriting
2. **Explicit handler registration** — use `registerEntityHandler()` in dependency order, not filesystem auto-discovery
3. **BatchContext as single source of truth** within a batch — never bypass it with direct store access (except for DB reads via `mergeEntitiesFromBatchAndDb`)
4. **Initialize all FK fields as `null`** — the enrichment step checks `'field' in entity`, so omitted fields break silently
5. **Head-only metadata fetching** — guard with `context.isHead` to prevent blocking historical sync

---

## Critical Pitfalls

### Severity: CRITICAL (will block production if not addressed)

| #   | Pitfall                                                                               | Phase               | Prevention                                                               |
| --- | ------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| 10  | **Spin-wait infinite loop** on rejected metadata promise                              | Metadata handlers   | Use `Promise.allSettled()` + `p-limit`, not fire-and-forget + while-loop |
| 1   | **V1 bugs V2 must account for** (missing `break` statements create spurious entities) | V1/V2 comparison    | Build exclusion list before comparison; decide: reproduce or fix         |
| 18  | **Shared database corruption** if V1/V2 run against same DB                           | Side-by-side deploy | Separate databases, always                                               |
| 16  | **Handlers reading unpersisted data** when ordering changes                           | Entry point         | Preserve V1 ordering; persist before handle                              |

### Severity: HIGH (will cause data issues)

| #   | Pitfall                                     | Phase               | Prevention                                             |
| --- | ------------------------------------------- | ------------------- | ------------------------------------------------------ |
| 3   | Null FK vs entity removal divergence        | V1/V2 comparison    | Compare only reachable data (non-null FK joins)        |
| 7   | Upsert overwrites unintended fields         | Handler refactoring | Use merge-upsert, never full-entity spread             |
| 13  | Stale FK references after enrichment        | Enrichment queue    | Verify step must check both new and existing addresses |
| 17  | Handler creates entity that another deletes | Pipeline ordering   | Run cleanup AFTER enrichment, not before               |

### Severity: MEDIUM (should address, won't block)

| #   | Pitfall                                | Phase             | Prevention                                 |
| --- | -------------------------------------- | ----------------- | ------------------------------------------ |
| 9   | IPFS gateway single point of failure   | Metadata handlers | Defer multi-gateway to post-cutover        |
| 12  | Axios unbounded response size          | Metadata handlers | Set `maxContentLength: 10MB`, timeout: 30s |
| 5   | UUID non-determinism breaks comparison | V1/V2 comparison  | Compare by natural keys, never UUIDs       |

---

## Actionable Recommendations

Prioritized by impact and sequencing:

1. **Build V1/V2 comparison tooling early** (not last). Define the exclusion list for V1 bugs, natural-key comparison strategy, and per-table expected divergences BEFORE completing handler migration. This shapes how handlers are implemented.

2. **Replace spin-wait with `Promise.allSettled()` + `p-limit(50)`** in all three metadata fetch handlers. This is the single highest-risk pattern from V1. Non-negotiable for V2.

3. **Use explicit handler registration order** in the entry point. Document the dependency DAG. The 9-handler ordering chain must be correct for data integrity.

4. **Reconstruct TypeScript from compiled JS** for complex components (pipeline, BatchContext, registry, lsp6Controllers, nft handler). Rewrite from V1 patterns for simpler handlers (follower, totalSupply, ownedAssets).

5. **Freeze the schema** (`schema.graphql`) until V2 is live. Any change invalidates V1 comparison and breaks the shared TypeORM package.

6. **Add `maxContentLength` and timeout to all HTTP requests** (axios/fetch for IPFS). Prevent OOM from malicious payloads.

7. **Validate that compiled permissions handler (#50) covers V1 behavior** before building a new one. May already be done.

8. **Diff V1 vs V2 processor topic subscriptions** before integration testing. Missing a topic = permanent data loss.

---

## Open Questions

Questions requiring user/team input before or during implementation:

1. **V1 bug reproduction strategy:** Should V2 reproduce V1's `switch` fall-through bugs for exact data parity, or fix them and document expected divergences? This affects comparison tooling design and every handler's implementation.

2. **Null FK vs entity removal:** V2 keeps entities with null FKs where V1 removes them. Does the downstream GraphQL API need filtering adjustments (e.g., `WHERE universalProfile IS NOT NULL`)? Or should V2 add a cleanup step equivalent to V1's `removeEmptyEntities`?

3. **Metadata comparison scope:** During V1/V2 validation, should metadata sub-entity content be compared (fragile — depends on IPFS timing) or only structure (entity exists, URL matches, `isDataFetched` matches)?

4. **Source recovery approach:** For the 12 remaining components, what's the budget split between TypeScript reconstruction from compiled JS vs. clean rewrite from V1 patterns?

5. **Permissions handler (#50) status:** The compiled V2 `lsp6Controllers.handler.js` may already cover this. Needs verification before planning work.

6. **Worker threads vs async concurrency:** STACK recommends `p-limit` (I/O-bound), but V2 already has a compiled `MetadataWorkerPool` using worker threads. Should V2 keep the worker pool or simplify to async concurrency?

7. **Side-by-side RPC budget:** With 10 req/s rate limit, how should it be split between V1 (5) and V2 (5)? Or use separate RPC endpoints?

---

## Roadmap Implications

### Suggested Phase Structure

#### Phase 1: Handler Migration (Low Risk, High Value)

**Rationale:** All remaining handlers have clear patterns from compiled V2 and V1 source. No external I/O. Completes the "1-file-per-handler" architecture promise.

**Delivers:**

- totalSupply, ownedAssets, decimals refactored to EntityHandler interface (#105)
- FormattedTokenId handler (#113)
- Legacy code deletion (#106)
- Follower system handler (#52)
- Permissions handler verification/completion (#50)

**Pitfalls to avoid:** Handler ordering (Pitfall 16), upsert field overwriting (Pitfall 7), circular dependencies (Pitfall 14)

**Research needed:** None — patterns are well-documented in compiled V2 code.

#### Phase 2: Metadata & Cross-Cutting (Medium Risk)

**Rationale:** Metadata handlers involve external I/O (IPFS) and the spin-wait anti-pattern must be replaced. Structured logging is independent and parallelizable.

**Delivers:**

- LSP3 metadata fetch handler (#53)
- LSP4 metadata fetch handler (#54)
- LSP29 metadata fetch handler (#55)
- Structured logging layer (#94)
- `p-limit` concurrency control for all fetches

**Pitfalls to avoid:** Spin-wait infinite loop (Pitfall 10, CRITICAL), IPFS gateway failure (Pitfall 9), unbounded response size (Pitfall 12), data URL edge cases (Pitfall 11)

**Research needed:** May benefit from `/gsd-research-phase` on IPFS gateway resilience patterns and `p-limit` integration with Subsquid's batch model.

#### Phase 3: Integration & Wiring (Medium Risk)

**Rationale:** All handlers must exist before wiring the entry point. Integration testing validates the full pipeline.

**Delivers:**

- Processor configuration from registry (#57)
- Entry point & startup bootstrap (#58)
- Integration tests with mock store + fixtures (#59)
- Handler ordering validation
- V1 topic subscription parity check

**Pitfalls to avoid:** Missing event topics (Pitfall — processor config), wrong handler ordering (Pitfall 16, CRITICAL), wrong bootstrap sequence (entry point)

**Research needed:** None — patterns are in ARCHITECTURE.md.

#### Phase 4: Validation & Deployment (Highest Risk)

**Rationale:** This is where data parity is proven or disproven. Must come last because it requires a fully working V2.

**Delivers:**

- V1/V2 comparison SQL tooling
- Side-by-side Docker Compose deployment
- Automated table-level comparison (row counts + checksums)
- Entity-level diff for mismatched tables
- GraphQL API response comparison
- 24-48h side-by-side validation period
- Production cutover (Hasura metadata swap)

**Pitfalls to avoid:** Shared database corruption (Pitfall 18, CRITICAL), UUID comparison failures (Pitfall 5), metadata timing differences (Pitfall 4), V1 bug artifacts (Pitfall 1), Subsquid status table conflict (Pitfall 19)

**Research needed:** Likely needs `/gsd-research-phase` for comparison tooling design, `postgres_fdw` cross-database queries, and cutover procedure.

### Research Flags

| Phase                       | Needs Research? | Reason                                                         |
| --------------------------- | --------------- | -------------------------------------------------------------- |
| Phase 1 (Handler Migration) | No              | Well-documented patterns in compiled V2                        |
| Phase 2 (Metadata)          | Maybe           | IPFS resilience, `p-limit` + worker pool decision              |
| Phase 3 (Integration)       | No              | Entry point pattern documented in ARCHITECTURE.md              |
| Phase 4 (Validation)        | **Yes**         | Comparison tooling design, cutover procedure, cross-DB queries |

---

## Confidence Assessment

| Area                      | Confidence | Notes                                                                                        |
| ------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| Stack                     | **HIGH**   | All versions verified against official docs. No changes needed.                              |
| Features                  | **HIGH**   | Table stakes are framework-provided. Differentiators are well-scoped.                        |
| Architecture              | **HIGH**   | Based on direct codebase analysis of compiled V2 artifacts. Pipeline is proven.              |
| Pitfalls                  | **HIGH**   | Derived from actual code patterns and known V1 bugs. Not hypothetical.                       |
| Data Parity Strategy      | **MEDIUM** | Comparison approach is sound but untested. Edge cases in V1 bug inventory may be incomplete. |
| Metadata Fetch Resilience | **MEDIUM** | `p-limit` approach is well-known, but interaction with MetadataWorkerPool needs validation.  |

### Gaps Requiring Attention During Planning

1. **V1 bug inventory may be incomplete.** CONCERNS.md documents known bugs but there may be undiscovered ones that surface during comparison.
2. **Worker pool vs. `p-limit` decision not finalized.** Both exist in the codebase. Need to decide which to use.
3. **Hasura metadata drift between V1 and V2** is mentioned as a risk but no specific audit has been done.
4. **The `decimals` handler has a special lifecycle** — it needs post-verification data (newly verified DigitalAssets). The current EntityHandler interface may not support this cleanly. Architecture recommends a "post-verify hook" or direct pipeline integration.
5. **No performance benchmarks exist.** V2's pipeline may be faster or slower than V1. No baseline to compare against.

---

## Sources

Aggregated from all research dimensions:

### Official Documentation (HIGH Confidence)

- SQD SDK Overview: https://docs.sqd.dev/sdk/overview/
- SQD EvmBatchProcessor: https://docs.sqd.dev/sdk/reference/processors/evm-batch/
- SQD TypeORM Store: https://docs.sqd.dev/sdk/reference/store/typeorm/
- SQD Logger: https://docs.sqd.dev/sdk/reference/logger/
- SQD Self-Hosting: https://docs.sqd.dev/sdk/resources/self-hosting/
- SQD Portal Migration: https://docs.sqd.dev/migrate-to-portal-sdk/
- SQD Unfinalized Blocks: https://docs.subsquid.io/sdk/resources/unfinalized-blocks/
- SQD External APIs & IPFS: https://docs.sqd.dev/sdk/resources/external-api/
- LUKSO Standards: https://docs.lukso.tech/standards/introduction

### Codebase Analysis (HIGH Confidence)

- V1 source: `packages/indexer/src/`
- V2 compiled artifacts: `packages/indexer-v2/lib/`
- V2 compiled tests: `packages/indexer-v2/lib/core/__tests__/`
- Project planning: `.planning/codebase/`, `.planning/PROJECT.md`

---

_Synthesized: 2026-02-06_
