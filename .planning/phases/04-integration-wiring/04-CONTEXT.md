# Phase 4: Integration & Wiring - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

All EventPlugins and EntityHandlers are discovered, registered, and wired into a bootable application that processes blocks through all 6 pipeline steps end-to-end. This phase delivers:

- Processor configured with all EventPlugin log subscriptions from the registry
- Application boots with all 11 EventPlugins and all EntityHandlers discovered and registered
- Integration tests with real LUKSO block fixtures verify all 6 pipeline steps
- Handler ordering that preserves V1's dependency graph

</domain>

<decisions>
## Implementation Decisions

### Discovery Mechanism

- Convention-based auto-scan — Registry scans `plugins/` and `handlers/` directories for `*.plugin.js` / `*.handler.js` files
- Separate directories: `src/plugins/events/` for EventPlugins, `src/handlers/` for EntityHandlers
- Warn and skip invalid files — Log warnings for files without proper exports, continue discovery
- Fail fast on duplicates — Throw fatal error if two plugins share topic0 or two handlers share name

### Boot Sequence Validation

- Comprehensive validation at startup — Check all handlers reference valid bags, no circular dependencies, topic0/name uniqueness
- Handler dependencies validated at registration — Check `dependsOn` references, detect cycles via topological sort
- Structured summary logging — Log plugin count, handler count, dependency order, subscription summary
- Fail fast with detailed messages — Fatal error on boot issues (duplicates, cycles, unknown dependencies) with specific error context

### Integration Test Fixtures

- Real LUKSO block data — Capture actual mainnet/testnet blocks, store as JSON fixtures in `test/fixtures/blocks/`
- End-to-end block processing — Full blocks test all 6 pipeline steps (EXTRACT → PERSIST RAW → HANDLE → PERSIST DERIVED → VERIFY → ENRICH)
- Critical path + edge cases coverage — Happy path scenarios (transfers, mints) plus edge cases (zero-value, self-transfer, multi-event blocks)
- Committed JSON fixtures — Version-controlled, deterministic, no network dependency during test runs

### Handler Ordering Verification

- Topological sort with declarative dependencies — Handlers declare `dependsOn: ['handlerName']`, registry sorts automatically
- Document V1 order + validate via integration tests — Document V1 execution order in comments, verify same entities produced in tests
- Fail at boot on ordering violations — Topological sort throws on circular deps or unknown `dependsOn` references
- Handler-level dependency granularity — Dependencies declared at handler level, not auto-inferred from bags

### Claude's Discretion

- Exact boot log format and field names (as long as structured and includes counts/order)
- Fixture selection criteria (which specific blocks to capture)
- Integration test assertion depth (field-level comparison vs entity count validation)
- Error message formatting (as long as actionable and includes context)

</decisions>

<specifics>
## Specific Ideas

- Registry already implements discovery (`discover()`, `discoverHandlers()`), topological sort, and duplicate detection — build on existing implementation
- Success criteria explicitly requires "real LUKSO block fixtures" and "all 6 pipeline steps" — not synthetic data or isolated step tests
- Requirement INTG-04 states handler order must match V1's dependency graph (e.g., NFT before FormattedTokenId, transfers before totalSupply/ownedAssets)
- Current registry validation includes cycle detection (lines 265-270) and unknown dependency checks (lines 206-215) — preserve these

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 04-integration-wiring_
_Context gathered: 2026-02-09_
