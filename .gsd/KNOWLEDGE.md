# Knowledge

Append-only register of project-specific rules, patterns, and lessons learned.

---

## [2026-03-18] CRITICAL: PR-per-slice rule was ignored in M002 — do not repeat

### What happened

The M002 auto-mode session completed all 4 slices and then destroyed the review trail:

1. Used `gsd/M002/S01` as a single branch for ALL slices — wrong, should be `milestone/M002`
2. Ran `git merge --squash gsd/M002/S01` directly into local `main` — no PRs opened, no review
3. Ran `git branch -D gsd/M002/S01` — deleted the branch, made per-slice recovery impossible
4. Then in the recovery session: suggested "push to main" as an option — ALSO wrong, pushing to main directly is never permitted

### Why this is the worst possible outcome

- `preferences.md` is explicit: **one PR per slice, never merge without user review**
- Merging locally bypasses the entire review workflow
- Deleting the branch makes it unrecoverable — per-slice commit history is permanently lost
- Squashing all 4 slices into one commit destroys the audit trail for S01, S02, S03, S04
- Recovery required reconstructing a single milestone-level PR instead of 4 per-slice PRs — the user was shortchanged

### Root cause

The agent conflated "slice work is done" with "slice is landed". These are different things:

- **Slice done** = code written, verified, committed to `milestone/<MID>` branch
- **Slice landed** = user reviewed and merged the PR on GitHub

The agent is never permitted to perform the "landed" step. Only the user can do that.

### Hard rules — engrave these

1. **Never run `git merge` to land milestone work.** Not `merge`, not `merge --squash`, not `rebase`. Never.
2. **Never run `git push origin main`.** Main is only written by the user via GitHub merge.
3. **Never delete the milestone branch** until the user has merged and explicitly says to clean up.
4. **After every slice:** `git push origin milestone/<MID>` → `gh pr create -R owner/repo --base main`
5. **`risk:high` slices:** stop, open the PR, wait. Do not continue to the next slice.
6. **`risk:low`/`risk:medium` slices:** open the PR, then continue — PRs accumulate for async review.
7. **Verify the PR exists** with `gh pr list -R owner/repo` before moving to the next slice.

### What the correct M002 flow would have looked like

```
git checkout -b milestone/M002          # working branch
# ... S01 work ...
git push origin milestone/M002
gh pr create -R chillwhales/lsp-indexer --base main --title "feat(S01): Rename apps/test → apps/docs"
# ... S02 work (risk:high — STOP and wait for review/merge) ...
# user merges S01 PR
# ... continue S02 on milestone/M002 ...
git push origin milestone/M002
gh pr create -R chillwhales/lsp-indexer --base main --title "feat(S02): Migrate docs to Fumadocs"
# ... etc for S03, S04 ...
```

### Recovery

Once a squash-merge has landed and the branch is deleted, per-slice PR history cannot be recovered. A single milestone-level PR is the best available substitute.

## [2026-03-20] M004: Mutual follow hooks bypass fetchProfiles — pattern for multi-condition relationship queries

### Pattern

When a hook needs two simultaneous relationship filter conditions (e.g., "profiles followed by BOTH address A and address B"), the existing `fetchProfiles` helper cannot be used because it builds its own where-clause from `ProfileFilter`. Instead, call `execute()` directly with a composed `Universal_Profile_Bool_Exp` using `_and` + nested relationship filters.

This pattern was established in D004 and applies to any future hook that needs multi-condition relationship filters.

### Key detail

Mandatory params (no `= {}` default) are correct for intersection queries — calling `useMutualFollows()` without two addresses is nonsensical. This differs from `useProfiles()` which can be called with no filters. See D005.

### Fragility warning

The `_and` where-clause constructs `followedBy`/`followed` relationship names as string keys. If Hasura schema renames these relationships, queries return empty results silently (no GraphQL error). There is no compile-time protection for relationship field names inside `Universal_Profile_Bool_Exp`.

