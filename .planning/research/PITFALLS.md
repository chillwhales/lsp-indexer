# Pitfalls Research

**Domain:** Blockchain indexer V1→V2 rewrite (LUKSO LSP Indexer)
**Researched:** 2026-02-06
**Confidence:** HIGH (based on direct codebase analysis + domain experience)

---

## Data Parity Risks

The #1 risk in a V1→V2 migration is producing different data. For this codebase specifically:

### Pitfall 1: V1 Has Known Bugs That V2 Must Reproduce

**What goes wrong:** V2 "fixes" V1 bugs, producing _correct_ data that differs from V1. Automated comparison fails, blocking cutover.
**Why it happens:** V1's `scanLogs` has missing `break` statements (lines 207, 216, 222, 254 in `scanner.ts`) causing fall-through. LSP4Creators length events create spurious LSP5, LSP6, and LSP8 entities. If V2 fixes this, the database states diverge.
**Consequences:** V1/V2 comparison reports thousands of "missing" entities that are actually V1 artifacts.
**Prevention:**

- Catalog ALL known V1 bugs before comparison (the CONCERNS.md already documents these)
- Build the comparison tool with an **exclusion list** for known V1 artifacts
- Decide explicitly: does V2 reproduce the bugs or fix them? If fixing, document which tables will diverge and by how much
- Run comparison on a per-table basis with known-divergence thresholds

### Pitfall 2: Entity Ordering Produces Different "Latest" Values

**What goes wrong:** V1 and V2 process the same events but, due to Map iteration order or sort stability differences, pick different "latest" values for entities keyed by address.
**Why it happens:** V1 uses `Map` for deduplication (e.g., `lsp3ProfileEntities.set(lsp3Profile.id, lsp3Profile)` — last-write-wins). If two events in the same batch update the same entity, order matters. V2's enrichment queue might process them in a different order.
**This codebase specifically:** `scanLogs` iterates `context.blocks` → `block.logs` sequentially. If V2 changes to parallel extraction, last-write-wins semantics may change.
**Prevention:**

- V2 must iterate logs in the **exact same block/logIndex order** as V1
- For entities using Map deduplication, ensure last-write-wins produces the same winner
- Add a comparison test that replays a specific batch and diffs entity-by-entity

### Pitfall 3: Null FK vs Entity Removal Divergence

**What goes wrong:** V1 removes entities for invalid addresses (via `removeEmptyEntities` and populate filtering). V2 keeps entities with null FKs. The database states differ structurally even though the _valid_ data is identical.
**Why it happens:** This is the core architectural change — V2's enrichment queue intentionally changes behavior.
**Prevention:**

- Comparison query must JOIN through FKs and compare only **reachable** data (entities with non-null parent FKs)
- Or: V2 must have a cleanup step equivalent to `removeEmptyEntities` that deletes orphaned rows
- Document which tables will have extra rows in V2 vs V1

### Pitfall 4: Metadata Fetch Timing Differences

**What goes wrong:** V1 and V2 fetch IPFS metadata at different times, getting different content (metadata updates, IPFS gateway caching, transient errors).
**Why it happens:** Metadata fetching happens at chain head (`context.isHead`). V1 and V2 reach head at different times. IPFS content can change. Gateway may return different results.
**Prevention:**

- Exclude metadata sub-entities (LSP3ProfileName, LSP4MetadataImage, etc.) from automated comparison, OR
- Compare only the `url` and `isDataFetched` fields, not the fetched content
- Compare at the structural level: "does this entity exist?" not "is the image URL identical?"

### Pitfall 5: UUID Non-Determinism

**What goes wrong:** V1 and V2 generate different UUIDs for event entities, making row-level comparison impossible.
**Why it happens:** Event entities (Executed, DataChanged, Transfer, etc.) use `uuid v4()` which is random. Sub-entities (LSP3ProfileName, LSP4MetadataAttribute) also use random UUIDs.
**Prevention:**

- Compare by **composite natural key** (address + blockNumber + logIndex + transactionIndex), never by UUID
- Build comparison queries that JOIN on natural keys, not IDs
- For sub-entities, compare by parent FK + value, not by ID

---

## TypeORM Batch Operations

### Pitfall 6: Concurrent Upsert Deadlocks

