# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — React Hooks Package

**Shipped:** 2026-03-08
**Phases:** 33 | **Plans:** 77

### What Was Built
- 4 publishable npm packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`)
- 12 query domain verticals (profiles, digital assets, NFTs, owned assets/tokens, followers, creators, issued assets, encrypted assets, data changed events, token ID data changed, universal receiver events) — each with types, parsers, services, hooks, server actions
- Real-time WebSocket subscriptions for all 12 domains via graphql-ws
- Prisma-style conditional include type narrowing across all domains
- Layered CI/CD pipeline with changesets, preview releases, shared reusable workflows

### What Worked
- **Vertical-slice approach:** Building profiles end-to-end first (Phase 8) established the pattern that 10 subsequent domains replicated without rework — massive time savings
- **DX refactors before replication (9.4, 9.6):** Fixing conditional include types and generic propagation before building remaining domains meant those domains used the correct pattern from day one
- **Sub-phase structure:** Breaking Phase 9 into 12 sub-phases and Phase 10 into 13 sub-phases gave granular progress tracking and branch isolation — each sub-phase got its own PR
- **Research-first planning:** Phase 9.4 started with a design spike plan, preventing a bad type algebra pattern from propagating across all domains
- **Milestone audit + gap closure loop:** Running audit before completion caught 7 gaps (missing VERIFICATIONs), Phase 16 closed them cleanly

### What Was Inefficient
- **Early phases lacked SUMMARY frontmatter format:** 13 requirements had VERIFICATION passed but no SUMMARY frontmatter — format was established too late. Future milestones should establish the format in Phase 1
- **Subscription sub-phases were mechanically repetitive:** Phases 10.2–10.13 each followed an identical pattern (create hook + playground). A batch execution approach could have been more efficient
- **Extended requirements (12–16) added incrementally:** MIGRATE, CLEAN, RELEASE, CICD requirements were discovered during development rather than planned upfront. Better upfront scoping of "what does release-ready mean?" would have front-loaded this work

### Patterns Established
- **Domain vertical-slice pattern:** types → documents → codegen → parsers → services → keys → hooks → actions → playground (12 steps per domain)
- **`IncludeResult<Full, Base, Map, I>` utility type** for conditional include type narrowing
- **3-overload generic `<const I>` pattern** for full type propagation from parser to consumer
- **`stripExcluded` runtime utility** for field stripping with derived field dependencies
- **Shared playground components:** FilterFieldsRow, SortControls, ResultsList<T>, useFilterFields, ErrorAlert, RawJsonToggle
- **`export *` barrel pattern** in all package index.ts files
- **Factory-based subscription hook creation** for consistent subscription patterns across domains

### Key Lessons
1. **Build one complete vertical slice first, then replicate.** The Phase 8 profiles slice validated 100% of the architecture decisions. If we had built all domains in parallel from the start, every mistake would have been multiplied 12x.
2. **Cross-cutting DX refactors should happen early, not late.** Conditional include types (9.4) and generic propagation (9.6) were correctly placed before remaining domains. Doing this after all 12 domains would have been a painful retrofit.
3. **Audit before archive.** The milestone audit caught real gaps (missing VERIFICATIONs, PAGE-01 tracking). Without it, the milestone would have been marked complete with hidden quality issues.
4. **Sub-phases give PR-level granularity.** Each domain sub-phase had its own branch and PR — reviewable independently. This was worth the overhead of more planning files.
5. **Plan for release readiness from the start.** Phases 12–15 (migration, cleanup, docs, CI/CD) were added reactively. Future milestones should include a "release readiness" phase in the initial roadmap.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
| --- | --- | --- | --- |
| v1.0 | 11 | 36 | Established GSD workflow, inserted phases for urgent fixes |
| v1.1 | 33 | 77 | Sub-phase structure, vertical-slice replication, milestone audit loop |

### Cumulative Quality

| Milestone | Packages | Domains | Requirements |
| --- | --- | --- | --- |
| v1.0 | 3 (abi, typeorm, indexer) | N/A (indexer pipeline) | 45/45 |
| v1.1 | 4 (types, node, react, next) | 12 query domains | 46/46 |

### Top Lessons (Verified Across Milestones)

1. **Build the pattern first, then replicate.** v1.0 validated EntityHandler with one handler before migrating all. v1.1 validated profiles before building 11 more domains. The pattern holds.
2. **Inserted phases work.** Both milestones needed urgent insertions (5.1–5.3 in v1.0, 9.12 in v1.1). Decimal phase numbering gives clean insertion semantics without renumbering.
3. **Audit catches what tracking misses.** v1.0 had comparison tool validation. v1.1 had milestone audit. Both caught real issues that tracking alone wouldn't surface.
