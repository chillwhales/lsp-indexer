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
