# LSP Indexer v3 roadmap

LSP Indexer v3 is a from-scratch, multi-chain indexer built on the SQD Pipes SDK. The program is
tracked by [epic #390](https://github.com/chillwhales/lsp-indexer/issues/390) and integrated through
the permanent `lsp-indexer-v3` branch.

## Product boundary

V3 will replace the legacy Squid processor, TypeORM persistence, generated entity classes, batch
context, enrichment queue, and staged persistence pipeline. It will preserve familiar public
domains while releasing a new major-version data contract through:

- `@lsp-indexer/types`
- `@lsp-indexer/node`
- `@lsp-indexer/react`
- `@lsp-indexer/next`

The v3 packages may intentionally remove or replace low-level v2 exports. Compatibility is defined
at the documented domain behavior level rather than by retaining the v2 database implementation.

## Architecture invariants

1. **Multi-chain from the first migration.** Every event, projection, cursor, cache key, API filter,
   and externally addressable identifier has an unambiguous network scope.
2. **Pipes-native runtime.** Production code does not retain the legacy Squid processor or use a
   compatibility adapter around the v2 pipeline.
3. **Drizzle-owned PostgreSQL schema.** Tables, relations, indexes, migrations, atomic writes, and
   rollback registration are explicit and version controlled.
4. **Deterministic replay.** Event identities derive from chain and block provenance rather than
   random UUIDs. Replaying the same finalized history produces the same records.
5. **Facts and projections are separate.** Append-only decoded events retain chain provenance;
   mutable read models represent current profile, asset, NFT, ownership, follower, and metadata
   state.
6. **Reorg behavior is tested.** Cursor movement and every mutable projection roll back together.
   External metadata work cannot publish a stale result over newer canonical state.
7. **Consumer contracts lead the design.** V3 types define filters, includes, sorting, pagination,
   network selection, errors, and subscription behavior before client implementations are ported.
8. **Observability is part of correctness.** Each network exposes progress, lag, throughput, RPC
   health, metadata backlog, failures, and rollback activity.
9. **V2 remains deployable during validation.** V3 uses separate state and runs in shadow until all
   parity and production gates pass.

## Delivery goals

| Goal                                                          | Outcome                                 | Depends on       |
| ------------------------------------------------------------- | --------------------------------------- | ---------------- |
| [#380](https://github.com/chillwhales/lsp-indexer/issues/380) | Architecture and compatibility contract | —                |
| [#381](https://github.com/chillwhales/lsp-indexer/issues/381) | Multi-chain Pipes runtime               | #380             |
| [#382](https://github.com/chillwhales/lsp-indexer/issues/382) | Drizzle and reorg-safe persistence      | #380, #381       |
| [#383](https://github.com/chillwhales/lsp-indexer/issues/383) | Raw LSP event ingestion                 | #381, #382       |
| [#384](https://github.com/chillwhales/lsp-indexer/issues/384) | Domain projections and verification     | #382, #383       |
| [#385](https://github.com/chillwhales/lsp-indexer/issues/385) | Resilient metadata subsystem            | #382, #384       |
| [#386](https://github.com/chillwhales/lsp-indexer/issues/386) | Query and subscription API              | #382, #384, #385 |
| [#387](https://github.com/chillwhales/lsp-indexer/issues/387) | Types and Node SDK v3                   | #380, #386       |
| [#388](https://github.com/chillwhales/lsp-indexer/issues/388) | React and Next v3                       | #387             |
| [#389](https://github.com/chillwhales/lsp-indexer/issues/389) | Production validation and cutover       | all goals        |

Work may proceed in parallel after the architecture and schema contracts are stable, but no goal is
complete until its code, tests, public documentation, and operational documentation are included in
the same feature PRs.

## Initial v3 data improvements

The detailed schema belongs to #380 and #382. At minimum, the v3 model will add or standardize:

- Network identity using chain ID plus a stable configured network key
- Deterministic event and projection IDs scoped by chain
- Block hash, block height, timestamp, transaction hash, transaction index, and log index provenance
- Explicit canonical/finality assumptions at the ingestion boundary
- Chain-aware relationships, unique constraints, filters, query keys, and subscriptions
- Durable metadata job status, attempt count, next retry time, source revision, and error information
- Schema version and indexed-head visibility for consumers and operators

## Upstream readiness gate

The current LUKSO Portal dataset is not real-time. Production cutover therefore requires either
real-time Portal coverage or an official Pipes RPC source/fallback that passes the v3 recovery and
reorg suite. A temporary custom source is not the default plan because owning it would work against
the maintenance goals of the rewrite.

## Final merge gate

The draft integration PR from `lsp-indexer-v3` to `main` remains open for the full program. Agents
must never mark it ready or merge it. Only
[@b00ste](https://github.com/b00ste) may personally perform the final merge after #389 confirms that
v3 is fully working in shadow production and every goal in #390 is complete.
