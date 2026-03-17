# T01: 20-monitoring-docker-image-release 01

**Slice:** S25 — **Milestone:** M001

## Description

Create the complete monitoring infrastructure: config files for Loki, Alloy, Prometheus, and Grafana provisioning, then add all 5 monitoring services to the production docker-compose with environment variable support.

Purpose: Establishes the monitoring stack that Grafana dashboards (Plan 02) will visualize. All config files and compose services must be in place before dashboards can function.
Output: 5 config files created, docker-compose.prod.yml and .env.prod.example updated with monitoring services, README updated.

## Must-Haves

- [ ] "docker compose -f docker/docker-compose.prod.yml config validates without errors with all monitoring services"
- [ ] "Monitoring stack has 5 new services: grafana, loki, alloy, cadvisor, prometheus"
- [ ] "Grafana is accessible on configurable port (GRAFANA_PORT, default 3000) with anonymous read-only access"
- [ ] "Alloy collects Docker container logs and pushes to Loki"
- [ ] "Alloy scrapes cAdvisor metrics and pushes to Prometheus via remote write"
- [ ] "PostgreSQL slow query logging enabled at 500ms threshold"

## Files

- `docker/loki/config.yaml`
- `docker/alloy/config.alloy`
- `docker/prometheus/prometheus.yml`
- `docker/grafana/provisioning/datasources/datasources.yaml`
- `docker/grafana/provisioning/dashboards/dashboards.yaml`
- `docker/docker-compose.prod.yml`
- `docker/.env.prod.example`
- `docker/README.md`
