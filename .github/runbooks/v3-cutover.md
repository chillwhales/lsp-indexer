# V3 cutover, rollback, and v2 retirement runbook

Only repository owner `@b00ste` authorizes the public cutover, closes the rollback window, marks PR
#391 ready, or merges it. An agent or release operator must never infer those decisions from green CI.

## Required cutover record

Record the owner, release operator, database operator, incident commander, UTC window, exact v2 and
v3 commits/images, v2 and v3 endpoint targets, DNS/ingress change, consumer package versions,
rollback deadline, and evidence links. The incident commander can stop or roll back at any point.

## Preconditions

- Every G0–G8 item has direct evidence linked from `V3_VALIDATION_REPORT.md`.
- Same-height mapped shared-field parity has zero unexplained differences, and the dedicated
  v3-only invariant evidence passes.
- The two-network performance run and 24-hour soak pass their approved budgets.
- Source failure, process restart, metadata restart, Hasura restart, and CNPG restore exercises pass.
- V3 has run in a separate shadow database; v2 is healthy and unchanged.
- V2 images, manifests, Secrets, endpoint, and database backups remain immediately available for the
  entire owner-approved rollback window.
- Consumer migration documentation and v3 package artifacts were tested from packed tarballs.
- The owner has explicitly approved this cutover record. Draft PR #391 remains unmerged.

Any missing item is a stop condition.

## Cutover sequence

1. Freeze code and configuration changes. Capture v2/v3 heads, active alerts, traffic/error/latency
   baselines, DB health, and a fresh v2 backup.
2. Confirm v3 is caught up, committed cursor drift is zero, source health is good, metadata backlog
   is inside budget, and Hasura metadata is consistent.
3. Change the reviewed ingress/DNS/upstream target from v2 to v3. Do not delete or mutate v2.
4. Run public smoke queries for every domain, aggregate, include, pagination, bigint conversion, and
   both network scopes. Reconnect a live subscription. Run Node, React, and Next package smoke apps.
5. Observe request errors, p95/p99 latency, subscriptions, committed lag, source health, database
   connections/locks, CPU/memory, and metadata age continuously through the decision window.

Immediately roll back on cross-network leakage, wrong results, unresolved parity drift, mutation
exposure, cursor drift, repeated process/source failure, lag beyond the approved budget, database
pressure beyond budget, subscription non-convergence, or a critical alert without a proven benign
cause.

## Rollback

1. Point the public ingress/DNS/upstream target back to the preserved v2 service.
2. Roll consumers back to the last reviewed v2 package/application release if their v3 contract is
   incompatible with the restored endpoint.
3. Verify v2 health, queries, subscriptions, traffic, and error/latency baselines.
4. Keep v3 and its database isolated for diagnosis. Stop its public traffic, not its evidence.
5. Record UTC trigger, metrics, logs, affected requests, exact routing change, recovery time, and
   owner/incident-commander decision.

Because v2 and v3 use separate databases and state, rollback never runs a reverse v3 migration
against v2.

## Rollback window and v2 retirement

Keep v2 deployable and its state backed up until the recorded deadline. At the deadline, the owner
reviews cutover traffic, parity recheck, alerts, recovery status, package adoption, and the final v3
replay. Only an explicit owner sign-off may begin retirement.

Retirement is a separate reviewed change that names every exact v2 Deployment, image, Secret,
database, backup, endpoint, code path, and package artifact. Before any deletion it must take a final
backup, prove restore, rerun v3 parity/recovery/package builds, and state recoverability. This runbook
does not authorize deleting those targets.

After the owner closes the rollback window and the retirement change is complete, the owner may
personally mark PR #391 ready and merge `lsp-indexer-v3` to `main`. No automation or agent merges it.
