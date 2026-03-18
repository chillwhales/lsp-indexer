# S04 UAT — context7.json + CI Sidecar Validation

**When to run:** After S04 is merged to main.  
**Who runs it:** Developer (2 minutes).

## Steps

1. `python3 -m json.tool apps/docs/public/context7.json` → exits 0, shows 5 pages
2. `pnpm --filter docs generate:check` → exits 0
3. Check `.github/workflows/ci.yml` contains a `docs-check` job with `pnpm --filter docs generate:check`
4. Modify `content/docs/quickstart.mdx` (add a space), run `pnpm --filter docs generate:check` → exits 1 naming "quickstart (needs update)"
5. Revert, rerun → exits 0

## Pass Condition

JSON is valid with 5 pages. generate:check passes. CI workflow has docs-check job. Stale detection works.
