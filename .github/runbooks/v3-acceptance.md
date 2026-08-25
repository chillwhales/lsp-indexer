# V3 shadow-production acceptance runbook

The output of this runbook is evidence for gates G7–G9, not permission to merge the permanent
integration PR. Store reports with the commit, image digest, UTC window, endpoints, network heads,
operators, and explanations for every nonzero difference.

## 1. Same-height full parity

Stop the v2 shadow snapshot at a recorded finalized LUKSO height. Run v3 in its separate database
with `INDEXER_TO_BLOCK` set to exactly that height. The v3 `indexed_head.block_number` and
`finalized_block_number` must both equal it; a process exit alone is not proof of the finalized
tail.

Run the mapped shared-field comparison:

```bash
V2_GRAPHQL_ENDPOINT=https://<v2-shadow>/v1/graphql \
V3_GRAPHQL_ENDPOINT=https://<v3-shadow>/v1/graphql \
V2_GRAPHQL_ADMIN_SECRET='<secret-if-required>' \
V3_GRAPHQL_ADMIN_SECRET='<secret-if-required>' \
ACCEPTANCE_NETWORK=lukso-mainnet \
ACCEPTANCE_FINALIZED_BLOCK=<height> \
ACCEPTANCE_PAGE_SIZE=1000 \
ACCEPTANCE_MAX_ROWS_PER_DOMAIN=1000000 \
  pnpm --filter @chillwhales/indexer-v3 acceptance:parity \
  > <evidence>/parity-lukso-<height>.json
```

The command compares every row up to the explicit ceiling; it fails rather than silently sampling.
It maps profiles and their owners, assets and their owners, NFTs, owned assets/tokens, active
followers, creators, issued assets, controller permissions, total supply, decimals, token names,
symbols, token types, token-ID formats, reference contracts, and base URIs across the v2 and v3
structures. Enum and CompactBytesArray representations are normalized before comparison. Empty
strings remain distinct from `null` instead of being treated as representation aliases. Metadata
revision lifecycle, invalid raw values, and v3-only fields are validated by their dedicated
invariant suites and must be reviewed separately. Pass only with `passed: true` and zero unexplained
differences. Raise the ceiling or partition the run if any domain is marked `truncated`.

## 2. Bounded performance replay

Choose a representative finalized range with the event distribution and metadata load recorded.
Measure the observed v2 block/event rate on equal CPU, memory, PostgreSQL, RPC, and source conditions.
Start v3 from an empty shadow database on the same range, set each target's
`minimumBlocksPerSecond` to twice the observed production rate, and observe for the full replay.
No unexplained v3 regression greater than 10% against the paired v2 measurement is accepted.

## 3. Multi-network 24-hour soak

Expose the indexer and worker `/metrics` endpoints only to the observation host. Configure at least
two independent networks:

```bash
ACCEPTANCE_METRICS_TARGETS='[
  {
    "network":"lukso-mainnet",
    "metricsUrl":"http://127.0.0.1:19090/metrics",
    "metadataMetricsUrl":"http://127.0.0.1:19091/metrics",
    "minimumBlocksPerSecond":<approved-lukso-budget>,
    "maximumLagSeconds":120,
    "maximumSourceLagBlocks":10,
    "maximumMetadataAgeSeconds":900,
    "maximumResidentMemoryBytes":4294967296,
    "maximumCpuCores":2,
    "requireFallback":true
  },
  {
    "network":"ethereum-mainnet",
    "metricsUrl":"http://127.0.0.1:29090/metrics",
    "metadataMetricsUrl":"http://127.0.0.1:29091/metrics",
    "minimumBlocksPerSecond":<approved-ethereum-budget>,
    "maximumLagSeconds":120,
    "maximumSourceLagBlocks":10,
    "maximumMetadataAgeSeconds":900,
    "maximumResidentMemoryBytes":4294967296,
    "maximumCpuCores":2,
    "requireFallback":true
  }
]' \
ACCEPTANCE_OBSERVATION_SECONDS=86400 \
ACCEPTANCE_MINIMUM_EVIDENCE_SECONDS=86400 \
ACCEPTANCE_SCRAPE_INTERVAL_SECONDS=30 \
ACCEPTANCE_MAXIMUM_SCRAPE_FAILURES=0 \
  pnpm --filter @chillwhales/indexer-v3 acceptance:soak \
  > <evidence>/soak-24h.json
```

The observer isolates scrape failures by network, retains up to ten distinct failure messages, and
reports committed-head throughput, the diagnostic restart-safe processed-block counter rate,
committed-state lag, exact cursor drift, source health/stall/lag state, metadata age, resident
memory, and CPU cores at p95. When a metadata endpoint is configured, memory and CPU are the sum of
the indexer and metadata-worker processes, and missing worker process metrics fail that scrape. Each
process CPU counter is converted to a restart-safe rate before the two rates are summed. The evidence
duration is the configured observation window from command start through its deadline, not the
difference between first and last scrape completion times.
Throughput, memory, and p95 CPU are enforced against the per-network budgets, and a configured
metadata endpoint must expose its expected age metric. The throughput budget uses net committed
head progress, so replayed or repeatedly failed work cannot inflate the result. A short run is
labeled `probe` and cannot satisfy the 24-hour evidence minimum.

## 4. Failure and recovery matrix

Execute and link every exercise from [the recovery runbook](./v3-recovery.md):

| Exercise                    | Required evidence                                      |
| --------------------------- | ------------------------------------------------------ |
| Kill one network indexer    | Same cursor resumes; other network advances            |
| Deny one source/RPC         | No partial commit; fallback/recovery; other network up |
| Restart one metadata worker | Lease recovery; no duplicate/stale publication         |
| Restart Hasura              | Health, API, and subscription reconvergence            |
| Restore a CNPG backup       | Catalog/checksum parity and resumed indexing           |
| Reapply migrations/metadata | No drift and no privilege expansion                    |

## 5. Acceptance record

The release operator links parity, performance, 24-hour soak, dashboard export, alert exercise,
query plans, recovery logs, backup restore, image digest, CI run, and reviewer result from
`V3_VALIDATION_REPORT.md`. The incident commander records whether every stop condition stayed clear.
The repository owner alone records the cutover decision. Missing or indirect evidence is a failed
gate.
