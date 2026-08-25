# V3 deployment runbook

Use this runbook only for the isolated v3 release. It never upgrades, writes, scales, or deletes the
v2 release.

## Roles and stop authority

| Role                         | Responsibility                                                      |
| ---------------------------- | ------------------------------------------------------------------- |
| Repository owner (`@b00ste`) | Approves public cutover, rollback-window closure, and final merge   |
| Release operator             | Selects image SHA, renders/diffs Helm, and records rollout evidence |
| Database operator            | Provisions logins, verifies migration/backup/restore evidence       |
| Incident commander           | Can stop the rollout or invoke rollback at any checkpoint           |

Record the named people, UTC window, Git commit, image digest, chart version, cluster, namespace,
release name, and evidence directory before proceeding. Stop if any value is unknown.

## Preconditions

1. The feature commit is on `lsp-indexer-v3`; the permanent integration PR remains draft.
2. CI, image build, Helm lint/schema validation, package validation, and the Codex review are green
   for the exact commit.
3. The v3 namespace, database, Secrets, DNS name, and storage are separate from v2.
4. Existing login roles match every `runtimeLogin` and `indexer.migration.apiLogin`. No runtime URL
   uses the migration administrator.
5. A CNPG backup exists, and the latest restore exercise is linked in the change record.
6. The overlay pins images by immutable digest or reviewed `sha-*` tag, enables monitoring, and
   enables object-store backups.
7. Every chart-managed indexer is unbounded. Run a same-height bounded replay as a one-shot CLI or
   Compose process; do not add `INDEXER_TO_BLOCK` to a Kubernetes Deployment.

Any failed precondition stops the rollout; do not waive it in the shell session.

## Render and review

Run from the reviewed repository commit in the infrastructure workspace:

```bash
helm dependency build charts/lsp-indexer
helm lint charts/lsp-indexer --values <production-overlay.yaml>
helm template <release> charts/lsp-indexer \
  --namespace <v3-namespace> \
  --values <production-overlay.yaml> > <evidence>/rendered.yaml
kubeconform -strict -summary \
  -schema-location default \
  -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
  <evidence>/rendered.yaml
kubectl --context <cluster> --namespace <v3-namespace> diff \
  --server-side --filename <evidence>/rendered.yaml | tee <evidence>/kubectl-diff.txt
```

Review the diff for exactly one indexer and worker per enabled network, distinct Secret keys,
`Recreate` indexer strategies, migration and Hasura jobs, backup schedule, Services, ServiceMonitor,
alerts, dashboard, and runtime egress policy. Stop on an unexpected deletion, shared login, mutable
image tag, missing network, or resource outside the v3 namespace.

## Apply and checkpoints

```bash
helm upgrade --install <release> charts/lsp-indexer \
  --namespace <v3-namespace> \
  --create-namespace \
  --values <production-overlay.yaml> \
  --atomic --timeout 30m | tee <evidence>/helm-upgrade.txt

kubectl --context <cluster> --namespace <v3-namespace> get jobs,pods,deployments,services \
  -o wide | tee <evidence>/workloads.txt
```

Checkpoint 1 — migration:

```bash
kubectl --context <cluster> --namespace <v3-namespace> logs \
  -l app.kubernetes.io/component=migration --tail=-1 \
  | tee <evidence>/migration.log
```

The job must list every enabled network and complete once. Stop on drift, snapshot-preservation,
role-boundary, or advisory-lock errors. Do not start runtimes against a partially migrated catalog.

Checkpoint 2 — network isolation:

```bash
kubectl --context <cluster> --namespace <v3-namespace> rollout status \
  deployment/<release>-lsp-indexer-indexer-lukso-mainnet --timeout=15m
kubectl --context <cluster> --namespace <v3-namespace> rollout status \
  deployment/<release>-lsp-indexer-indexer-ethereum-mainnet --timeout=15m
```

Repeat for every enabled worker. Confirm each pod exposes `/health` and `/metrics`, uses the expected
network key, and advances only its own committed head. A failed network must not restart or stop
another network.

Checkpoint 3 — Hasura:

```bash
kubectl --context <cluster> --namespace <v3-namespace> logs \
  job/<release>-lsp-indexer-v3-hasura-apply | tee <evidence>/hasura-apply.log
```

The job must report consistent v3 metadata. Query `indexed_head` for every enabled network through
the internal shadow endpoint; confirm the public role has queries/subscriptions and no mutations.

Checkpoint 4 — operations:

- Prometheus discovers every indexer and worker Service.
- The v3 dashboard shows committed head, cursor, lag, database health, active source, fallback
  switches, metadata queue age, committed/diagnostic throughput, memory, and CPU per network and
  process.
- No critical v3 alert is firing after the warm-up period.
- CNPG reports a healthy primary/replica pair and a successful ScheduledBackup.
- The default-deny egress implementation blocks private metadata destinations while permitting the
  explicitly approved source endpoints.

Proceed to the [acceptance runbook](./v3-acceptance.md). Deployment success does not authorize a
public cutover, v2 deletion, or merging the integration PR.
