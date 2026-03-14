---
'@chillwhales/indexer': patch
---

Internal structured logging migration — migrated all console.\* calls to structured (attrs, message) pattern for Grafana/Loki queryability. All logs now emit structured fields queryable in Grafana/Loki, worker thread logs relay through parent, and LOGGING.md documents field conventions.
