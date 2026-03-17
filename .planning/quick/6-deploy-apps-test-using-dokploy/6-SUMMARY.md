---
phase: quick-6
plan: 01
subsystem: deployment
tags: [docker, dokploy, next.js, standalone, monorepo]
dependency_graph:
  requires: []
  provides: [docker-image-apps-test, dokploy-deployment-guide]
  affects: [apps/test]
tech_stack:
  added: [multi-stage-docker-build, next-standalone-output]
  patterns: [pnpm-monorepo-docker, build-arg-injection]
key_files:
  created:
    - apps/test/Dockerfile
    - apps/test/.dockerignore
  modified:
    - apps/test/next.config.ts
decisions:
  - "4-stage Docker build (base → deps → builder → runner) for optimal layer caching"
  - "NEXT_PUBLIC_* vars as build args since Next.js inlines them at build time"
  - "No public/ dir COPY since apps/test has no public directory (commented out for future)"
  - "Frozen lockfile for reproducible builds (unlike indexer Dockerfile which uses --no-frozen-lockfile)"
metrics:
  duration: 7min
  completed: "2026-03-16"
---

# Quick Task 6: Deploy apps/test Using Dokploy — Summary

Multi-stage Docker build for the Next.js test/docs app with complete Dokploy deployment documentation, producing a 260MB production image with standalone output and WS proxy support.

## Task Results

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add standalone output + .dockerignore | 76b577e | apps/test/next.config.ts, apps/test/.dockerignore |
| 2 | Create multi-stage Dockerfile with Dokploy guide | 2ca20cf | apps/test/Dockerfile |

## What Was Built

### apps/test/next.config.ts
- Added `output: 'standalone'` — enables self-contained `.next/standalone` directory with all dependencies bundled (no node_modules needed at runtime)
- `outputFileTracingRoot` was already set to monorepo root (`../../`) — essential for standalone in monorepo

### apps/test/.dockerignore
- Excludes `node_modules`, `.next`, `.git`, `.gitignore`, `*.md`, `.env*` (keeps `.env.example`)

### apps/test/Dockerfile (143 lines)
4-stage multi-stage build optimized for pnpm monorepo:

1. **base** — `node:22-alpine` with pnpm enabled via corepack
2. **deps** — Copies only `package.json` files + lockfile, runs `pnpm install --frozen-lockfile` (cached layer)
3. **builder** — Copies node_modules from deps + full source, builds workspace packages in order (`types → node → react → next`), then builds test app with `NEXT_PUBLIC_*` build args
4. **runner** — Minimal `node:22-alpine` with standalone output, non-root user (`nextjs:1001`), exposes ports 3000 + 4000

**Dockerfile header** contains a complete Dokploy deployment guide covering:
- Build type, context path, Dockerfile path
- Required build args (`NEXT_PUBLIC_INDEXER_URL`, `NEXT_PUBLIC_INDEXER_WS_URL`)
- Runtime env vars (`INDEXER_URL`, `INDEXER_WS_URL`, `INDEXER_ALLOWED_ORIGINS`, `WS_PROXY_PORT`)
- Port configuration (3000 for Next.js, 4000 for WS proxy)
- Domain/SSL setup and health check endpoint
- Local build + run commands

## Verification Results

| Check | Result |
| ----- | ------ |
| `output: 'standalone'` in next.config.ts | ✅ Present |
| .dockerignore exists | ✅ Created |
| Docker build succeeds | ✅ Built successfully |
| `apps/test/server.js` in standalone | ✅ 7139 bytes |
| HTTP 200 on port 3000 | ✅ Verified |
| WS proxy starts on port 4000 | ✅ `[ws-proxy] WebSocket proxy listening on :4000` |
| Image size < 300MB | ✅ 260MB |
| Dockerfile > 60 lines | ✅ 143 lines |
| Dokploy guide in header | ✅ Complete (build args, env vars, ports, domain, health check) |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED
