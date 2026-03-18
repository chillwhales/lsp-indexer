# GSD Preferences

## Task Isolation

```yaml
taskIsolation:
  mode: branch
```

## PR Strategy

- **Cadence:** One PR per slice
- **Flow:** After completing each slice, push the milestone branch and open a PR targeting `main`. Pause auto-mode and wait for user review/merge before continuing to the next slice.
- **Branch naming:** `milestone/<MID>` for the working branch, PR title includes slice ID and title
- **Never merge PRs without user review.**
- **Note:** `refactor/indexer-v2-react` is no longer used. All PRs target `main` directly.
