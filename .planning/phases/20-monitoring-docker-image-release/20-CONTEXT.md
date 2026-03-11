# Phase 20: Monitoring & Docker Image Release - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Production operators can observe indexer health through Grafana and deploy the latest changes. This phase adds a monitoring stack (Grafana, Loki, Alloy, cAdvisor, Prometheus) to the production docker-compose and releases an updated Docker image. The Dockerfile and GitHub Actions build workflow are unchanged — only the compose file and monitoring configuration are in scope.

</domain>

<decisions>
## Implementation Decisions

### Dashboard content
- Full observability dashboard: log explorer + summary panels + container-level metrics
- Summary panels cover both error rates (count over time, by pipeline step) and block progress (current height, blocks/minute, sync lag)
- cAdvisor provides per-container CPU, memory, network, and disk I/O metrics
- Alert rules defined on the dashboard (visual red/green status indicators) but no notification channel configured — operators see alert state when they look at the dashboard

### Grafana access model
- Anonymous read-only access for viewing dashboards + admin login required for editing
- Port configurable via `GRAFANA_PORT` env var in `.env.prod`, defaulting to 3000 — follows existing pattern (`HASURA_GRAPHQL_PORT`)
- Provisioned dashboard JSON files loaded on fresh deploy (out-of-the-box working dashboards) plus a named Docker volume for persistence (operator edits survive restarts)
- All Grafana provisioning config (dashboards, datasources) lives in `docker/grafana/`

### Log scope
- All 5 services collected: indexer, sqd (Subsquid processor), Hasura, PostgreSQL, data-connector
- Grafana Alloy as the single collector — handles both log collection (→ Loki) and Prometheus metric scraping (← cAdvisor) in one container
- PostgreSQL `log_min_duration_statement` set to 500ms for slow query visibility without flooding logs during normal batch writes
- Log retention configurable via env var, defaulting to 14 days

### Release process
- No changes to Dockerfile or GitHub Actions workflow (`docker.yml`) — existing tag-based + manual dispatch flow is sufficient
- This phase modifies `docker-compose.prod.yml` to add monitoring services
- Release is triggered by tagging after compose changes are merged (existing process)

### Claude's Discretion
- Exact Alloy pipeline configuration (scrape intervals, label extraction)
- Loki storage backend config (filesystem vs. object storage)
- Prometheus scrape targets and intervals
- Dashboard panel layout, exact queries, and color scheme
- cAdvisor version selection
- Grafana version selection
- Alert rule thresholds (error rate spike, sync stalled duration)
- `.env.prod.example` updates for new monitoring env vars

</decisions>

<specifics>
## Specific Ideas

- Operators need to answer two questions at a glance: "is something broken?" (errors) and "is it keeping up?" (block progress)
- PostgreSQL slow query logging at 500ms specifically to find optimization opportunities — the indexer does heavy batch writes so sub-100ms queries are routine noise
- All 5 services collected (not just the required indexer + sqd) because Postgres and Hasura logs reveal optimization opportunities across the full pipeline
- Alloy chosen over separate Promtail + Prometheus scraper to reduce container count in the compose file
- Dashboard provisioning from JSON files ensures `docker compose up` gives working dashboards with zero manual setup

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-monitoring-docker-image-release*
*Context gathered: 2026-03-11*
