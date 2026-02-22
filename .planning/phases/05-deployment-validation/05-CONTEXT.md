# Phase 5: Deployment & Validation - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

V2 data parity is proven by an automated comparison script that queries two live Hasura GraphQL endpoints (V1 and V2) and reports per-entity-type row counts, sampled content diffs, and a pass/fail verdict. The user deploys V1 and V2 independently — this phase builds the comparison tooling, not the deployment infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Deployment architecture

- User runs V1 and V2 independently on their own infrastructure
- No side-by-side docker-compose file needed — each indexer has its own stack
- The comparison script receives two Hasura GraphQL URLs as input
- No direct database access — all comparison happens via Hasura GraphQL queries
- Hasura is not managed by this phase; both endpoints are assumed to be running

### Comparison script interface

- CLI arguments for both endpoints: `--v1=https://... --v2=https://...`
- Optional admin secret per endpoint: `--v1-secret=xxx --v2-secret=yyy`
- Optional entity filter: `--entities=UniversalProfile,NFT` (default: all)
- Hardcoded list of known entity types — script warns if a type is missing from either endpoint

### Comparison scope & granularity

- Compare ALL entity types that V1 produces (UP, DA, NFT, OwnedToken, Follow, Permission, all metadata sub-entities)
- Three-phase comparison run: (1) aggregate row counts per type, (2) sampled content diffs (fetch N rows by ID from both, diff field-by-field), (3) summary with pass/fail
- Match rows between V1 and V2 by entity primary key / ID (deterministic ID generation is identical)
- Metadata sub-entities (ProfileImage, AssetImage, Tags, Links, etc.) reported separately from core entities — metadata timing differences don't block pass/fail

### Known divergence handling

- Exclusion list baked into the script: `{ entityType: { field: "reason" } }`
- Known divergences (null FKs vs entity removal, unknown token format returns null, etc.) are skipped during comparison
- Known divergences displayed in a separate "Known Differences" section of the report
- Unknown diffs = bugs. Known diffs = expected. Clean signal.

### Validation criteria

- All entity types must have matching row counts
- Sampled content diffs must show zero unexpected divergences
- Any unexplained difference is a failure — this is the production cutover gate
- One comparison run at a meaningful point (both indexers at roughly the same height) is sufficient

### Output & reporting

- Structured console output with colored terminal formatting
- Per-entity-type counts table (V1 count vs V2 count)
- Side-by-side field comparison for diffs: `field: V1 value → V2 value` (only differing fields shown)
- Known divergences in a clearly labeled separate section with reasons
- Final PASS/FAIL verdict
- Exit code 0 for pass, 1 for fail

### Claude's Discretion

- GraphQL query construction and pagination strategy for sampling
- Sample size per entity type (e.g., 100 rows)
- Console formatting library choice
- Script language (TypeScript recommended since the rest of the project uses it)
- How to handle Hasura schema differences (extra/missing fields)

</decisions>

<specifics>
## Specific Ideas

- The user will provide two Hasura URLs — one from a running V1 instance, one from a running V2 instance
- No Docker orchestration needed — deployment is the user's responsibility
- The comparison tool is the deliverable, not the deployment setup
- Script should be runnable with a simple command, no complex setup

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 05-deployment-validation_
_Context gathered: 2026-02-12_
