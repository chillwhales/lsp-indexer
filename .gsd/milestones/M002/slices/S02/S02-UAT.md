# S02 UAT — Migrate Docs Section to Fumadocs

**When to run:** After S02 is merged to main.  
**Who runs it:** Developer (5 minutes).

## Steps

1. Run `pnpm --filter docs dev` — starts on port 3001
2. Navigate to `http://localhost:3001/docs/quickstart` — confirm:
   - Fumadocs sidebar visible on the left with 5 pages in correct order
   - Page title "Quickstart" renders with content
   - Search bar visible in the top nav
3. Navigate to `http://localhost:3001/docs/indexer` — confirm renders with mermaid code block
4. Navigate to `http://localhost:3001/profiles` — confirm:
   - Playground sidebar (domain navigation) visible
   - Page loads normally with hook playground UI
5. Toggle dark mode (if visible) — confirm theme switches correctly
6. Run `pnpm --filter docs build` — exits 0

## Pass Condition

Both `/docs/*` and playground routes load correctly. Fumadocs sidebar shows 5 pages in correct order. Playground sidebar unaffected.
