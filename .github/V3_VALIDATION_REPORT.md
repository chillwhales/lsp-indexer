# V3 validation report

Status: repository-side implementation evidence complete for goal #389. This report deliberately
separates reproducible repository evidence from production evidence that has not been collected.

Last updated: 2026-08-25

## Candidate

- Integration base: `lsp-indexer-v3`
- Feature branch: `feat/indexer-v3-acceptance`
- Indexer package: `@chillwhales/indexer-v3@3.0.0-alpha.0`
- Pipes: `@subsquid/pipes@1.0.0-alpha.22`
- Chart: `charts/lsp-indexer@0.2.0`
- Final integration PR: #391 (permanent draft; repository owner only)

The feature PR records the exact candidate commit, CI URL, and Codex verdict. Record the promoted
image digest, cluster, namespace, operators, and artifact location before production validation.

## Reproducible evidence

| Area                             | Evidence                                                                                 | State |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ----- |
| Exact dependency boundary        | Manifest, lockfile, and [`V3_DEPENDENCY_DECISION.md`](./V3_DEPENDENCY_DECISION.md)       | Ready |
| Official live LUKSO path         | Alpha.22 RPC/fallback source and readiness/source tests                                  | Ready |
| LUKSO RPC source                 | Live probe 8,239,408–8,239,412: 5/5 blocks complete                                      | Pass  |
| Portal → RPC handoff             | Live probe 8,232,816–8,232,818: stale historical Portal switched to RPC; 3 blocks/2 logs | Pass  |
| Committed-state observability    | Runtime metrics unit tests and pull-based PostgreSQL head/cursor gauges                  | Ready |
| Mapped same-height shared parity | `acceptance:parity` command and tests; requires frozen shadow endpoints                  | Ready |
| Multi-network soak/performance   | `acceptance:soak` command and tests; requires real metrics endpoints and duration        | Ready |
| Deployment                       | V3-only image, per-network Helm processes, least-privilege hooks, egress policy          | Ready |
| Operations                       | ServiceMonitor, alerts, dashboard, backup schedule, deployment/recovery/cutover runbooks | Ready |

The LUKSO handoff probe used a 1.5-second stall threshold only to force an observable transition
across the frozen Portal boundary. Production defaults remain 30 seconds and are configurable.

## CI and local checks

Local and specialist-workspace checks below ran on 2026-08-25 between 05:54 and 06:13 UTC. CI and
review links are attached to the feature PR because those systems operate on the published commit.

| Check                                                 | Result                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Frozen dependency install                             | Pass — `pnpm install --frozen-lockfile`                                   |
| Lint                                                  | Pass — 0 errors; repository baseline warnings remain                      |
| Indexer v3 typecheck                                  | Pass — `pnpm --filter @chillwhales/indexer-v3 typecheck`                  |
| Indexer v3 unit/coverage suite                        | Pass — 39 files, 280 tests, 82.96% branch coverage                        |
| PostgreSQL 17 migration/persistence/fault suite       | CI required — no local PostgreSQL server                                  |
| Hasura consistency/query/subscription suite           | Static metadata pass; live endpoint suite required in CI                  |
| Full monorepo build/typecheck/test/package validation | Pass — build, typecheck, 55 files/533 tests, publint, and package ATTW    |
| Docs generation/build                                 | Pass — generated sidecars clean; 22 routes built                          |
| Compose and operations assets                         | Pass — dev/prod render, shell syntax, dashboard JSON, and alert YAML      |
| Helm lint/render                                      | Pass — Helm 3.16.4 strict lint; 20 default and 25 full resources rendered |
| Full Helm kubeconform                                 | Pass — Kubernetes 1.30 schemas; 25 valid, 0 invalid/error/skipped         |
| V3-only container build                               | CI required — no local container daemon                                   |
| Production dependency license inventory               | Pass — 208 records across six declared SPDX families                      |
| Codex review on final head                            | Required after feature PR publication                                     |

## Production evidence still required

These items cannot be marked complete from source code or mocked tests:

- Mapped shared-field v2/v3 comparison plus v3 invariants at one exact finalized height
- Equal-hardware v2/v3 replay benchmark and v3 capacity at twice observed production load
- Two-network 24-hour p95 lag/resource/metadata soak
- One-network source exhaustion and process-kill isolation exercise
- Metadata-worker and Hasura restart/reconnect exercises
- Restore of a real CNPG backup into an isolated cluster and resumed indexing
- Dashboard/alert exercise and production query plans
- License/compliance and prerelease support acceptance by the owner
- Owner-approved cutover record, public observation window, and rollback-window deadline
- Owner sign-off before v2 retirement or before PR #391 is marked ready/merged

Until these artifacts are linked, #389 and the final acceptance gate remain open even if the feature
PR containing the implementation is merged into `lsp-indexer-v3`.
