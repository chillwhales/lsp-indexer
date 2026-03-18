# S03 UAT — AI Compatibility

**When to run:** After S03 is merged to main.  
**Who runs it:** Developer (3 minutes).

## Steps

1. Run `pnpm --filter docs generate:check` → exits 0 (sidecars up to date)
2. Run `pnpm --filter docs dev`
3. `curl -s http://localhost:3001/llms.txt | head -5` → returns `# @lsp-indexer` header
4. `curl -s http://localhost:3001/llms-full.txt | wc -l` → > 100 lines
5. `curl -s http://localhost:3001/llm/quickstart.md | head -3` → `# Quickstart` (no `---`)
6. Modify `content/docs/quickstart.mdx` (add a space), run `pnpm --filter docs generate:check` → exits 1 with "quickstart (needs update)"
7. Revert the change, run `pnpm --filter docs generate:check` → exits 0

## Pass Condition

All curl checks return expected content. Stale detection works correctly.