**What goes wrong:** V1's `index.ts` fires ~30+ `context.store.upsert()` and `context.store.insert()` calls in parallel via `Promise.all()`. TypeORM upserts acquire row-level locks. When two upserts target overlapping rows (e.g., a UniversalProfile referenced by both a DataChanged and a Transfer), PostgreSQL can deadlock.
**Why it happens:** `Promise.all([context.store.upsert(A), context.store.upsert(B)])` where A and B have overlapping primary keys or FK references. PostgreSQL locks rows in different orders.
**This codebase specifically:** Line 189-193 of `index.ts` upserts UniversalProfiles, DigitalAssets, and NFTs in parallel. Then lines 393-479 upsert 25+ entity types in parallel. If a DigitalAsset upsert and an LSP4Metadata upsert both touch the same `digitalAsset` FK row, deadlock is possible.
**Prevention:**

- Upsert parent entities (UniversalProfile, DigitalAsset, NFT) **before** child entities — V1 already does this correctly
- For child entity upserts, ensure they don't have overlapping FK targets within the same parallel batch
- V2's pipeline runs PERSIST RAW → PERSIST DERIVED sequentially, which naturally avoids this
- If deadlocks occur, add retry logic with exponential backoff (PostgreSQL deadlocks are transient)

### Pitfall 7: Upsert Overwrites Unintended Fields

**What goes wrong:** TypeORM `upsert` with a full entity object overwrites ALL columns. If an entity was partially updated by one handler and then upserted by another with stale data, the second upsert erases the first handler's changes.
**Why it happens:** V1 constructs entities like `new UniversalProfile({ ...validUniversalProfiles.get(id)!, lsp3Profile: ... })`. If `validUniversalProfiles` was fetched before another handler modified the same row, the spread operator uses stale data.
**This codebase specifically:** `lsp3ProfileHandler` upserts UniversalProfile with `lsp3Profile` FK. `ownershipTransferredHandler` upserts `UniversalProfileOwner`. If both run in the same batch, handler ordering determines which write wins. V1 runs them sequentially, so later handlers overwrite earlier ones.
**Prevention:**

