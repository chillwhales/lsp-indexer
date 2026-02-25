# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 9 restructured into 11 sub-phases (9.1–9.11, including 9.4 Conditional Include Types and 9.6 Generic Type Propagation)

## Current Position

- **Phase:** 9 of 11 (Remaining Query Domains + DX — 11 sub-phases)
- **Sub-phase:** 9.10 (Data Changed Events) — Complete
- **Plan:** 4 of 4 in current sub-phase
- **Status:** Phase 9.10 complete — ready for Phase 9.11 (Universal Receiver Events)
- **Last activity:** 2026-02-25 — Phase 9.10 verified (17/17 must-haves passed)
- **Progress:** ███████░░░ 70% (21/30 requirements)

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped    |
| --------- | ------ | ----- | ------------ | ---------- |
| v1.0      | 11     | 36    | 45/45        | 2026-02-16 |

Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

## v1.1 Progress

| Phase | Name                               | Requirements | Status   |
| ----- | ---------------------------------- | :----------: | -------- |
| 7     | Package Foundation                 |     7/7      | Complete |
| 8     | First Vertical Slice (Profiles)    |     3/3      | Complete |
| 9.1   | Digital Assets                     |     1/1      | Complete |
| 9.2   | NFTs                               |     1/1      | Complete |
| 9.3   | Owned Assets                       |     1/1      | Complete |
| 9.4   | Conditional Include Types          |     1/1      | Complete |
| 9.5   | Social / Follows                   |     1/1      | Complete |
| 9.6   | Generic Type Propagation           |     1/1      | Complete |
| 9.7   | Creators                           |     1/1      | Complete |
| 9.8   | Issued Assets                      |     1/1      | Complete |
| 9.9   | Encrypted Feed                     |     1/1      | Complete |
| 9.10  | Data Changed Events                |     1/1      | Complete |
| 9.11  | Universal Receiver Events          |      1       | Pending  |
| 10    | Subscriptions                      |      3       | Pending  |
| 11    | Server Actions & Publish Readiness |      4       | Pending  |

_Note:_ Phase 9 has 12 requirements total: 9 QUERY requirements (one per domain sub-phase), DX-04 (conditional include types), DX-05 (generic type propagation), plus PAGE-01 which is delivered incrementally across all sub-phases and counted once globally.

**Total:** 21/30 requirements delivered (FOUND-01–07, QUERY-01, QUERY-02, QUERY-03, QUERY-04, QUERY-05, QUERY-06, QUERY-07, QUERY-08, QUERY-09, DX-01, DX-02, DX-04, DX-05, PAGE-01 incremental)

## Performance Metrics

