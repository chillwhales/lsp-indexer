---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Production Readiness
status: completed
last_updated: "2026-03-16T06:47:40Z"
last_activity: 2026-03-16 — Completed 25-01 env availability detection and conditional UI
progress:
  total_phases: 57
  completed_phases: 49
  total_plans: 141
  completed_plans: 127
  percent: 91
---

# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-08)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.2 Production Readiness — Phase 25 Test App Publish Readiness

## Current Position

- **Milestone:** v1.2 Production Readiness
- **Phase:** Phase 25 — Test App Public Publish Readiness
- **Plan:** 1 of 2 (Plan 01 complete)
- **Status:** In Progress
- **Last activity:** 2026-03-16 — Completed 25-01 env availability detection and conditional UI
- **Progress:** [█████████░] 91%

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped |
| --- | --- | --- | --- | --- |
| v1.0 | 11 | 36 | 45/45 | 2026-02-16 |
| v1.1 | 33 | 77 | 46/46 | 2026-03-08 |

Archives:
- `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`
- `milestones/v1.1-ROADMAP.md`, `milestones/v1.1-REQUIREMENTS.md`

See: `.planning/MILESTONES.md` for accomplishment summaries.

## Performance Metrics

- **Plans completed:** 130 (36 v1.0 + 77 v1.1 + 17 v1.2)
- **Plans failed:** 0
- **Phases completed:** 50 (11 v1.0 + 33 v1.1 + 6 v1.2)
- **Requirements delivered:** 45/45 (v1.0), 46/46 (v1.1), 22/26 (v1.2)

## Accumulated Context

### Key Decisions

See `.planning/PROJECT.md` Key Decisions table for full record.

### Roadmap Evolution

- v1.0: 11 phases (5 original + 5 inserted + 1 gap closure)
- v1.1: 33 phases (10 main + 12 domain sub-phases + 10 subscription sub-phases + 1 inserted)
- Phase 23 added: LSP29/LSP31 Decoding Update — update encrypted asset decoding per latest @chillwhales/lsp29 + @chillwhales/lsp31 specs
- Phase 24 added: LSP31 URI Decoding — switch LSP29 handler from VerifiableURI to LSP31 multi-backend URI decoding
- Phase 25 added: Test App Public Publish Readiness — secure env variables, conditional tabs, install guide

### Discovered Todos

_None currently._

### Blockers

_None currently._

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 2 | Release pipeline with versioning for monorepo Dockerfile builds | 2026-03-11 | c0e2ad7 | [2-release-pipeline-with-versioning-for-mon](./quick/2-release-pipeline-with-versioning-for-mon/) |
| 3 | Add timestamp to all entities missing it (Phase 19 fix) | 2026-03-12 | eecfa83 | [3-add-timestamp-to-all-entities-that-got-b](./quick/3-add-timestamp-to-all-entities-that-got-b/) |
| 4 | Fix integer overflow error in lsp8TokenIdFormat handler - hexToNumber failing on large token IDs | 2026-03-15 | f757508 | [4-fix-integer-overflow-error-in-lsp8tokeni](./quick/4-fix-integer-overflow-error-in-lsp8tokeni/) |
| Phase 21 P01 | 8min | 3 tasks | 20 files |
| Phase 21 P02 | 2min | 2 tasks | 8 files |
| Phase 20.1 P02 | 7min | 2 tasks | 6 files |
| Phase 20.2 P01 | 4min | 2 tasks | 3 files |
| Phase 20.3 P01 | 2min | 2 tasks | 1 file |
| Phase 23 P01 | 4min | 2 tasks | 3 files |
| Phase 23 P02 | 6min | 2 tasks | 6 files |
| Phase 23 P03 | 10min | 3 tasks | 8 files |
| Phase 24 P01 | 4min | 2 tasks | 2 files |
| Phase 25 P01 | 2min | 2 tasks | 5 files |

## Session Continuity

### Last Session

- **Date:** 2026-03-16
- **Activity:** Executed Phase 25-01 — env availability detection and conditional UI
- **Outcome:** Created EnvProvider context, conditional subscription providers, conditional mode toggle
- **Resume file:** None

### Context for Next Session

- **Phase 25 in progress:** Plan 01 complete, Plan 02 remaining
- **Next:** Execute 25-02-PLAN.md
- **Decisions:** hasServerUrl checks only INDEXER_URL (no NEXT_PUBLIC fallback); removed hardcoded proxyUrl

---

_Last updated: 2026-03-16 — Completed 25-01 env availability detection and conditional UI_
