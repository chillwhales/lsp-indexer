# Codebase Concerns

**Analysis Date:** 2026-02-06

## Tech Debt

**Missing `break` Statements in `scanLogs` Switch/Case (CRITICAL BUG):**

- Issue: Multiple `case` blocks in the `DataChanged` handler inside `scanLogs` are missing `break` statements, causing unintentional fall-through behavior. Specifically:
  - `LSP4Creators[].length` case (line 203-207) falls through to `LSP5ReceivedAssets[].length`
  - `LSP5ReceivedAssets[].length` case (line 209-216) falls through to `AddressPermissions[].length`
  - `AddressPermissions[].length` case (line 218-222) falls through to `LSP8ReferenceContract`
  - `LSP12IssuedAssets[].length` case (line 247-254) falls through to `default`
- Files: `packages/indexer/src/app/scanner.ts` (lines 203-254)
- Impact: Every `LSP4Creators[]` length change event also triggers `LSP5ReceivedAssetsLength`, `LSP6ControllersLength`, and `LSP8ReferenceContract` extraction. This creates incorrect/duplicate entities in the database and wastes processing resources. The same cascading issue affects LSP5 and LSP6 length events. LSP12 length events fall through to the default branch, which could match prefix-based data keys incorrectly.
- Fix approach: Add `break;` after each case block at lines 207, 216, 222, and 254.

**Null Dereference in `decodeVerifiableUri`:**

- Issue: At line 160, `url` may be `null` (assigned on line 153-158), but `.match()` is called on it without a null check. If `decodedMetadataUrl` is null, `url` is null and `url.match(...)` throws a TypeError.
- Files: `packages/indexer/src/utils/index.ts` (line 160)
- Impact: Runtime crash when decoding a verifiable URI that resolves to null. The surrounding try/catch will convert it to a `decodeError`, so it doesn't crash the indexer, but it masks the real issue.
- Fix approach: Add null guard: `if (url === null) return { value: null, decodeError: null };` before line 160.

**Spin-Wait Polling Pattern for Async Batch Completion:**

- Issue: Multiple handlers use a busy-wait loop (`while (...) { await Utils.timeout(1000); }`) to wait for fire-and-forget `.then()` promises to complete. This is fragile, wastes CPU, and introduces a minimum 1-second delay per batch even when all fetches complete instantly.
- Files:
  - `packages/indexer/src/app/handlers/lsp3ProfileHandler.ts` (lines 154-161)
  - `packages/indexer/src/app/handlers/lsp4MetadataHandler.ts` (lines 263-270)
  - `packages/indexer/src/app/handlers/lsp29EncryptedAssetHandler.ts` (lines 172-177)
- Impact: Unnecessary latency during metadata fetching. If any promise rejects without being caught, the counter never increments and the loop hangs indefinitely.
- Fix approach: Replace the fire-and-forget `.then()` + spin-wait pattern with `Promise.allSettled()` or a proper concurrency limiter (e.g., `p-limit`).

**Massive Parameter Lists and God Functions:**

- Issue: `scanLogs` (724 lines), `populateEntities` (462 lines), and `packages/indexer/src/app/index.ts` (542 lines) are extremely large functions with dozens of parameters passed through destructuring. Adding a new LSP standard requires modifying 4+ files in lockstep.
- Files:
  - `packages/indexer/src/app/scanner.ts`
  - `packages/indexer/src/utils/entityPopulation.ts`
  - `packages/indexer/src/app/index.ts`
- Impact: Hard to maintain, easy to introduce bugs (see the missing `break` statements). High cognitive load for new contributors. Every new data key type requires changes across scanner, population, index, and handler files.
- Fix approach: The `packages/indexer-v2/` directory contains a compiled plugin-based architecture (handler registry + pipeline) that appears designed to replace this. Complete the v2 migration.

**Abandoned `indexer-v2` Package:**

- Issue: `packages/indexer-v2/` exists with only compiled `.js`/`.d.ts` files in `lib/` — no source `.ts` files, no `package.json`, no `tsconfig.json`. It contains a more modular architecture with a plugin system, handler registry, batch context, metadata worker pool, and tests. The source code is missing.
- Files: `packages/indexer-v2/` (entire directory — `lib/` only, no `src/`)
- Impact: The v2 refactoring effort appears stalled or its source was lost. The compiled artifacts suggest significant architectural improvements (plugin system, worker pool, tests) that the current indexer lacks. Cannot be built or modified without source.
- Fix approach: Either recover the source TypeScript files and complete the migration, or remove the `indexer-v2` directory to reduce confusion.

