# S28: Grafana Dashboard Redesign

**Goal:** Add 5 new panel groups to the Grafana dashboard that surface pipeline health, entity throughput, verification status, and metadata fetch progress using structured log data from Phases 20.
**Demo:** Add 5 new panel groups to the Grafana dashboard that surface pipeline health, entity throughput, verification status, and metadata fetch progress using structured log data from Phases 20.

## Must-Haves


## Tasks

- [x] **T01: 20.3-grafana-dashboard-redesign 01** `est:2min`
  - Add 5 new panel groups to the Grafana dashboard that surface pipeline health, entity throughput, verification status, and metadata fetch progress using structured log data from Phases 20.1 and 20.2.

Purpose: Production operators can monitor indexer health at a glance — step latencies, entity flow, verification results, and metadata backlog — all from a single dashboard.
Output: Updated `indexer-monitoring.json` with new rows and panels.

## Files Likely Touched

- `docker/grafana/provisioning/dashboards/indexer-monitoring.json`
