# Phase 21: Sorting & Consumer Package Release - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add consistent `newest`/`oldest` block-order sorting across all 12 domain services, subscription hooks, React hooks, and Next.js server actions. Release all 4 consumer packages (`types`, `node`, `react`, `next`) with sorting support via changesets.

</domain>

<decisions>
## Implementation Decisions

### Default sort behavior
- All 12 domains default to newest-first (`buildBlockOrderSort('desc')`) when no sort parameter is passed
- Default sort applies to list queries only (fetchProfiles, useProfiles, useInfiniteProfiles, etc.) — single-item fetches are unaffected
- When a developer passes an explicit non-block sort (e.g., `sort: { field: 'name' }`), block-order is always appended as a tiebreaker for deterministic pagination

### Sort field cleanup
- Remove `block`, `timestamp`, `transactionIndex`, and `logIndex` as individual sort fields from all domain SortFieldSchemas
- Replace with consistent `newest`/`oldest` sort fields across all 12 domains
- Those fields (`block`, `timestamp`, etc.) remain queryable via the include system — just not individually sortable
- Domain-specific sort fields (e.g., `name`, `balance`, `followerCount`, `digitalAssetName`, `tokenIdCount`) stay alongside `newest`/`oldest`

### Consistency audit
- All 12 domains must have identical `newest`/`oldest` sort pattern — including the 4 that already have it (followers, data-changed-events, token-id-data-changed-events, universal-receiver-events)
- Audit existing implementations for consistency with the 8 new domains

### Package release strategy
- Coordinated release — all 4 packages released together since types flow through the full stack
- Use existing changesets workflow for versioning and publishing
- Publish to npm public registry
- Version stays at 1.1.0 (minor bump) — removals are not breaking since no external consumers yet

### Claude's Discretion
- Order of implementation across the 12 domains
- Exact changeset descriptions
- Whether to batch domains or do them one at a time

</decisions>

<specifics>
## Specific Ideas

- 4 domains already have `newest`/`oldest` wired through `buildBlockOrderSort()` — use followers as the reference pattern for the other 8
- The `buildBlockOrderSort(direction)` utility in `packages/node/src/services/utils.ts` already exists and produces the 3-level tiebreaker (block_number → transaction_index → log_index)
- Sort types must flow through the full stack: Zod types → GraphQL documents → parsers → services → hooks → server actions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-sorting-consumer-package-release*
*Context gathered: 2026-03-11*