**Duplicated Verification Logic:**

- Issue: `universalProfile.ts` and `digitalAsset.ts` contain nearly identical verification logic (batched multicall, error fallback with nested try/catch, result processing). The only differences are the entity type, interface IDs, and the number of versions checked.
- Files:
  - `packages/indexer/src/utils/universalProfile.ts`
  - `packages/indexer/src/utils/digitalAsset.ts`
- Impact: Any bug fix or improvement must be applied twice. The `digitalAsset.ts` version has a subtle difference: line 153 does not check `result[index]` for undefined (unlike `universalProfile.ts` line 124-125), which can throw if the result array is shorter than expected due to error fallback.
- Fix approach: Extract a generic `verifyEntitiesByInterface` helper that accepts entity constructor, interface IDs, and type parameters.

**`packageManager` Field Mismatch:**

- Issue: Root `package.json` specifies `pnpm@10.15.0` while sub-packages specify `pnpm@10.10.0`.
- Files:
  - `package.json` (line 7): `pnpm@10.15.0`
  - `packages/indexer/package.json` (line 8): `pnpm@10.10.0`
  - `packages/typeorm/package.json` (line 8): `pnpm@10.10.0`
  - `packages/abi/package.json` (line 8): `pnpm@10.10.0`
- Impact: Corepack may enforce different pnpm versions depending on which directory commands are run from. Can cause inconsistent behavior in CI/CD.
- Fix approach: Align all `packageManager` fields to the same version.

## Known Bugs

**Switch Fall-Through in DataChanged Handler:**

- Symptoms: Extra entities created for LSP5, LSP6, LSP8 when only LSP4 length data changes. Database may contain duplicate/incorrect length entities.
- Files: `packages/indexer/src/app/scanner.ts` (lines 203-254)
- Trigger: Any `DataChanged` event with `LSP4Creators[].length`, `LSP5ReceivedAssets[].length`, `AddressPermissions[].length`, or `LSP12IssuedAssets[].length` data key.
- Workaround: None — the entities are silently created. Database cleanup may be needed.

**Potential Null Access in `digitalAsset.ts` Verification:**

- Symptoms: `TypeError: Cannot read properties of undefined (reading 'success')` when multicall batch fails partially.
- Files: `packages/indexer/src/utils/digitalAsset.ts` (line 153)
- Trigger: When the error fallback path produces fewer results than expected addresses, `result[index]` is undefined.
- Workaround: The outer `catch` with empty handler at line 147 silently swallows the error, but skips the remaining addresses in that batch.

**Follower System Handler Uses `store.remove` with Unfollow Entities:**

- Symptoms: Attempting to remove `Unfollow` entity instances from the Follow table.
- Files: `packages/indexer/src/app/handlers/followerSystemHandler.ts` (line 63)
- Trigger: Any unfollow event. The handler creates `Unfollow` entities with the `Follow` ID format and tries to remove them. This likely relies on TypeORM treating the remove by `id` regardless of entity type, but it's semantically incorrect and fragile.
- Workaround: Works accidentally because TypeORM `remove` uses the entity's `id` to delete from the table.

## Security Considerations

**Environment File Committed to Git:**

- Risk: `.env` file exists in the repository root and is listed in `.gitignore`, but a `.env` file is present on disk. If `.gitignore` was added after the file was tracked, secrets could be in git history.
- Files: `.env`, `.gitignore`
- Current mitigation: `.gitignore` lists `.env`
- Recommendations: Verify `.env` is not tracked in git history. Run `git log --all --full-history -- .env` to check.

**Hardcoded Default Credentials in `.env.example`:**

- Risk: Default `POSTGRES_PASSWORD=postgres` and `HASURA_GRAPHQL_ADMIN_SECRET=some_secret_key_to_access_hasura_console` in `.env.example` may be used directly in production if not overridden.
- Files: `.env.example` (lines 2-3, 26)
- Current mitigation: They are example values, but no enforcement.
- Recommendations: Add deployment documentation or startup validation that rejects default credentials.

**No Input Validation on IPFS/External URLs:**

- Risk: The indexer fetches arbitrary URLs from on-chain data via `getDataFromURL` (using `axios.get`). SSRF (Server-Side Request Forgery) is possible if an attacker sets malicious URLs in contract data keys, potentially targeting internal services.
- Files: `packages/indexer/src/utils/index.ts` (lines 204-244)
- Current mitigation: None. Any URL from on-chain data is fetched without validation.
- Recommendations: Add URL allowlist/blocklist, reject private IP ranges, add request timeouts, limit response sizes.

