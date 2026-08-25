# V3 recovery and backup runbook

Exercise every procedure against the shadow release before cutover and after material database,
chart, or source changes. Capture UTC timestamps, operator, commit, cluster, commands, logs, metrics,
and before/after cursors. A written runbook without a successful exercise is not recovery evidence.

## Network-process recovery

One network process owns one stable Pipes cursor. For `<network>`:

```bash
kubectl --context <cluster> --namespace <v3-namespace> get deployment,pod \
  -l app.kubernetes.io/component=indexer,lsp-indexer.network=<network> -o wide
kubectl --context <cluster> --namespace <v3-namespace> rollout restart \
  deployment/<release>-lsp-indexer-indexer-<network>
kubectl --context <cluster> --namespace <v3-namespace> rollout status \
  deployment/<release>-lsp-indexer-indexer-<network> --timeout=15m
```

Pass criteria:

- The new pod retains `lsp-indexer:v3:eip155:<chain-id>` and resumes after the committed cursor.
- Indexed head and cursor remain equal; neither moves backward outside a reported fork.
- Other network pods and heads do not restart or stop advancing.
- Duplicate Deployments for the same network do not exist. The chart's `Recreate` strategy prevents
  an upgrade overlap; never manually scale an indexer above one replica.

Stop and preserve the database if cursor drift becomes nonzero, parent continuity fails, or a
second writer appears.

## Metadata-worker recovery

Restart only the selected worker:

```bash
kubectl --context <cluster> --namespace <v3-namespace> rollout restart \
  deployment/<release>-lsp-indexer-metadata-<network>
kubectl --context <cluster> --namespace <v3-namespace> rollout status \
  deployment/<release>-lsp-indexer-metadata-<network> --timeout=15m
```

Record pending/retry/processing counts, oldest age, maximum attempts, completions, and failures
before and after. Expired leases must become claimable, completed revision IDs must not duplicate,
and an older revision must never replace a newer current revision.

## Hasura recovery

```bash
kubectl --context <cluster> --namespace <v3-namespace> rollout restart \
  deployment/<release>-lsp-indexer-hasura
kubectl --context <cluster> --namespace <v3-namespace> rollout status \
  deployment/<release>-lsp-indexer-hasura --timeout=10m
```

Re-run the reviewed metadata image if consistency is not automatically restored:

```bash
kubectl --context <cluster> --namespace <v3-namespace> create job \
  --from=job/<release>-lsp-indexer-v3-hasura-apply \
  <release>-lsp-indexer-v3-hasura-apply-manual-<utc-suffix>
```

Pass only when health, public queries, aggregate queries, and a reconnecting subscription converge
without granting a write permission or exposing another Hasura source.

## Source and failure-isolation exercise

Run only in the shadow namespace. First record both network heads. Temporarily deny or exhaust the
RPC/Portal path for one selected network through its approved test credential or a shadow-only
NetworkPolicy overlay. Do not mutate a shared production credential.

Pass criteria:

- The affected process reports source health, staleness, and any Portal-to-RPC switch.
- It resumes at the same durable cursor after the source returns.
- No incomplete batch or cursor commits during a transport failure or block-identity mismatch.
- The second network continues advancing and its worker remains healthy.

Remove the injection overlay, render/diff the normal chart again, and retain both reports.

## CNPG backup restore exercise

Never restore over the source cluster. Select a completed backup and create a new, isolated recovery
cluster and namespace using the CloudNativePG recovery bootstrap for that backup/object store. Pin
the same PostgreSQL major version and a reviewed v3 image. Record the source backup name, start/end
time, WAL recovery target, and restored cluster name.

On the restored cluster:

1. Run `pg_isready` and inspect CNPG status/events.
2. Query `lsp_v3.network_config`, migration history, every enabled `indexed_heads` row, Pipes cursor,
   and rollback snapshot inventory.
3. Run the v3 database readiness command using each network's isolated restored runtime login.
4. Start one restored indexer at a time. It must resume from the restored cursor and reach its source
   without destructive migration or a full replay.
5. Start the metadata worker and Hasura, apply generated metadata, query all networks, and reconnect
   a subscription.
6. Compare restored counts and deterministic checksums with the source at the backup checkpoint.

The exercise fails on missing WAL, role/search-path drift, missing snapshots, cursor/head mismatch,
cross-network access, inconsistent Hasura metadata, or an unexplained checksum difference.

## Schema evolution with rollback snapshots

Pipes alpha.22 still does not reconcile tracked snapshot tables after a schema change. The migrator
therefore refuses unsafe tracked changes while snapshot artifacts exist. For any such migration:

1. Stop every v3 indexer and metadata worker; leave v2 untouched.
2. Take and verify a CNPG backup.
3. Inventory non-empty `*_rollback_*`/`__snapshots` artifacts and classify the migration as
   preservation-safe or an explicitly reviewed `destructive-replay`.
4. Preservation-safe changes must include a tested snapshot transformation. A destructive replay
   may clear v3-only chain state only with owner approval and a recorded full-replay estimate.
5. Run the migration once, inspect every schema, then restart one network at a time.

Never bypass the migration refusal, edit snapshot tables ad hoc, or delete v2 rollback state.
