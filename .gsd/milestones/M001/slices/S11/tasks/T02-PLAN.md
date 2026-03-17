# T02: 07-package-foundation 02

**Slice:** S11 — **Milestone:** M001

## Description

Create a minimal Next.js test app (`apps/test`) that validates all 3 package entry points work correctly in a real framework context — catching bundle contamination, export resolution issues, and "use client" problems that unit tests cannot detect.

Purpose: The test app is the final validation layer for Phase 7. If `next build` succeeds with imports from all 3 entry points, the package foundation is solid. This app also serves as the dev playground for testing hooks in Phase 8+.

Output: A working Next.js 15 app that imports from `@lsp-indexer/react`, `@lsp-indexer/react/server`, and `@lsp-indexer/react/types` — validated by a successful `next build`.

## Must-Haves

- [ ] 'Developer can run `next build` in apps/test with zero errors'
- [ ] 'Developer can see imports from @lsp-indexer/react working in a client component'
- [ ] 'Developer can see imports from @lsp-indexer/react/server working in a server component'
- [ ] 'Developer can see type imports from @lsp-indexer/react/types resolving correctly'
- [ ] 'Developer can see a landing page with navigation links for future domain playgrounds'
- [ ] 'Developer can see connection status showing env var availability'

## Files

- `pnpm-workspace.yaml`
- `apps/test/package.json`
- `apps/test/tsconfig.json`
- `apps/test/next.config.ts`
- `apps/test/.env.local.example`
- `apps/test/src/app/layout.tsx`
- `apps/test/src/app/page.tsx`
- `apps/test/src/app/providers.tsx`
- `apps/test/src/components/nav.tsx`
- `apps/test/src/components/connection-status.tsx`