**Silent Error Swallowing in Entity Verification:**

- Risk: Empty `catch {}` blocks in `universalProfile.ts` (line 118) and `digitalAsset.ts` (line 147) silently discard errors during multicall verification. This can mask infrastructure issues or data corruption.
- Files:
  - `packages/indexer/src/utils/universalProfile.ts` (line 118)
  - `packages/indexer/src/utils/digitalAsset.ts` (line 147)
- Current mitigation: None.
- Recommendations: At minimum, log the error. Ideally, track failed addresses and retry them.

## Performance Bottlenecks

**Sequential Handler Execution:**

- Problem: In `packages/indexer/src/app/index.ts`, all post-processing handlers run sequentially with `await`. Many of these handlers are independent and could run in parallel.
- Files: `packages/indexer/src/app/index.ts` (lines 481-541)
- Cause: Each handler awaits before the next starts. `lsp3ProfileHandler`, `lsp4MetadataHandler`, `lsp29EncryptedAssetHandler` each independently fetch IPFS metadata. `orbsLevelHandler`, `orbsClaimedHandler`, `chillClaimedHandler` operate on independent data.
- Improvement path: Group independent handlers into `Promise.all()` batches. At minimum: `[lsp3ProfileHandler, lsp4MetadataHandler, lsp29EncryptedAssetHandler]` can run in parallel; `[orbsClaimedHandler, chillClaimedHandler]` can run in parallel.

**Metadata Fetch Spin-Wait:**

- Problem: Each metadata batch waits at least 1 second per check cycle even when all HTTP requests are already complete.
- Files:
  - `packages/indexer/src/app/handlers/lsp3ProfileHandler.ts` (lines 154-161)
  - `packages/indexer/src/app/handlers/lsp4MetadataHandler.ts` (lines 263-270)
  - `packages/indexer/src/app/handlers/lsp29EncryptedAssetHandler.ts` (lines 172-177)
- Cause: Fire-and-forget promise `.then()` pattern with polling counter. No backpressure or concurrency control.
- Improvement path: Use `Promise.allSettled()` with a concurrency limiter like `p-limit`. This eliminates the spin-wait entirely and provides proper error handling.

**Full Table Scans for Empty Entity Removal:**

- Problem: `removeEmptyEntities` runs on every batch and performs 6 database queries with `IsNull()` conditions that may not be indexed.
- Files: `packages/indexer/src/app/handlers/removeEmptyEntities.ts`
- Cause: Querying for null values across potentially large tables every batch cycle.
- Improvement path: Add database indexes on the null-checked columns, or only run cleanup periodically instead of every batch.

**Block Sorting in Hot Path:**

- Problem: `context.blocks.sort((a, b) => b.header.timestamp - a.header.timestamp)[0]` is called inside a loop for every transfer entity.
- Files: `packages/indexer/src/app/handlers/ownedAssetsHandler.ts` (line 59)
- Cause: Re-sorting the blocks array on every iteration when only the latest block is needed.
- Improvement path: Sort once before the loop, or use `Math.max` to find the latest block timestamp.

## Fragile Areas

**Scanner `switch/case` Dispatch:**

- Files: `packages/indexer/src/app/scanner.ts` (lines 159-641)
- Why fragile: The giant switch statement handles all event types and data key routing. Adding a new data key requires inserting into the correct position in the switch, ensuring `break` is present, and updating 4+ downstream files. Missing a `break` silently creates incorrect data.
- Safe modification: Always add `break` statements. Consider migrating to the v2 plugin/handler registry pattern.
- Test coverage: Zero — no test files exist for the indexer package.

**Entity Population Pipeline:**

- Files: `packages/indexer/src/utils/entityPopulation.ts`, `packages/indexer/src/app/index.ts`
- Why fragile: Every new entity type requires adding parameters to `populateEntities` (already 40+ parameters), updating the destructuring in `index.ts`, and adding the corresponding `context.store.upsert/insert` call. Parameter order matters for readability and any mismatch is hard to spot.
- Safe modification: Use a typed context bag or entity registry instead of positional/named parameters.
- Test coverage: Zero.

**Metadata Fetching Handlers:**

- Files:
  - `packages/indexer/src/app/handlers/lsp3ProfileHandler.ts`
  - `packages/indexer/src/app/handlers/lsp4MetadataHandler.ts`
  - `packages/indexer/src/app/handlers/lsp29EncryptedAssetHandler.ts`
