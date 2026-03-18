# GSD Preferences

## Task Isolation

```yaml
taskIsolation:
  mode: branch
```

## PR Strategy

- **Cadence:** One PR per slice
- **Flow:** After completing each slice, push the milestone branch and open a PR targeting `main`.
  - `risk:high` slices — pause auto-mode and wait for review/merge before continuing
  - `risk:low` / `risk:medium` slices — continue to the next slice automatically; PRs accumulate for async review
- **Branch naming:** `milestone/<MID>` for the working branch, PR title includes slice ID and title
- **Never merge PRs without user review.**
- **Note:** `refactor/indexer-v2-react` is no longer used. All PRs target `main` directly.