- V2 should use UPDATE with specific columns (the enrichment queue's batch UPDATE approach) instead of full-entity upsert
- Never spread-overwrite an entity; merge only the fields you're changing
- Test: modify a UniversalProfile in two handlers in the same batch, verify both changes persist

### Pitfall 8: Insert Duplicate Key Violations

**What goes wrong:** `context.store.insert()` throws if a row with the same PK already exists. This crashes the batch.
**Why it happens:** V1 uses `insert` for event entities (Executed, DataChanged, etc.) which have UUID PKs — safe because UUIDs don't collide. But if V2 changes ID generation to deterministic keys, or if a retry re-processes the same batch, inserts fail.
**This codebase specifically:** Subsquid's `TypeormDatabase` handles batch idempotency at the framework level (it tracks processed block ranges). But if V2 introduces its own retry logic, duplicate inserts are possible.
**Prevention:**

- Use `upsert` for any entity with a deterministic PK (address-based IDs)
- Use `insert` only for entities with random UUIDs (events)
- V2's pipeline should be idempotent: re-processing a batch should produce the same state

---

## Metadata Fetching

### Pitfall 9: IPFS Gateway Single Point of Failure

**What goes wrong:** The single IPFS gateway (`https://api.universalprofile.cloud/ipfs/`) goes down, and ALL metadata fetches fail simultaneously, filling the retry queue.
**Why it happens:** V1 has one `IPFS_GATEWAY` env var. No fallback. IPFS gateways are notoriously unreliable.
**Consequences:** Thousands of entities marked with fetch errors. Even after gateway recovers, retry logic limits each entity to `FETCH_RETRY_COUNT` (5) attempts. Entities that exhausted retries during the outage are permanently stuck.
**Prevention:**

- V2 should support multiple IPFS gateways with fallback (e.g., ipfs.io, dweb.link, Pinata, custom)
- Separate "permanent failure" from "transient failure" — gateway outage should not count against retry limit
- Add a "reset retries" mechanism for mass transient failures
- Consider a circuit breaker: if >50% of fetches fail in a batch, skip fetching and retry next batch

### Pitfall 10: Spin-Wait Infinite Loop on Unhandled Promise Rejection

**What goes wrong:** The metadata fetch loop hangs forever.
**Why it happens:** All three metadata handlers (LSP3, LSP4, LSP29) use a fire-and-forget `.then()` pattern with a spin-wait counter. If any promise rejects without being caught by `.then()`, the counter never increments, and the `while` loop spins forever.
**This codebase specifically:** Lines 118-151 of `lsp3ProfileHandler.ts` — `extractSubEntities(lsp3Profile).then(result => { ... })`. If `extractSubEntities` throws (not returns an error object), the `.then()` is skipped, `updatedLsp3Profiles.length` never reaches the target, and the handler blocks indefinitely.
**Consequences:** Indexer hangs. No new blocks processed. Data falls behind chain tip. No error logged because the hang is in a polling loop.
**Prevention:**

- **V2 must not use this pattern.** Replace with `Promise.allSettled()` or a concurrency limiter (`p-limit`)
- Add a timeout: if batch hasn't completed in N minutes, log error and continue
- Add `.catch()` to every fire-and-forget promise

### Pitfall 11: Data URL Handling Edge Cases

**What goes wrong:** On-chain data contains `data:` URIs with malformed or unexpected content. The `parseDataURL` library fails silently or returns unexpected results.
**Why it happens:** Smart contracts can store arbitrary bytes in data keys. Users may set malformed `data:` URIs.
**This codebase specifically:** `getDataFromURL` in `utils/index.ts` handles `data:` URLs but only checks for `application/json` MIME type. Edge cases: no MIME type, base64-encoded non-JSON, excessively large data URLs.
**Prevention:**

- Add size limits for `data:` URL parsing (prevent OOM from massive base64 payloads)
- Handle `null` result from `parseDataURL`
- Add timeout for JSON parsing of large payloads

### Pitfall 12: Axios Unbounded Response Size

**What goes wrong:** A malicious or broken IPFS URL returns a massive response (e.g., 1GB), exhausting memory.
**Why it happens:** `axios.get()` in `getDataFromURL` has no `maxContentLength` or `maxBodyLength` configured.
**Prevention:**

- Set `maxContentLength` and `maxBodyLength` (e.g., 10MB) on axios requests
- Add request timeout (e.g., 30s)
- V2 should use the `metadataWorkerPool` to isolate fetch failures from the main process

---

## Enrichment Queue Edge Cases

### Pitfall 13: Stale FK References After Enrichment

**What goes wrong:** V2 persists raw entities with null FKs in Step 2, then tries to UPDATE FKs in Step 6 (ENRICH). But between Steps 2 and 6, the referenced parent entity may not exist yet (it was created in a later batch).
**Why it happens:** Entity A references Entity B, but B is created in a future batch. A's FK stays null forever because the enrichment only runs for the current batch.
**This codebase specifically:** A `DataChanged` event for address X fires before the `OwnershipTransferred` event that reveals X is a UniversalProfile. The DataChanged entity persists with `universalProfile: null`. When X is later verified as a UP, existing DataChanged entities don't get their FKs retroactively updated.
**V1 behavior:** V1 handles this because `verifyEntities` runs first and checks `knownUniversalProfiles` (already in DB from previous batches). So the DataChanged entity gets populated correctly.
**Prevention:**

- V2's VERIFY step must check BOTH newly-seen addresses AND previously-unknown addresses that now appear in the DB
- Consider a periodic "backfill enrichment" job that re-resolves null FKs against the current entity tables
- The LRU cache in V2 (#17) helps by caching verification results across batches

### Pitfall 14: Circular Handler Dependencies

**What goes wrong:** Handler A creates entities that Handler B depends on, and Handler B creates entities that Handler A depends on. Neither can complete.
**Why it happens:** V2's EntityHandler interface has `listensToBag` — handlers declare what they consume. If two handlers both produce and consume each other's output, the pipeline can't determine execution order.
**This codebase specifically:** `lsp4MetadataHandler` reads NFTs and writes LSP4Metadata. `lsp4MetadataBaseUri` reads LSP8TokenMetadataBaseURI + NFTs and also writes LSP4Metadata. If V2 models these as separate handlers that both listen to NFT entities, they might conflict.
**Prevention:**

- V2 handlers should be ordered by dependency (DAG). Document the dependency graph
- Never have two handlers write to the same entity type in the same step
- If unavoidable, merge the conflicting handlers into one

### Pitfall 15: Missing Entities From Previous Batches

**What goes wrong:** A handler queries the DB for an entity that should exist (from a previous batch) but doesn't find it because the previous batch hasn't committed yet.
**Why it happens:** Subsquid's `TypeormDatabase` batches DB operations. Each batch is a transaction. If Batch N and Batch N+1 overlap (they don't in Subsquid, but worth verifying), or if V2 introduces parallel batch processing, DB state may be stale.
**This codebase specifically:** `ownedAssetsHandler` queries `OwnedAsset` entities from the DB, then merges with current-batch transfers. If the DB query returns stale data (from two batches ago, not one batch ago), balances will be wrong.
**Prevention:**

- Confirm Subsquid processes batches strictly sequentially (it does — `processor.run()` awaits each callback)
- V2 must NOT parallelize batch processing
- All within-batch state should be tracked in `BatchContext`, not re-queried from DB

---

## Handler Ordering

### Pitfall 16: Handlers Reading Unpersisted Data

**What goes wrong:** Handler B reads data from the database that Handler A was supposed to persist, but Handler A hasn't committed yet.
**Why it happens:** V1 runs handlers sequentially. Handler A upserts data, then Handler B queries it. If V2 changes handler ordering or parallelizes handlers, B may query stale data.
**This codebase specifically (V1 ordering dependencies):**

1. `permissionsUpdateHandler` — removes old LSP6 sub-entities, inserts new ones. Must run BEFORE any handler that reads LSP6 permissions.
2. `removeEmptyEntities` — deletes null-valued LSP4/LSP5/LSP12 items. Must run AFTER raw entity persistence but BEFORE handlers that read these tables.
3. `decimalsHandler` — fetches decimals for **new** DigitalAssets. Must run AFTER DigitalAsset upsert.
4. `totalSupplyHandler` — reads existing TotalSupply from DB, merges with current transfers. Must run AFTER Transfer entity persistence.
5. `ownedAssetsHandler` — reads existing OwnedAsset from DB. Must run AFTER Transfer persistence.
6. `lsp3ProfileHandler` — updates UniversalProfile with `lsp3Profile` FK. Must run AFTER UP upsert.
7. `lsp4MetadataHandler` — updates DigitalAsset with `lsp4Metadata` FK, updates NFT with `lsp4Metadata` FK. Must run AFTER DA + NFT upsert.
8. `ownershipTransferredHandler` — creates UniversalProfileOwner and DigitalAssetOwner. Must run AFTER UP + DA upsert.
   **Prevention:**

- V2 must document handler execution order as a formal dependency graph
- The pipeline should enforce: PERSIST → HANDLE (read from freshly committed data)
- V2's 6-step pipeline naturally handles this: Steps 2 and 4 commit to DB, Steps 3 and 6 read from committed state

### Pitfall 17: Handler Creates Entity That Another Handler Deletes

**What goes wrong:** One handler inserts rows, another handler deletes them in the same batch.
**This codebase specifically:** `removeEmptyEntities` deletes LSP4CreatorsItem where `creatorAddress IS NULL`. But in the same batch, a DataChanged event might create an LSP4CreatorsItem with null `creatorAddress` that will be populated by the enrichment step. If `removeEmptyEntities` runs before enrichment, it deletes the entity that enrichment was about to populate.
**V1 behavior:** `removeEmptyEntities` runs AFTER `populateEntities` (which sets FKs), so it only removes truly empty entities. But in V2's enrichment queue model, FKs are set in a later step, so running cleanup before enrichment is dangerous.
**Prevention:**

- V2 should run `removeEmptyEntities` equivalent AFTER the enrichment step, not before
- Or: V2's null-FK model may make `removeEmptyEntities` unnecessary — null FKs are expected, not errors

---

## Deployment Risks

### Pitfall 18: Shared Database Schema Conflicts

**What goes wrong:** V1 and V2 running side-by-side against the same database corrupt each other's state.
**Why it happens:** Both V1 and V2 use the same TypeORM entities, same table names, same columns. If both write to the same tables simultaneously, they'll overwrite each other's data. Subsquid also maintains a `status` table tracking the last processed block — two processors would fight over this.
**Prevention:**

- V1 and V2 **MUST use separate databases** for side-by-side validation
- The comparison tool reads from both databases, not one shared database
- Only after comparison passes, stop V1, point V2 to V1's database (with migration if needed), and start V2

### Pitfall 19: Subsquid Status Table Conflict

**What goes wrong:** Subsquid's `TypeormDatabase` uses a `squid_processor.status` table to track the last processed block and hot blocks. If V2 connects to V1's database, it sees V1's progress and either skips blocks or corrupts the tracking state.
**Prevention:**

- Separate databases (see above)
- Or: Use different schema names (e.g., `v1_public` vs `v2_public`) — but this requires reconfiguring all TypeORM entities
- Or: Use Subsquid's `stateSchema` option (if available) to use a different tracking table

### Pitfall 20: Migration Compatibility Between V1 and V2

**What goes wrong:** V2 schema changes require database migrations that are incompatible with V1.
**Why it happens:** The project constraint says "no schema changes that would break V1." But V2 might need new columns (e.g., enrichment tracking fields) that V1 doesn't know about.
**This codebase specifically:** TypeORM entities are generated from `schema.graphql` shared between V1 and V2. Any change to `schema.graphql` affects both.
**Prevention:**

- V2 should add only **nullable** columns that V1 ignores
- Run V1 test suite against the new schema to verify backward compatibility
- Version-gate any new columns: V2 uses them, V1 doesn't know they exist

### Pitfall 21: Docker Deployment Misconfiguration

**What goes wrong:** V2 Docker deployment misconfigures environment variables, connects to wrong database, or uses wrong RPC URL.
**Why it happens:** `docker-compose.yaml` has 15+ environment variables. Copy-paste from V1 config may miss V2-specific changes.
**Prevention:**

- V2 should validate all required environment variables at startup
- Add a `healthcheck` endpoint that reports: connected DB, current block, sync status
- Pre-flight check: verify DB connection, RPC connection, and Hasura health before starting processing

### Pitfall 22: Hasura Metadata Drift

**What goes wrong:** Hasura metadata (table tracking, relationships, permissions) drifts between V1 and V2 deployments. GraphQL API behaves differently.
**Why it happens:** Hasura metadata is auto-generated by `squid-hasura-configuration` but may need manual adjustment. V1's metadata may have manual customizations not captured in code.
**Prevention:**

- Export V1's Hasura metadata: `hasura metadata export`
- Compare with V2's auto-generated metadata
- Apply any V1 customizations to V2's metadata generation

---

## Prevention Strategies

### Strategy 1: Differential Comparison Test Suite

Build an automated comparison tool that:

- Connects to V1 and V2 databases (separate instances)
- Compares each table by natural keys (not UUIDs)
- Has an allowlist for known divergences (V1 bugs, null-FK differences)
- Reports per-table: exact match count, V1-only count, V2-only count, field-level diffs
- Runs after both V1 and V2 process the same block range
- **Critical tables to compare:** UniversalProfile, DigitalAsset, NFT, OwnedAsset, OwnedToken, TotalSupply, Follow (these track aggregate state that must be identical)
- **Tables to compare structurally:** LSP3Profile, LSP4Metadata (compare url + isDataFetched, not sub-entities)
- **Tables to skip:** All sub-entities with UUID PKs (compare via parent FK + value instead)

### Strategy 2: Replay-Based Integration Testing

- Capture a real block range from V1 (e.g., blocks 1,000,000 to 1,001,000)
- Replay through V2 pipeline with the same RPC state
- Compare database state after replay
- Focus on edge cases: blocks with no events, blocks with 100+ events, blocks with transfers to/from zero address, blocks with multiple events for the same address

### Strategy 3: Handler Dependency Graph

Document and enforce:

```
PERSIST RAW → [permissionsUpdate, removeEmptyEntities] → [decimals, totalSupply, ownedAssets] → [lsp3Profile, lsp4Metadata, lsp29Encrypted] → [orbsLevel, orbsClaimed, chillClaimed, ownership]
```

V2's pipeline enforces this naturally via steps 2→3→4→5→6, but within Step 3 (HANDLE), handlers need explicit ordering.

### Strategy 4: Canary Deployment

Before full cutover:

1. Run V2 on a separate database, processing from genesis
2. Compare V2 DB with V1 DB at same block height
3. Let V2 catch up to chain head
4. Run side-by-side for 24-48 hours
5. Compare again — focus on real-time blocks where metadata fetching matters
6. Only then: stop V1, migrate V2 to production database

### Strategy 5: Metadata Fetch Resilience

For V2:

- Use `Promise.allSettled()` with `p-limit(50)` concurrency control (replaces spin-wait)
- Multiple IPFS gateways with round-robin fallback
- Separate "transient error" from "permanent error" in retry logic
- Circuit breaker: stop fetching if failure rate exceeds 50%
- Hard timeout per fetch (30 seconds)
- Max response size (10MB)
- Log every fetch attempt with URL, status, duration

### Strategy 6: V1 Bug Inventory

Before starting comparison, inventory every known V1 bug:

| Bug                                           | Impact on Data                                                         | V2 Behavior                   | Comparison Strategy                              |
| --------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------ |
| Missing `break` in scanLogs (4 locations)     | Extra LSP5/LSP6/LSP8 entities when LSP4/LSP5/LSP6/LSP12 length changes | Fixed (no fall-through)       | Exclude known artifact rows                      |
| Null dereference in `decodeVerifiableUri`     | `decodeError` set on entities that should have `null`                  | Fixed (null guard)            | Compare `url` not `decodeError`                  |
| Follower handler `store.remove(Unfollow)`     | Works accidentally via ID                                              | Fixed (proper Follow removal) | Compare Follow table rows                        |
| digitalAsset.ts missing `result[index]` guard | Some DAs may be misclassified as invalid                               | Fixed (null guard)            | Compare DA table — may have more valid DAs in V2 |

### Strategy 7: Observability for Cutover

Add during V2 development:

- Block processing lag metric (current block vs chain head)
- Per-handler execution time
- Metadata fetch success/failure rate
- Entity count per batch
- Database write latency
- Enrichment queue depth
- Memory usage per batch

---

## Phase-Specific Warnings

| Phase Topic                       | Likely Pitfall                                          | Severity | Mitigation                                     |
| --------------------------------- | ------------------------------------------------------- | -------- | ---------------------------------------------- |
| Refactor existing handlers (#105) | Handler ordering changes break data                     | CRITICAL | Preserve exact V1 ordering in V2 pipeline      |
| Delete legacy code (#106)         | Removing code that V2 still needs                       | HIGH     | Don't delete until V2 is fully validated       |
| FormattedTokenId handler (#113)   | NFT formattedTokenId differs from V1                    | MEDIUM   | Compare NFT table formattedTokenId column      |
| Permissions handler (#50)         | Remove-then-insert creates window where data is missing | HIGH     | Wrap in transaction or use upsert              |
| Follower handler (#52)            | Off-by-one in follow/unfollow same batch                | MEDIUM   | Test: follow+unfollow in same batch            |
| LSP3 metadata fetch (#53)         | Spin-wait hang on rejected promise                      | CRITICAL | Use Promise.allSettled                         |
| LSP4 metadata fetch (#54)         | Same as LSP3 + BaseURI token ID formatting              | CRITICAL | Use Promise.allSettled + test formattedTokenId |
| LSP29 metadata fetch (#55)        | Same as LSP3                                            | CRITICAL | Use Promise.allSettled                         |
| Structured logging (#94)          | Logging overhead slows processing                       | LOW      | Benchmark before/after                         |
| Processor config (#57)            | Missing event topic subscriptions                       | HIGH     | Diff V1 vs V2 processor topic lists            |
| Entry point (#58)                 | Wrong handler ordering at startup                       | CRITICAL | Integration test full pipeline                 |
| Integration testing (#59)         | Tests don't cover edge cases                            | HIGH     | Include: empty batch, reorg, duplicate events  |
| V1/V2 comparison                  | UUID-based comparison fails                             | HIGH     | Use natural keys for comparison                |
| Side-by-side deployment           | Shared database corruption                              | CRITICAL | Use separate databases                         |

---

_Researched: 2026-02-06_
_Sources: Direct codebase analysis of V1 (packages/indexer/) and V2 (packages/indexer-v2/), .planning/codebase/CONCERNS.md, .planning/codebase/ARCHITECTURE.md, .planning/PROJECT.md_
_Confidence: HIGH — findings based on actual code patterns, not hypothetical scenarios_
