# Phase 1: Handler Migration - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate totalSupply, ownedAssets, and decimals handlers to the V2 EntityHandler interface, build a new FormattedTokenId handler that populates `NFT.formattedTokenId` based on LSP8TokenIdFormat, and delete all legacy code (DataKeyPlugin interface, populate helpers, handler helpers). All handlers must use `listensToBag` for self-selection and integrate with the enrichment queue for FK resolution.

</domain>

<decisions>
## Implementation Decisions

### FormattedTokenId behavior

- Preserve V1's retroactive update behavior: when LSP8TokenIdFormat changes for a contract, query DB and reformat ALL existing NFTs for that contract
- When LSP8TokenIdFormat is unknown or not yet set, leave `formattedTokenId` as null — only populate once the format is known
- Handler ordering must be explicit: FormattedTokenId declares a dependency on lsp8TokenIdFormat handler — registry enforces execution order
- Support same 4 formats as V1 (NUMBER, STRING, ADDRESS, BYTES32) with identical conversion logic, but log a warning when an unknown format is encountered for future investigation

### Delete vs null-FK semantics

- Delete OwnedAsset records when balance reaches zero — match V1 behavior
- Delete OwnedToken records when token is transferred away (sender side) — match V1 behavior
- Consistent deletion approach for both entity types (no zero-balance records kept)
- When enrichment queue targets an entity that was deleted, log at debug level — expected scenario, not an error

### V1 parity strictness

- Clamp totalSupply to zero on underflow (burn > recorded supply), but log a warning — underflow may indicate a data issue
- Clean up ID formats: do NOT match V1's `"{owner} - {address}"` format — use a cleaner format (e.g., `"{owner}:{address}"`)
- Phase 5 validation: row-count parity + automated spot checks on key records — accept known divergences (ID formats, architectural differences)
- Note ID format differences in Phase 5 comparison exclusion list

### Handler async & DB access

- Change `EntityHandler.handle()` signature to return `Promise<void>` — all handlers become async-capable
- Add a post-verification handler hook to the pipeline (Step 5.5) for decimals handler — it needs to trigger after Digital Asset verification, not during Step 3
- Handlers that need existing DB state (totalSupply, ownedAssets) must accumulate changes in-memory: read existing state once per asset, apply all batch transfers in-memory, write final result
- Add `ctx.removeEntity()` to BatchContext — pipeline handles batch deletes in Step 4 alongside upserts, keeping handlers pure

### Claude's Discretion

- Multicall3 batch size for decimals handler (V1 uses 100, Claude may optimize)
- Exact cleaned-up ID format for OwnedAsset and OwnedToken
- Loading skeleton and internal implementation details for pipeline changes
- Handler file naming and internal organization within existing conventions

</decisions>

<specifics>
## Specific Ideas

- FormattedTokenId retroactive updates are important for data correctness — when a contract sets its token ID format after tokens already exist, all existing tokens must be reformatted
- Debug-level logging for enrichment queue misses (deleted entities) provides troubleshooting capability without noise
- Warning-level logging for totalSupply underflow helps identify potential re-org or data issues during indexing
- Post-verification hook (Step 5.5) is preferred over special bag keys — keeps the pipeline stages explicit and predictable

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 01-handler-migration_
_Context gathered: 2026-02-06_