- Why fragile: All three handlers use the same fire-and-forget + spin-wait pattern. If any HTTP request hangs or the promise rejects without incrementing the counter, the handler blocks forever with `await Utils.timeout(1000)` in an infinite loop. No timeout or circuit breaker.
- Safe modification: Replace with `Promise.allSettled()`. Add a maximum wait time.
- Test coverage: Zero.

## Scaling Limits

**In-Memory Entity Collection:**

- Current capacity: All entities for a batch are held in memory as Maps.
- Limit: A very large batch with many events (e.g., during initial sync of historical data) could exhaust memory since all entities are accumulated before any are persisted.
- Scaling path: Implement streaming persistence or intermediate checkpoints during large batches.

**IPFS/Metadata Fetch Throughput:**

- Current capacity: `FETCH_BATCH_SIZE` (default 1000) requests fired simultaneously with no concurrency control, `FETCH_LIMIT` (default 10000) total per run.
- Limit: 1000+ simultaneous HTTP requests can overwhelm the IPFS gateway or cause connection pool exhaustion.
- Scaling path: Implement proper concurrency limiting (e.g., max 50 concurrent requests), use the metadata worker pool from indexer-v2.

**Single-Process Architecture:**

- Current capacity: All indexing, verification, population, and metadata fetching runs in a single Node.js process.
- Limit: Cannot scale horizontally. Metadata fetching blocks the event processing pipeline.
- Scaling path: Separate metadata fetching into a worker/queue system (the v2 package has `metadataWorkerPool` for this). Use the v2 architecture.

## Dependencies at Risk

**Subsquid SDK Version Lock:**

- Risk: `@subsquid/evm-processor` at `^1.27.2` uses the v1 API. Subsquid has moved to v2+ with breaking changes. The code accesses internal APIs like `context._chain.client.call` which are undocumented.
- Impact: Cannot upgrade to newer Subsquid versions without significant refactoring. Bug fixes or performance improvements in newer versions are inaccessible.
- Migration plan: Follow Subsquid v2 migration guide. The v2 API changes gateway configuration and processor setup.

## Missing Critical Features

**Zero Test Coverage:**

- Problem: The `packages/indexer/` package has no test files whatsoever. The only tests exist as compiled JS in `packages/indexer-v2/lib/core/__tests__/` (source missing).
- Blocks: Cannot safely refactor the scanner, handlers, or utility functions. Cannot verify the switch fall-through bug fix without manual testing. Cannot enforce non-regression.

**No Structured Logging:**

- Problem: All logging uses `context.log.info(JSON.stringify({...}))` — manual JSON serialization with no log levels, no correlation IDs, no structured fields.
- Blocks: Difficult to debug production issues, filter logs, or set up alerting.

**No Health Checks or Monitoring:**

- Problem: No health endpoint, no metrics export, no alerting on stalled processing.
- Blocks: Cannot detect if the indexer is stuck in a spin-wait loop, if the database is unreachable, or if the RPC endpoint is rate-limited beyond capacity.

## Test Coverage Gaps

**Entire Indexer Package:**

- What's not tested: All event scanning, entity extraction, entity verification, entity population, metadata fetching, database persistence, handler logic.
- Files: All files under `packages/indexer/src/`
- Risk: The switch fall-through bug demonstrates that without tests, critical logic errors go undetected. Any refactoring is high-risk.
- Priority: High — especially for `packages/indexer/src/app/scanner.ts` (switch dispatch), `packages/indexer/src/utils/index.ts` (utility functions), and the metadata fetching handlers.

**Entity Verification Multicall Fallback:**

- What's not tested: The nested try/catch fallback logic in `universalProfile.ts` and `digitalAsset.ts` that handles partial multicall failures.
- Files:
  - `packages/indexer/src/utils/universalProfile.ts` (lines 87-122)
  - `packages/indexer/src/utils/digitalAsset.ts` (lines 116-151)
- Risk: The fallback path has a subtle bug in `digitalAsset.ts` (uses `batchIndex` instead of `index` variable at line 96, which is the outer loop variable and may reference stale state). Silent error swallowing masks failures.
- Priority: High — verification determines which entities are tracked. Incorrect verification means missing data.

**Marketplace Handler:**

- What's not tested: Listing state machine transitions (created → paused → unpaused → closed), price updates, event filtering for listings from old ABIs.
- Files: `packages/indexer/src/app/handlers/marketplaceHandler.ts`
- Risk: Incorrect listing status after complex event sequences. The `instanceof` checks at lines 127-179 depend on TypeORM entity class identity, which could break with serialization.
- Priority: Medium.

---

_Concerns audit: 2026-02-06_
