# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 9 restructured into 10 sub-phases (9.1–9.10, including 9.4 Conditional Include Types)

## Current Position

- **Phase:** 9 of 11 (Remaining Query Domains + DX — 10 sub-phases)
- **Sub-phase:** 9.4 (Conditional Include Types) — Plan 02 of 5 complete
- **Status:** In progress — Profile + Digital Assets conditional include types done
- **Last activity:** 2026-02-22 — Completed 09.4-02-PLAN.md (Digital Assets conditional include types)
- **Progress:** █████░░░░░ 48% (14/29 requirements)

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped    |
| --------- | ------ | ----- | ------------ | ---------- |
| v1.0      | 11     | 36    | 45/45        | 2026-02-16 |

Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

## v1.1 Progress

| Phase | Name                               | Requirements | Status                  |
| ----- | ---------------------------------- | :----------: | ----------------------- |
| 7     | Package Foundation                 |     7/7      | Complete                |
| 8     | First Vertical Slice (Profiles)    |     3/3      | Complete                |
| 9.1   | Digital Assets                     |     1/1      | Complete                |
| 9.2   | NFTs                               |     1/1      | Complete                |
| 9.3   | Owned Assets                       |     1/1      | Complete                |
| 9.4   | Conditional Include Types          |      1       | In progress (2/5 plans) |
| 9.5   | Social / Follows                   |      1       | Pending                 |
| 9.6   | Creators                           |      1       | Pending                 |
| 9.7   | Encrypted Assets                   |      1       | Pending                 |
| 9.8   | Encrypted Feed                     |      1       | Pending                 |
| 9.9   | Data Changed Events                |      1       | Pending                 |
| 9.10  | Universal Receiver Events          |      1       | Pending                 |
| 10    | Subscriptions                      |      3       | Pending                 |
| 11    | Server Actions & Publish Readiness |      4       | Pending                 |

_Note:_ Phase 9 has 11 requirements total: 9 QUERY requirements (one per domain sub-phase), DX-04 (conditional include types), plus PAGE-01 which is delivered incrementally across all sub-phases and counted once globally.

**Total:** 14/29 requirements delivered (FOUND-01–07, QUERY-01, QUERY-02, QUERY-03, QUERY-04, DX-01, DX-02, PAGE-01 incremental)

## Performance Metrics

- **Plans completed:** 62 (36 v1.0 + 26 v1.1)
- **Plans failed:** 0
- **Phases completed:** 16 (11 v1.0 + 5 v1.1)
- **Requirements delivered:** 45/45 (v1.0), 14/29 (v1.1)

## Accumulated Context

### Key Decisions

See `.planning/PROJECT.md` Key Decisions table for full record.

**v1.1 decisions:**

