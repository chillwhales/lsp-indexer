# LSP Indexer v3 acceptance gates

Status: mandatory program evidence for [epic #390](https://github.com/chillwhales/lsp-indexer/issues/390)

Passing a narrow unit test is not evidence that v3 is production-ready. Each gate below names the
artifact or runtime evidence required before the owner reviews the final integration PR.

## G0 — Upstream and dependency readiness

- [ ] Pipes, Drizzle, PostgreSQL driver, Node.js, and ABI dependencies are pinned exactly.
- [ ] The selected Pipes release has an official live-data path for LUKSO.
- [ ] Portal/RPC source switching, finality watermark, fork propagation, and restart behavior pass
      our integration suite.
- [ ] Snapshot schema evolution no longer has the failure described in
      [pipes-sdk#150](https://github.com/subsquid/pipes-sdk/issues/150), or the owner approves a
      tested preservation procedure.
- [ ] Bounded backfills prove that their finalized tail committed; do not rely only on process exit
      while [pipes-sdk#143](https://github.com/subsquid/pipes-sdk/pull/143) remains unresolved.
- [ ] Dependency licenses and production support expectations are recorded.

Evidence: lockfile, dependency audit, source capability tests, upstream issue/release links, and an
approved dependency decision record.

## G1 — Architecture and schema

- [ ] One clean database migration creates every configured network schema, API view, constraint,
      index, cursor table, and required extension.
- [ ] Reapplying migrations is safe and produces no drift.
- [ ] A schema change is tested with non-empty rollback snapshots.
- [ ] Two networks can contain the same address, token ID, and natural-key suffix without collision.
- [ ] A network process cannot write another network's schema.
- [ ] Hasura tracks only intended API objects, relationships, and permissions.
- [ ] No tracked mutable table lacks a primary key or Drizzle rollback registration.

Evidence: migration tests, schema dump, Hasura metadata consistency output, privilege tests, and
snapshot inventory.

## G2 — Deterministic ingestion and reorg correctness

- [ ] Replaying an identical finalized range twice produces identical canonical facts and
      projections.
- [ ] Restarting after any committed batch resumes at the next correct cursor.
- [ ] Failure before commit leaves data and cursor unchanged.
- [ ] One-block, multi-block, and maximum-retained-depth forks restore facts, projections, jobs, and
      cursor to the common ancestor.
- [ ] Forking one network cannot change another network's data or snapshots.
- [ ] Block-pinned RPC responses are committed with their triggering block and roll back with it.
- [ ] Contract-level reverts, unsupported selectors, and invalid return values are isolated per call:
      the raw fact commits, no false typed projection is created, and the network cursor advances.
- [ ] RPC transport failures and block-identity mismatches abort without changing data or cursor, and
      retry the same canonical batch.
- [ ] Duplicate delivery cannot create duplicate facts or double-apply balances and tallies.

Evidence: deterministic checksums, fault-injection tests, synthetic fork fixtures, database queries,
and cursor/snapshot assertions.

## G3 — Domain parity

- [ ] Every event decoded by the 11 v2 event plugins has a documented v3 disposition.
- [ ] Every projection produced by the 29 v2 handlers has a documented v3 disposition.
- [ ] Profiles, digital assets, NFTs, ownership, followers, creators, issued assets, metadata,
      permissions, supply, and product extensions pass domain invariants.
- [ ] Invalid interface claims retain raw facts without creating false typed projections.
- [ ] V2 and v3 comparison at the same finalized height has zero unexplained shared-field
      differences.

Evidence: disposition matrix, domain fixtures, invariant tests, and comparison-tool reports stored
with the validation run.

## G4 — Metadata correctness

- [ ] Workers process finalized jobs with bounded concurrency and durable retries.
- [ ] Restarting workers neither loses jobs nor duplicates published sub-entities.
- [ ] A stale response cannot overwrite a newer content revision.
- [ ] Invalid, oversized, timed-out, and unavailable content reaches documented retry or terminal
      states.
- [ ] IPFS gateway failover and HTTP behavior are covered without holding indexer transactions open.
- [ ] Metadata retrieval accepts only documented schemes and rejects loopback, link-local, private,
      carrier-grade NAT, multicast, reserved, and other non-public IPv4 and IPv6 destinations after
      DNS resolution and again after every redirect.
- [ ] DNS rebinding, mixed public/private DNS answers, IP-literal encodings, and redirects cannot
      bypass destination validation or the production egress policy.
- [ ] VerifiableURI content is hashed as exact fetched bytes before parsing or publishing; mismatched
      digests and unsupported verification methods never update metadata projections.
- [ ] Backlog, age, attempts, failure reasons, latency, and throughput are observable per network.

Evidence: worker integration tests, race fixtures, retry timing tests, SSRF fixtures, content-hash
vectors, and dashboard screenshots or exported dashboard definitions.

## G5 — Query and subscription API

- [ ] Every domain in the compatibility matrix is queryable through the v3 API views.
- [ ] Detail, list, aggregate, latest, batch, include, filter, sort, and pagination behavior matches
      its documented v3 contract.
- [ ] Queries and subscriptions cannot leak results across network scope.
- [ ] Two same-address entities on different networks remain independently queryable and cacheable.
- [ ] Hasura metadata is consistent after a clean deployment.
- [ ] Subscriptions reconnect and converge after an indexer or Hasura restart.

Evidence: GraphQL integration suite, permission tests, network-collision fixtures, metadata
consistency output, and reconnect tests.

## G6 — Published packages

- [ ] `@lsp-indexer/types`, `node`, `react`, and `next` all report version `3.0.0` in release
      artifacts.
- [ ] Every retained high-level v2 operation has a tested v3 operation or a documented removal.
- [ ] `totalSupply`, owned-asset `balance`, universal-receiver `value`, and future big integer fields
      cross the GraphQL/JSON boundary as decimal strings but validate and return as JavaScript
      `bigint` from Node, React, and Next.
- [ ] Network identity appears in request validation, cache keys, result validation, and
      subscriptions.
- [ ] Package builds, type checks, unit tests, smoke tests, `publint`, and `attw` pass from packed
      tarballs.
- [ ] Node and browser exports contain no unintended server-only or framework-specific code.
- [ ] The migration guide compiles and every example type-checks.

Evidence: CI logs, packed tarballs, export inspection, public API report, and documentation build.

## G7 — Multi-chain operations

- [ ] At least two networks backfill and follow their heads concurrently using separate production
      processes.
- [ ] Killing, lagging, or exhausting RPC quota for one network does not stop another.
- [ ] Stable pipe IDs survive pod replacement and scaling events.
- [ ] Duplicate processes for one network are rejected or serialized without corrupting state.
- [ ] Adding a test network uses the documented registry, migration, API-view, and deployment path.
- [ ] Per-network progress, source freshness, RPC health, errors, and resource usage are visible.

Evidence: multi-network soak test, failure-isolation exercise, deployment manifests, metrics, and
operator runbook.

## G8 — Performance and recovery

- [ ] V3 sustains at least twice the observed production block/event rate for every enabled network.
- [ ] At equal hardware and source conditions, v3 backfill has no unexplained regression greater
      than 10% against v2.
- [ ] At steady state, internal processing lag remains within two minutes beyond source/finality lag
      at p95 over 24 hours.
- [ ] Database transaction retries, lock time, query latency, metadata backlog, memory, and CPU stay
      inside documented budgets.
- [ ] PostgreSQL backup restore, indexer restart, Hasura restart, and metadata-worker recovery are
      exercised from runbooks.

Evidence: benchmark report, 24-hour soak metrics, query plans, resource dashboards, and recovery
exercise log.

## G9 — Documentation, shadow production, and cutover

- [ ] Indexer, Node, React, Next, quickstart, environment, deployment, and domain documentation match
      the shipped v3 behavior.
- [ ] V2-to-v3 package and operator migration guides are complete.
- [ ] V3 runs against a separate shadow database until parity, freshness, and recovery gates pass.
- [ ] Cutover and rollback procedures name owners, commands, checkpoints, and stop conditions.
- [ ] V2 remains available for the agreed rollback window.
- [ ] The rollback window closes with explicit owner sign-off before any v2 source, artifact,
      database, or endpoint required for rollback is deleted.
- [ ] Legacy production dependencies and code are deleted only after that sign-off, followed by a
      clean final replay, parity comparison, recovery drill, and package build.
- [ ] Epic #390 and goals #380–#389 are complete with evidence linked.
- [ ] The final integration PR remains draft until the repository owner personally marks it ready.
- [ ] Only the repository owner merges `lsp-indexer-v3` to `main`.

Evidence: built documentation, linked issue checklists, shadow-production report, signed-off cutover
record, and final owner review.

## Required final audit

Before requesting owner review, audit every explicit item above against current files, CI artifacts,
database state, deployed runtime behavior, and GitHub issue evidence. Missing or indirect evidence is
a failed gate. The integration PR cannot be declared complete merely because all feature branches
were merged.
