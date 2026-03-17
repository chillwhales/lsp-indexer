# T02: 20-monitoring-docker-image-release 02

**Slice:** S25 — **Milestone:** M001

## Description

Create the Grafana dashboard JSON with log explorer, error/block summary panels, container metrics, and alert rules. Then verify the full monitoring stack works and trigger the Docker image release.

Purpose: Fulfills MNTR-01 (indexer logs in Grafana), MNTR-02 (sqd logs in Grafana), and RELD-01 (Docker image release). The dashboard is what operators actually interact with — it must answer "is something broken?" and "is it keeping up?" at a glance.
Output: Complete dashboard JSON file provisioned into Grafana, plus Docker image release verified and ready.

## Must-Haves

- [ ] "Grafana dashboard shows structured log output from the indexer in real-time"
- [ ] "Grafana dashboard shows Subsquid processor (sqd) logs including block processing progress"
- [ ] "Dashboard has summary panels for error rates (count over time, by pipeline step)"
- [ ] "Dashboard has summary panels for block progress (current height, blocks/minute, sync lag)"
- [ ] "Dashboard shows container-level metrics (CPU, memory, network, disk I/O) for all services"
- [ ] "Alert rules show visual red/green status for error spikes and sync stalls"
- [ ] "Updated Docker image available at ghcr.io/chillwhales/lsp-indexer"

## Files

- `docker/grafana/provisioning/dashboards/indexer-monitoring.json`
