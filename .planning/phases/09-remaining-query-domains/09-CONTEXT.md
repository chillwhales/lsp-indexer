# Phase 9: Remaining Query Domains & Pagination - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Developer can query all 11 indexer domains with consistent hook patterns, and use infinite scroll pagination on any list query. This phase replicates the validated vertical-slice pattern from Phase 8 (Universal Profiles) across the 10 remaining domains. New capabilities (subscriptions, publish readiness) belong in Phases 10 and 11.

</domain>

<decisions>
## Implementation Decisions

### Server actions scope

- Include bare server actions (`getX`, `getXs`, `getXsByY`) for all 10 domains in Phase 9, alongside the services — not deferred to Phase 11
- Include `@lsp-indexer/next` hooks for all 10 domains too (both `actions/{domain}.ts` and `hooks/{domain}.ts`)
- One action per hook variant — `getNfts`, `getNftsByCollection`, `getOwnedAssets`, `getOwnedTokens` etc. Mirror hook naming exactly (`get` instead of `use`)
- Full `useInfinite*` parity in `@lsp-indexer/next` — if `@lsp-indexer/react` gets `useInfiniteDigitalAssets`, `@lsp-indexer/next` gets it too
- No Zod input validation on actions — that's Phase 11's job. Actions are thin wrappers: `'use server'` + call service + return result

### Plan structure

- **12 plans total:** 1 setup plan + 10 domain plans (one per domain) + 1 final integration plan
- **Setup plan:** Run `pnpm schema:dump` + codegen once upfront, commit generated types. All domain plans start from this consistent generated state
- **10 domain plans:** One per domain, fully independent — designed for parallel execution. Each plan is self-contained: types → documents → parsers → services → keys → hooks (react + next) → actions → playground page
- **Final integration plan:** Validates combined build, catches export conflicts in `src/index.ts` across all packages, adds test app index/navigation page, runs full build validation

### Infinite scroll coverage

- All list domains get `useInfinite*` hooks — including event domains (DataChanged, UniversalReceiver). Offset-based pagination works for events (latest N, then next N)
- `useProfileStats` does NOT get `useInfiniteProfileStats` — it's a single aggregate row, not a list
- `useFollowCount` does NOT get `useInfiniteFollowCount` — it returns a scalar count, not a list
- Default page size: **20 items** for all `useInfinite*` hooks

### Playground depth

- Full-featured playground for all 10 domains — domain-appropriate filter fields, sort controls, paginated results. Matches the profiles playground depth
- Client/Server mode toggle on every domain page — switches between `@lsp-indexer/react` hooks (direct Hasura) and `@lsp-indexer/next` hooks (through server action). Validates both packages
- Raw JSON toggle on every domain page — already part of shared `RawJsonToggle` component, zero extra work
- Test app index/landing page — home page (`/`) listing all 11 domain playground pages, grouped logically (assets, social, events, encrypted, stats). Added in the final integration plan

### Claude's Discretion

- Domain card component design for each new domain (structure, which fields to display)
- Exact filter field configs and sort options per domain (derived from the GraphQL schema)
- Grouping logic for the test app index page
- Error state and loading skeleton implementation within shared component patterns

</decisions>

<specifics>
## Specific Ideas

- The per-domain checklist is already established in ROADMAP.md: types → documents → codegen → parsers → services → keys → hooks → actions → playground
- Shared playground components already exist: `FilterFieldsRow`, `SortControls`, `ResultsList<T>`, `useFilterFields`, `ErrorAlert`, `RawJsonToggle`. New domains only need config arrays + a domain card component
- The `useInfiniteProfiles` pattern from Phase 8 is the reference for all `useInfinite*` implementations
- The profiles server action pattern (`'use server'` + `getServerUrl()` + thin call into node service) is the reference for all 10 domain actions
- All address comparisons use `_ilike` (case-insensitive), name sorts use `asc_nulls_last` / `desc_nulls_last`, search inputs have 300ms debounce — carry these through all domains

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 09-remaining-query-domains_
_Context gathered: 2026-02-19_
