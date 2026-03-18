# S01 UAT — Rename apps/test → apps/docs

**When to run:** After S01 is merged to main.  
**Who runs it:** Developer (30 seconds).

## Steps

1. Confirm `apps/test` does not exist: `ls apps/test` → should return "No such file or directory"
2. Confirm `apps/docs` exists: `ls apps/docs` → lists files
3. Run `pnpm --filter docs build` → exits 0
4. Run `pnpm --filter docs dev` → starts on port 3001 (or whatever the default is)
5. Open `http://localhost:3001/profiles` → playground page loads normally
6. Open `http://localhost:3001/docs/quickstart` → docs page loads normally
7. Check `apps/docs/docker-compose.yml` — service name is `docs-app`, dockerfile is `apps/docs/Dockerfile`

## Pass Condition

All steps complete without errors. `apps/test` is gone. Build and dev server work normally.