- 4 packages: `@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next` in lsp-indexer monorepo
- Three consumption patterns: queries (TanStack Query via `@lsp-indexer/react`), subscriptions (graphql-ws), server actions (`'use server'` via `@lsp-indexer/next`)
- GraphQL codegen from Hasura schema, types committed to `packages/node`
- **Branch workflow: ALL v1.1 work merges via PRs to `refactor/indexer-v2-react`** — see PROJECT.md "Branching & PR Workflow" for full protocol
- Reference: `chillwhales/marketplace` graphql package and web hooks (being standardized)
- Vertical-slice approach: build Universal Profiles end-to-end first, then replicate across 10 domains
- Minimal runtime deps — only `graphql-ws` for subscriptions; typed fetch wrapper for queries (zero query deps)
- 4 separate packages replace old multi-entry-point approach: `@lsp-indexer/types` (was `/types`), `@lsp-indexer/node` (was `/server`), `@lsp-indexer/react` (hooks), `@lsp-indexer/next` (server actions)
- Parser layer transforms Hasura snake_case → clean camelCase types
- `graphql-ws` for WebSocket subscriptions (Hasura supports natively)
- `graphql` is devDependency only (codegen build-time, not shipped)
- Phase numbering continues from v1.0: Phases 7–11
- schema.graphql auto-generated from Hasura introspection via `pnpm schema:dump` (full 25k-line schema, not hand-maintained)
- Exports map uses split import/require conditions with separate .d.ts/.d.cts types
- typesVersions used for node10 resolution fallback
- treeshake disabled on tsup entries to preserve "use client" banner
- React 19 removes global JSX namespace — use React.ReactNode return types in components
- outputFileTracingRoot needed in next.config.ts for monorepo workspace root detection
- **UI: Always use shadcn/ui components over custom components** — Tailwind CSS v4 + shadcn/ui (new-york style) is the standard for all UI in apps/test and future consumer apps. No inline styles, no custom components when a shadcn equivalent exists.
- Next.js 16 for test app (Turbopack default, React 19.2 canary features)
- Codegen always reads local schema.graphql (no env-var fallback branching)
- All image types (avatar, profileImage, backgroundImage) share ProfileImage interface with nullable width/height
- Structural interface for image parsing (avoids codegen \_\_typename incompatibility between profile_image and background_image)
- tokenOwned filter branches into owned_tokens (with tokenId) vs owned_assets (without tokenId)
- Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
- **4-package architecture:** `@lsp-indexer/types` (Zod schemas, zero deps) ← `@lsp-indexer/node` (services, parsers, documents, codegen, keys, execute, errors) ← `@lsp-indexer/react` (thin TanStack Query hooks) and `@lsp-indexer/node` ← `@lsp-indexer/next` (server actions + hooks)
- **No re-exports across packages — single source of truth.** Each export lives in exactly one package. Consumers import from the source: types from `@lsp-indexer/types`, services/errors/keys from `@lsp-indexer/node`, hooks from `@lsp-indexer/react` or `@lsp-indexer/next`. No convenience re-exports, no barrel forwarding between packages.
- **Server actions use `'use server'` directive** — Next.js-only, hence `@lsp-indexer/next` package name
- **Hasura uses camelCase field names** (lsp3Profile, followedBy, ownedAssets) — not snake_case. Schema.graphql updated to match.
- **All address/tokenId comparisons use `_ilike`** for case-insensitive matching (EIP-55 mixed-case prevention)
- **Name sort uses `asc_nulls_last` / `desc_nulls_last`** — profiles without names sort last
- **Search inputs have 300ms debounce** — prevents excessive GraphQL queries
- **Labels on top of inputs** — not beside (consistent with shadcn form patterns)
- **Shared playground components** in `components/playground/` — FilterFieldsRow, SortControls, ResultsList<T>, useFilterFields, ErrorAlert, RawJsonToggle. New domains only need config arrays + domain card component.
- **Digital asset standard derivation:** parser derives `standard` from `decimals` field (3-state: undefined = not included → null, null = LSP8, value = LSP7)
- **tokenType raw mapping:** Hasura stores "0"/"1"/"2" strings → parser maps to TOKEN/NFT/COLLECTION
- **holderAddress filter:** maps to `ownedAssets.owner._ilike` (token holders via owned_asset.owner direct address field)
- **createdAt sort:** maps to `owner.timestamp` (contract owner timestamp = asset creation time, LOCKED)
- **@lukso/lsp4-contracts removed:** constants inlined in parser — dep was only needed for 3 integer values
- **SortNulls type + orderDir() helper:** `SortNulls = 'first' | 'last' | 'default'` in common.ts; `orderDir(direction, nulls)` maps to `asc_nulls_last` etc. — wired through all sort builders
- **Array fields `T[] | null`:** null = field not included in query, [] = fetched but empty — clean semantic distinction for include toggles
- **`export *` barrel pattern:** all package index.ts files use `export *` from domain files — eliminates per-export maintenance
- **`escapeLike` shared utility:** extracted to `packages/node/src/services/utils.ts` — applied to all string filter fields to prevent PostgreSQL LIKE wildcard injection (escapes `\`, `%`, `_`)
- **`numericToString` parser util:** in `packages/node/src/parsers/utils.ts` — safe Hasura `numeric` scalar handling (codegen types as string)
- **`formatTokenAmount` BigInt arithmetic:** `apps/test/src/lib/utils.ts` — avoids Number precision loss on uint256 values (bigintFixed, bigintCompact helpers)
- **Extracted domain card components:** `DigitalAssetCard`, `ProfileCard` as separate files in `apps/test/src/components/` — pages import, not define
- **`FilterFieldConfig.options[]`:** renders shadcn Select for enum fields (tokenType filter) — prevents invalid free-text values
- **Shared `parseImage` in `parsers/utils.ts`:** cross-domain LSP4 metadata image parsing — returns `Lsp4Image`, used by digital-assets and nfts parsers (no duplication)
- **NFT composite detail key:** `nftKeys.detail(address, tokenId)` — NFTs identified by (collectionAddress, tokenId) pair, not single address
- **Boolean filter `!== undefined` guard:** `isBurned`/`isMinted` filters use `!== undefined` to allow explicit `false` filtering
- **NFT lsp4Metadata + lsp4MetadataBaseUri dual sources:** parser checks direct metadata first → baseUri fallback second → null. Both are `lsp4_metadata` type with identical structure.
- **NFT holder vs owner:** `ownedToken.owner` = token holder (current possessor), NOT contract owner. Renamed to `holder`/`NftHolder` throughout for semantic clarity.
- **NFT collection = full DigitalAsset:** `digitalAsset` relation on NFT provides 20+ fields. Reuses `parseDigitalAsset` from digital-assets parser. `include.collection` is `DigitalAssetInclude` (17 sub-include variables).
- **NFT single lookup: tokenId OR formattedTokenId:** Not both required. Stacked vertical inputs in playground.
- **NFT name filter \_or search:** Name searches both `lsp4Metadata.name.value._ilike` and `lsp4MetadataBaseUri.name.value._ilike` using Hasura `_or` in where clause.
- **OwnedAsset.balance = z.bigint():** Hasura numeric → parser converts to BigInt. Consumer uses formatTokenAmount helpers.
- **OwnedAssetFilter: 4 string fields (owner, address, digitalAssetId, universalProfileId):** Balance/timestamp range filters deferred.
- **OwnedAssetSortField nested sorts:** `digitalAssetName` → `digitalAsset.lsp4TokenName`, `tokenIdCount` → `tokenIds_aggregate.count` at service layer.
- **Nested universalProfile: all LSP3 fields, no aggregates:** follower/following counts excluded from ownership context.
- **Cross-domain parser `as any` casts:** Nested sub-selections in owned_asset/owned_token documents omit fields (like `id`) that primary parsers expect. Safe because all parsers use optional chaining. Standard pattern for sub-selections.
- **Owned asset DA include vars reused directly:** Unlike NFT (prefixed `includeCollection*`), owned asset/token documents use same `include*` var names as DA document, so `buildDigitalAssetIncludeVars` output used directly.
- **Natural key lookup for playground single tab:** Uses holder+asset address via `useOwnedAssets({ filter, limit: 1 })` instead of opaque Hasura IDs — more developer-friendly
- **Preload prevention via limit:0:** When no query present, pass `limit: 0` to prevent hooks from firing on empty filter
- **Full addresses, no truncation:** Display full hex addresses with `break-all` CSS wrapping — user preference
- **Unified ghost Button collapsible triggers:** All card collapsible sections use `<Button variant="ghost" size="sm">` with icon + text + ChevronDown, matching RawJsonToggle style
- **NFT holder UP as full block:** ownedToken.universalProfile fetched as complete block (not per-field @include), parsed via `parseHolderProfile()` inline helper
- **NftCard section order:** Holder Profile → NFT Metadata → Collection (collection moved to last per user preference)
- **OwnedTokenNftIncludeSchema:** 8 per-field `@include` toggles for NFT metadata (NftInclude minus collection/holder which are sibling relations)
- **Conditional include types (DX-04):** Hook return types should be narrowed by `include` parameter — excluded fields absent from type, not `null`. Prisma-style `select`/`include` inference. Nested includes narrow recursively. Default (no include) returns full type. Research-first approach: design spike before implementation plans.
- **`IncludeResult<Full, Base, Map, I>` utility type:** Core type algebra in `include-types.ts` — maps include params to narrowed domain types. Uses `ActiveFields` helper with conditional mapped types. `const I` generic param preserves literal type inference.
- **`stripExcluded` runtime utility:** `parsers/strip.ts` — ensures Object.keys only returns included fields at runtime. Accepts `derivedFields` map for cross-field dependencies (e.g., digital asset `standard` derives from `decimals`).
- **`as ProfileResult<I>` cast pattern:** Service boundaries require explicit cast because parser returns full `Profile` type before runtime stripping. TypeScript can't infer `stripExcluded` narrows the type.
- **`DigitalAssetResult<I>` with `ResolveStandard<I>`:** Derived field pattern — `standard` follows `decimals` via intersection type `& ResolveStandard<NonNullable<I>>`. Runtime: `stripExcluded(result, include, ['address'], { standard: 'decimals' })`.
- **`as DigitalAssetResult<I>` cast pattern:** Same cast pattern as Profile — service boundaries cast parser output to narrowed generic type.

### Discovered Todos

_None currently._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-22
- **Activity:** Completed 09.4-02-PLAN.md (Digital Assets conditional include types)
- **Outcome:** `DigitalAssetResult<I>` type with standard↔decimals derivation, threaded through services/hooks/actions in all 4 packages. All builds pass.
- **Resume file:** None

### Context for Next Session

- **Phase 9.4 Plan 02 complete** — Digital Assets domain conditional include types implemented
- **Next step:** Plan 03 (NFTs + Owned Assets) — nested relation narrowing
  - NFTs: `NftResult<I>` with nested `collection` (DigitalAssetResult) and `holder` (profile) narrowing
  - Owned Assets: `OwnedAssetResult<I>` with nested `digitalAsset` and `universalProfile` narrowing
- **Patterns established:**
  - `IncludeResult<Full, Base, Map, I>` utility type in `include-types.ts`
  - `stripExcluded(obj, include, baseFields, derivedFields?)` in `parsers/strip.ts`
  - `const I extends XInclude | undefined = undefined` on all generic functions
  - `as XResult<I>` cast at service boundaries
  - `& { include?: I }` intersection for hook params
  - `ResolveStandard<I>` intersection type for derived fields (new in Plan 02)

---

_Last updated: 2026-02-22 — Completed 09.4-02-PLAN.md (Digital Assets conditional include types)_
