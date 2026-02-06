# State: LSP Indexer V2

## Project Reference

**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

**Current Focus:** Phase 1 — Handler Migration (refactor existing handlers to EntityHandler interface, build FormattedTokenId, delete legacy code)

## Current Position

- **Phase:** 1 of 5 — Handler Migration
- **Plan:** 3 of 4 in current phase
- **Status:** In progress
- **Last activity:** 2026-02-06 — Completed 01-03-PLAN.md

Progress: ██████░░░░ 3/4 phase plans (0/21 requirements)

## Phase Overview

| Phase | Name                              | Status      | Requirements |
| ----- | --------------------------------- | ----------- | :----------: |
| 1     | Handler Migration                 | **Current** |     0/5      |
| 2     | New Handlers & Structured Logging | Upcoming    |     0/5      |
| 3     | Metadata Fetch Handlers           | Upcoming    |     0/5      |
| 4     | Integration & Wiring              | Upcoming    |     0/4      |
| 5     | Deployment & Validation           | Upcoming    |     0/2      |

## Performance Metrics

- **Plans completed:** 3
- **Plans failed:** 0
- **Phases completed:** 0
- **Requirements delivered:** 0/21

## Accumulated Context

### Key Decisions

| Decision                                                            | Rationale                                                              | Phase   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 5-phase structure derived from requirement dependencies             | HMIG → HNDL+INFR → META → INTG → DEPL follows natural dependency chain | Roadmap |
| Logging parallelized with new handlers in Phase 2                   | INFR has no dependency on HNDL, enables concurrent work                | Roadmap |
| Metadata separated from simple handlers                             | External I/O + critical pitfalls (spin-wait) warrant isolation         | Roadmap |
| queueDelete() separate from removeEntity()                          | Distinguish DB-level deletion from in-memory bag removal               | 01-01   |
| postVerification as opt-in boolean flag                             | Keeps all handlers as one type, existing handlers unaffected           | 01-01   |
| topologicalSort on every registerEntityHandler()                    | Supports test scenarios with manual registration                       | 01-01   |
| Decimals uses postVerification: true for Step 5.5                   | Needs verified DA entities, must run after verification                | 01-03   |
| FormattedTokenId mutates NFTs in-place in BatchContext              | Already in bag from NFT handler, avoids duplicate entries              | 01-03   |
| Unknown format returns null + warning (not raw tokenId)             | V2 change from V1 — explicit null signals unknown format               | 01-03   |
| OwnedAsset FK set directly on OwnedToken (not via enrichment queue) | OwnedAsset is handler-created, not a verified core entity (UP/DA/NFT)  | 01-02   |
| Dual-trigger handlers read ALL bags per invocation                  | Ensures consistency regardless of trigger order                        | 01-02   |

### Discovered Todos

_None yet — populated during implementation._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-06
- **Activity:** Executed 01-02-PLAN.md + 01-03-PLAN.md (parallel) — totalSupply, ownedAssets, decimals, formattedTokenId handlers
- **Outcome:** All 4 handler files created, all compile, dual-trigger accumulation + enrichment queue pattern established
- **Next Step:** Execute 01-04-PLAN.md (legacy code cleanup + deletion)

### Context for Next Session

- All planning artifacts are in `.planning/`
- Phase 1 infrastructure complete: async handlers, delete queue, postVerification, dependsOn, topological sort
- Handlers complete: totalSupply (dual-trigger), ownedAssets (dual-trigger + queueDelete), decimals (postVerification), formattedTokenId (dependsOn + retroactive)
- Plans 01-01, 01-02, 01-03 all complete — only 01-04 (legacy cleanup) remains
- 01-04 can now proceed: all handler migration targets are in place

---

_Last updated: 2026-02-06T10:21Z_
