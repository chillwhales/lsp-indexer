# S25: Monitoring Docker Image Release

**Goal:** Create the complete monitoring infrastructure: config files for Loki, Alloy, Prometheus, and Grafana provisioning, then add all 5 monitoring services to the production docker-compose with environment variable support.
**Demo:** Create the complete monitoring infrastructure: config files for Loki, Alloy, Prometheus, and Grafana provisioning, then add all 5 monitoring services to the production docker-compose with environment variable support.

## Must-Haves


## Tasks

- [x] **T01: 20-monitoring-docker-image-release 01** `est:2min`
  - Create the complete monitoring infrastructure: config files for Loki, Alloy, Prometheus, and Grafana provisioning, then add all 5 monitoring services to the production docker-compose with environment variable support.

Purpose: Establishes the monitoring stack that Grafana dashboards (Plan 02) will visualize. All config files and compose services must be in place before dashboards can function.
Output: 5 config files created, docker-compose.prod.yml and .env.prod.example updated with monitoring services, README updated.
- [ ] **T02: 20-monitoring-docker-image-release 02**
  - Create the Grafana dashboard JSON with log explorer, error/block summary panels, container metrics, and alert rules. Then verify the full monitoring stack works and trigger the Docker image release.

Purpose: Fulfills MNTR-01 (indexer logs in Grafana), MNTR-02 (sqd logs in Grafana), and RELD-01 (Docker image release). The dashboard is what operators actually interact with — it must answer "is something broken?" and "is it keeping up?" at a glance.
Output: Complete dashboard JSON file provisioned into Grafana, plus Docker image release verified and ready.

## Files Likely Touched

- `docker/loki/config.yaml`
- `docker/alloy/config.alloy`
- `docker/prometheus/prometheus.yml`
- `docker/grafana/provisioning/datasources/datasources.yaml`
- `docker/grafana/provisioning/dashboards/dashboards.yaml`
- `docker/docker-compose.prod.yml`
- `docker/.env.prod.example`
- `docker/README.md`
- `docker/grafana/provisioning/dashboards/indexer-monitoring.json`