- **Plans completed:** 82 (36 v1.0 + 46 v1.1)
- **Plans failed:** 0
- **Phases completed:** 23 (11 v1.0 + 12 v1.1)
- **Requirements delivered:** 45/45 (v1.0), 21/30 (v1.1)

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
- **`NftResult<I>` with nested relation narrowing:** `ResolveNftCollection<I>` and `ResolveNftHolder<I>` intersection types use `I extends { field: infer C } ? C extends SubInclude ? { field: SubResult<C> | null } : {} : {}` pattern. Base fields: address, tokenId, isBurned, isMinted.
- **`OwnedAssetResult<I>` with nested relation narrowing:** `ResolveOwnedAssetDA<I>` and `ResolveOwnedAssetHolder<I>` intersection types. Base fields: id, digitalAssetAddress, holderAddress.
- **NftHolder = ProfileResult + timestamp:** Handled via `ProfileResult<H> & { timestamp: string }` intersection because NftHolder extends Profile with a timestamp.
- **Recursive nested stripping:** Parsers delegate to `parseDigitalAsset(raw, include?.collection)` and `parseProfile(raw, include?.holder)` with sub-include param — nested relations handled by their own parsers.
- **`OwnedTokenResult<I>` with 4 nested relation narrowing:** Most complex domain — `ResolveOwnedTokenDA<I>`, `ResolveOwnedTokenNft<I>`, `ResolveOwnedTokenOA<I>`, `ResolveOwnedTokenHolder<I>`. Custom scalar field maps for sub-domain contexts (OwnedTokenNftScalarFieldMap with 8 fields, OwnedTokenOwnedAssetFieldMap with 3 fields).
- **Sub-domain IncludeResult vs XResult:** NFT and OwnedAsset sub-contexts in owned-token use `IncludeResult<Nft/OwnedAsset>` directly (not `NftResult`/`OwnedAssetResult`) because collection/holder and digitalAsset/holder/tokenIdCount are unavailable in sub-selection context.
- **Card prop types as `Record<string, unknown>`:** Cards accept any subset of the full domain type. `'key' in obj` guards determine which sections render. Typed narrowing enforced at hook consumer level, not card level.
- **`as Record<string, unknown>` casts at page-card boundaries:** Pages cast narrowed `XResult<I>` types when passing to cards — single clean boundary between typed hook results and field-presence-based rendering.
- **Removed explicit `ResultsList<T>` generics:** Let TypeScript infer from `items` prop — avoids type mismatch when hooks return narrowed result types.
- **Follower domain `direction` param:** `fetchFollowers` accepts `direction: 'followers' | 'following'` to serve both useFollowers and useFollowing from a single service function. `direction: 'followers'` → `primaryField = 'followed_address'` (who follows X), `direction: 'following'` → `primaryField = 'follower_address'` (who X follows).
- **FollowerResult<I> with two profile sub-includes:** `ResolveFollowerProfile<I>` and `ResolveFollowedProfile<I>` intersection types narrow both nested profiles independently. Base fields: followerAddress, followedAddress.
- **buildFollowerIncludeVars prefix replacement:** Reuses `buildProfileIncludeVars` with `key.replace('includeProfile', 'includeFollowerProfile')` / `'includeFollowedProfile'` for nested profile variable mapping — same pattern as NFT collection.
- **FollowCount separate document:** `GetFollowCountDocument` uses two aliased `follower_aggregate` queries — one for follower count (where followed_address = X), one for following count (where follower_address = X).
- **fetchIsFollowing reuses list document:** No separate existence query — `GetFollowersDocument` with `limit: 1` and all includes disabled for minimal payload.
- **CreatorResult<I> with dual heterogeneous relation resolvers:** `ResolveCreatorProfile<I>` (ProfileResult) and `ResolveCreatorDigitalAsset<I>` (DigitalAssetResult) — each side independently narrowable. Base fields: creatorAddress, digitalAssetAddress.
- **Creator has no singular hook:** No natural key exists (opaque Hasura ID only) — only useCreators and useInfiniteCreators hooks
- **GetCreatorsDocument 31 include variables:** 3 scalar (arrayIndex, interfaceId, timestamp) + 10 creator profile ($includeCreatorProfile*) + 18 digital asset ($includeDigitalAsset\*) — all Boolean! = true defaults
- **Creator profile sub-fields:** followedBy_aggregate for follower count, following_aggregate for following count (matching established profile document pattern)
- **IssuedAssetResult<I> with ResolveIssuerProfile and ResolveIssuedAssetDigitalAsset:** Same dual heterogeneous relation pattern as Creator. Base fields: issuerAddress, assetAddress. Hasura uses `universalProfile` (not issuerProfile) and `issuedAsset` (not digitalAsset) — parser maps to domain names.
- **GetIssuedAssetsDocument 31 include variables:** 3 scalar (arrayIndex, interfaceId, timestamp) + 10 issuer profile ($includeIssuerProfile*) + 18 digital asset ($includeDigitalAsset\*) — all Boolean! = true defaults
- **Issuer profile uses `followed_aggregate`** (not `following_aggregate`) for following count — schema field name difference from other profile sub-documents
- **EncryptedAsset domain naming:** Type name `EncryptedAsset`, hooks `useEncryptedAssets`/`useInfiniteEncryptedAssets` — maps to Hasura `lsp29_encrypted_asset` table (rich metadata, NOT sparse `lsp29_encrypted_asset_entry`)
- **EncryptedAsset no singular hook:** No `useEncryptedAsset`. No reliable natural key exists (user-introduced elements can share address + contentId + revision) — same pattern as creators/issued assets
- **EncryptedAsset base fields:** `address`, `contentId`, `revision` — always present, everything else conditional via include
- **EncryptedAsset encryption sub-include:** `z.union([z.boolean(), EncryptedAssetEncryptionIncludeSchema])` — `true` = full with accessControlConditions, object `{ accessControlConditions: false }` = encryption scalars only, `false`/omitted = skip encryption
- **EncryptedAsset title/description flattening:** Hasura returns `{ title: { value: "..." } }` → parser flattens to `title: string | null`. Same for description.
- **LSP29 images separate from LSP4 images:** `EncryptedAssetImageSchema` has `imageIndex`, `verificationSource` fields that LSP4 images lack — separate schema and parser
- **ImageList reusable component:** Extracted duplicated image rendering from ProfileCard, DigitalAssetCard, NftCard. Accepts generic `{ url?: string | null; [key: string]: unknown }[]` shape. Backported to 3 existing cards.
- **EncryptedAsset numeric fields:** `array_index`, `file.last_modified`, `file.size`, `chunks.total_size` all Hasura `numeric` → `Number()` conversion in parser
- **EncryptedAsset 8 filter fields:** 3 nested relation filters (`universalProfile.lsp3Profile.name.value`, `encryption.method`, `file.type`), 1 numeric comparison (`file.size._gte`), 1 exact numeric (`revision._eq`), 1 timestamp (`_gte`), 2 string ilike
- **buildEncryptedAssetIncludeVars prefix replacement:** Reuses `buildProfileIncludeVars` with `key.replace('includeProfile', 'includeUniversalProfile')` — same prefix pattern as other domains with nested profiles
- **`followed_aggregate` for universalProfile following count:** Profile sub-document in encrypted assets uses `followed_aggregate` (matching issued assets pattern)
- **DataChangedEvent base fields:** address, dataKey, dataValue — dataKeyName is an includable field (parser-derived from resolveDataKeyName for known ERC725Y keys, null if unknown), NOT from Hasura
- **TokenIdDataChangedEvent base fields:** address, dataKey, dataValue, tokenId — dataKeyName is an includable field, same parser-derived resolution
- **TokenIdDataChangedEvent nft include:** `nft: z.union([z.boolean(), OwnedTokenNftIncludeSchema]).optional()` — accepts boolean for all fields or OwnedTokenNftInclude for per-field control. Full NftSchema used (not a lightweight sub-type)
- **Latest hooks for data changed events:** `useLatestDataChangedEvent` and `useLatestTokenIdDataChangedEvent` fetch most recent event by filter (timestamp desc, limit 1)
- **GetDataChangedEventsDocument 36 variables:** 4 pagination + 4 scalar + 10 UP ($includeUniversalProfile*) + 18 DA ($includeDigitalAsset\*)
- **GetTokenIdDataChangedEventsDocument 27 variables:** 4 pagination + 4 scalar + 18 DA ($includeDigitalAsset*) + 1 nft ($includeNft)
- **resolveDataKeyName utility:** In `@lsp-indexer/data-keys` package — reverse map from hex ERC725Y data key → human-readable name using 32 hardcoded built-in data keys. No @lukso/\* dependencies. Returns null for unknown keys. Prefix matching for array/mapping keys.
- **@lsp-indexer/data-keys package:** Standalone read-only registry with constants, registry, schemas (DataKeyNameSchema z.enum), types. Only dependency is zod.
- **NFT name filter in token-id-data-changed uses \_or pattern:** `{ nft: { _or: [{ lsp4Metadata: { name: { value: { _ilike } } } }, { lsp4MetadataBaseUri: { name: { value: { _ilike } } } }] } }` — matching nfts service pattern
- **Data changed event UP prefix: includeProfile* → includeUniversalProfile*:** Matching encrypted-assets pattern for nested UP sub-includes
  - **Data changed event DA prefix: include* → includeDigitalAsset*:** Matching issued-assets pattern for nested DA sub-includes
  - **dataKeyName display pattern:** Bold resolved name when known, "(Unknown Key)" in muted italic when null, raw hex truncated to 20 chars in mono below
  - **3-tab playground layout per domain:** Each domain has its own page (`/data-changed-events`, `/token-id-data-changed-events`) with 3 tabs (Latest, List, Infinite)
  - **nft include in scalar include array:** TokenIdDataChangedEvent nft is a boolean toggle in the playground UI (schema supports union type but playground uses simple on/off)

### Discovered Todos

_None currently._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-25
- **Activity:** Executed Phase 9.10 (Data Changed Events) — all 4 plans + verification
- **Outcome:** 4 plans, 12 commits, 17/17 must-haves verified. resolveDataKeyName utility (10 @lukso packages). Two domains (data_changed + token_id_data_changed). 4 React hooks + 2 server actions + 4 Next.js hooks. DataChangedEventCard + TokenIdDataChangedEventCard. Playground at /data-changed-events with 4 tabs. All packages build.
- **Resume file:** None

### Context for Next Session

- **Phase 9.10 complete** — all 4 plans delivered, QUERY-09 fulfilled, verified 17/17
- **Next step:** Phase 9.11 (Universal Receiver Events)
- **Remaining sub-phases in Phase 9:** 9.11 (Universal Receiver Events)

---

_Last updated: 2026-02-25 — Phase 9.10 complete (Data Changed Events — QUERY-09 delivered, verified 17/17)_
