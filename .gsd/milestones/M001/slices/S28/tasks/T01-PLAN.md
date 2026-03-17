# T01: 20.3-grafana-dashboard-redesign 01

**Slice:** S28 — **Milestone:** M001

## Description

Add 5 new panel groups to the Grafana dashboard that surface pipeline health, entity throughput, verification status, and metadata fetch progress using structured log data from Phases 20.1 and 20.2.

Purpose: Production operators can monitor indexer health at a glance — step latencies, entity flow, verification results, and metadata backlog — all from a single dashboard.
Output: Updated `indexer-monitoring.json` with new rows and panels.

## Must-Haves

- [ ] "Pipeline step latency panel shows per-step timing breakdown"
- [ ] "Entity throughput panel shows entities persisted per batch by entity type"
- [ ] "Verification health panel shows valid/invalid/new address counts"
- [ ] "Metadata fetch progress panel shows backlog depth, fetch duration, success/failure"
- [ ] "Batch processing time panel shows total elapsed per batch"
- [ ] "All existing panels (block height, errors, logs, container metrics) still present and unchanged"

## Files

- `docker/grafana/provisioning/dashboards/indexer-monitoring.json`
