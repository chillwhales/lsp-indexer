# Phase 23: LSP29/LSP31 Decoding Update - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Update the indexer's LSP29 encrypted asset decoding to match the latest spec from `@chillwhales/lsp29` and `@chillwhales/lsp31`. This is a complete redesign — LSP29 and LSP31 are two separate standards where LSP29 uses LSP31. All hand-rolled LSP29 code (constants, type guards, extractors, handlers) will be replaced with package imports. Consumer packages (types, node, react, next) will be updated with breaking changes to match the new schema.

</domain>

<decisions>
## Implementation Decisions

### Spec changes scope
- Complete redesign — not incremental updates to existing implementation
- LSP29 and LSP31 are two separate standards; LSP29 uses LSP31
- The authoritative source for the spec is the `@chillwhales/lsp29` and `@chillwhales/lsp31` npm packages (published) plus the LSPs repo in the chillwhales GitHub org

### Package adoption
- Full replacement of hand-rolled LSP29 code — remove `src/constants/lsp29.ts` entirely, import data keys from `@chillwhales/lsp29`
- Full replacement of hand-rolled type guards and extractors in `src/utils/index.ts` — use package functions directly
- Import `@chillwhales/lsp29` and `@chillwhales/lsp31` as separate dependencies (not combined)
- If the indexer needs utility functions that don't exist in the published packages: block the phase, open a PR to the LSPs repo, wait for release, then proceed

### Data migration
- Full wipe and re-index from genesis block — no incremental migration, no data preservation
- Reset all fetch state — no retry counts, error messages, or fetch status from old implementation
- No backup of old LSP29 data — old data is irrelevant, new way is the only way

### Consumer package impact
- All 4 consumer packages (types, node, react, next) updated in this phase
- Breaking changes — no backward compatibility, no deprecation path
- Complete rewrite of GraphQL documents and parsers for encrypted-assets domain
- Package versioning only for type transitions — major version bump, old types completely removed

### Claude's Discretion
- New entity structure design (based on what the packages export)
- Handler implementation patterns (following existing indexer conventions)
- GraphQL schema design for new entities
- Test structure and coverage approach
- Order of operations within the phase (which handlers/entities first)

</decisions>

<specifics>
## Specific Ideas

- The `@chillwhales/lsp29` package is the single source of truth for data keys, type guards, and extractors — everything the indexer needs should come from the package
- If a utility is missing from the package, the fix is upstream (PR to LSPs repo + release), not a local workaround
- The `chillwhales` GitHub org has the LSPs repo containing both standards

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-lsp29-lsp31-decoding-update*
*Context gathered: 2026-03-14*