## [2026-03-21] M005: Batch tuple lookup pattern — _or/_and with existing query documents

### Pattern

When fetching entities by an array of unique compound keys (e.g., `(address, contentId, revision)` tuples), build `_or` with one `_and` per tuple and pass it to the existing query document. No new GraphQL document needed — just a dynamically composed where-clause.

This pattern is now used by two domains:
- `fetchIsFollowingBatch` (followers) — `_or` of `{ follower_address _ilike, following_address _ilike }` pairs
- `fetchEncryptedAssetsBatch` (encrypted assets) — `_or` of `{ address _ilike, content_id _eq, revision _eq }` tuples

### Key detail

Batch hooks use `useQuery` directly, not `createUseList` — batch results are finite (known tuple count) with no pagination or `totalCount`. The `enabled: tuples.length > 0` guard and a stable `EMPTY` array reference prevent unnecessary queries and re-renders.

### Reuse checklist for future batch domains

1. Add `BatchTupleSchema` + `UseBatchParamsSchema` to types package
2. Add `keys.batch(tuples, include?)` to key factory
3. Add `fetchXBatch` service with 3-overload include narrowing, empty-tuple short-circuit, `_or`/`_and` where-clause
4. Add `createUseXBatch` factory with direct `useQuery`, not `createUseList`
5. Add concrete React hook, Next.js server action + hook
6. Update barrel indexes in all packages

## [2026-03-30] M007: Collection-attributes simple-query pattern for non-paginated aggregate queries

### Pattern

When a domain needs a flat list of aggregate results (not paginated, not infinite-scrollable), use the "simple-query" pattern established by `useFollowCount` and now `useCollectionAttributes`:

1. Direct `useQuery` (not `createUseList`/`createUseInfinite`)
2. `enabled` guard on the primary parameter (e.g., `!!collectionAddress`)
3. `distinct_on` + matching `order_by` for Hasura deduplication
4. `_aggregate` in the same document for total count
5. Stable `EMPTY` array reference to prevent re-renders

This pattern is lighter than the paginated pattern and appropriate when the result set is bounded.

## [2026-03-30] M007: OwnedToken NFT sub-selection inherits NftInclude via .omit()

OwnedTokenNftIncludeSchema is defined as `NftIncludeSchema.omit({ collection: true, holder: true })`. When new fields are added to NftIncludeSchema, they automatically appear in OwnedTokenNftIncludeSchema. However, three things still need manual updates:

1. `OwnedTokenNftScalarFieldMap` — must add entries for new fields
2. Owned-token GraphQL documents — must add `$includeNft*` variable declarations and field selections
3. Codegen must be re-run after document changes

The `buildNftIncludeVars` function can serve both NFT and owned-token documents when the owned-token variables follow the `$includeNft*` prefix convention.

## [2026-04-01] M008: Package consolidation — ABI barrel skip-self guard pattern

### Pattern

When a codegen script generates a barrel file (`index.ts`) inside the same directory as the generated files it re-exports, the barrel must exclude itself from the glob to avoid circular re-exports. The `abi-codegen.sh` script in `packages/indexer/scripts/` writes to `src/abi/index.ts` and uses a skip-self guard:

```bash
for f in src/abi/*.ts; do
  [[ "$f" == "src/abi/index.ts" ]] && continue
  # ... export line
done
```

This pattern applies whenever a generated barrel lives alongside its exports rather than in a parent directory.

### Lesson: sed bulk import rewrites need two passes for multi-line imports

When rewriting imports with `sed` (e.g., `@chillwhales/typeorm` → `@/model`), single-line patterns can miss imports that span multiple lines. A second pass targeting just the string literal (not the full import statement) catches these cases.

### Lesson: Scope stale-reference cleanup by file type

When removing packages, scoping stale reference fixes to code files (ts/json/yaml) and deferring docs/config cleanup keeps the slice focused. Documentation references to removed packages are harmless and can be cleaned up separately.
