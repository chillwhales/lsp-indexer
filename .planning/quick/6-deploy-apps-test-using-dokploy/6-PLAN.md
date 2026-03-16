---
phase: quick-6
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/test/Dockerfile
  - apps/test/next.config.ts
  - apps/test/.dockerignore
autonomous: true
requirements: [DEPLOY-01]
must_haves:
  truths:
    - "Dockerfile builds the Next.js test app in a multi-stage pnpm monorepo setup"
    - "Built image runs with `next start` and serves the app on port 3000"
    - "All workspace dependencies (types, node, react, next) are resolved at build time"
    - "Environment variables are injectable at runtime (not baked in at build time)"
    - "WebSocket proxy starts alongside Next.js via instrumentation.ts on port 4000"
  artifacts:
    - path: "apps/test/Dockerfile"
      provides: "Multi-stage Docker build for Next.js standalone output in pnpm monorepo"
      min_lines: 60
    - path: "apps/test/.dockerignore"
      provides: "Excludes node_modules, .next, .git from Docker context"
      min_lines: 5
  key_links:
    - from: "apps/test/Dockerfile"
      to: "apps/test/next.config.ts"
      via: "output: standalone in next config enables self-contained build"
      pattern: "output.*standalone"
    - from: "apps/test/Dockerfile"
      to: "pnpm-workspace.yaml"
      via: "pnpm deploy --filter or workspace install for monorepo resolution"
      pattern: "pnpm.*install|pnpm.*deploy"
---

<objective>
Create a production Dockerfile for the `apps/test` Next.js app and document the Dokploy deployment configuration.

Purpose: Enable one-click deployment of the test app via Dokploy, with proper monorepo handling, standalone output, env var injection, and WebSocket proxy support.

Output:
- `apps/test/Dockerfile` — multi-stage build optimized for pnpm monorepo + Next.js standalone
- `apps/test/.dockerignore` — context exclusions
- Updated `apps/test/next.config.ts` — add `output: 'standalone'`
- Inline deployment guide as comments in the Dockerfile header
</objective>

<execution_context>
@/home/coder/.config/Claude/get-shit-done/workflows/execute-plan.md
@/home/coder/.config/Claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@apps/test/package.json
@apps/test/next.config.ts
@apps/test/tsconfig.json
@apps/test/src/instrumentation.ts
@apps/test/.env.example
@pnpm-workspace.yaml
@package.json
@docker/Dockerfile (reference — existing indexer Dockerfile pattern)

<interfaces>
<!-- Workspace dependency chain the Dockerfile must resolve -->

apps/test depends on (workspace:*):
  - @lsp-indexer/types  (packages/types)  — tsup build, ESM
  - @lsp-indexer/node   (packages/node)   — tsup build, ESM, depends on types
  - @lsp-indexer/react  (packages/react)  — tsup build, ESM, depends on node + types
  - @lsp-indexer/next   (packages/next)   — tsup build, ESM, depends on node + react + types, has ws dep

Also depends on npm packages:
  - @chillwhales/erc725, @chillwhales/lsp1 (published to npm, not workspace)

Next.js config key details:
  - transpilePackages: ['@lsp-indexer/types', '@lsp-indexer/node', '@lsp-indexer/react', '@lsp-indexer/next']
  - outputFileTracingRoot: resolve(import.meta.dirname, '../../')  ← monorepo root
  - env: { NEXT_PUBLIC_INDEXER_URL, NEXT_PUBLIC_INDEXER_WS_URL }  ← build-time inlined
  - pageExtensions: ['ts', 'tsx', 'md', 'mdx']  ← MDX support

Instrumentation (src/instrumentation.ts):
  - Starts WS proxy on port WS_PROXY_PORT (default 4000) at server startup
  - Imports from '@lsp-indexer/next/server' (needs ws package at runtime)

Environment variables needed at runtime:
  - NEXT_PUBLIC_INDEXER_URL    — Hasura GraphQL HTTP endpoint (client-side, build-time)
  - NEXT_PUBLIC_INDEXER_WS_URL — Hasura WS endpoint (client-side, build-time)
  - INDEXER_URL                — Hasura GraphQL HTTP endpoint (server-side, runtime)
  - INDEXER_WS_URL             — Hasura WS endpoint (server-side, runtime)
  - INDEXER_ALLOWED_ORIGINS    — CORS origins for WS proxy (runtime)
  - WS_PROXY_PORT              — WS proxy port, default 4000 (runtime)

CRITICAL: NEXT_PUBLIC_* vars are inlined at BUILD TIME by Next.js.
In Dokploy, these must be set as build args, not just runtime env vars.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add standalone output to Next.js config and create .dockerignore</name>
  <files>apps/test/next.config.ts, apps/test/.dockerignore</files>
  <action>
1. **Update `apps/test/next.config.ts`** — Add `output: 'standalone'` to the nextConfig object. This is REQUIRED for Docker deployment — it creates a self-contained `.next/standalone` directory with all dependencies bundled (no node_modules needed at runtime).

   The config should look like:
   ```ts
   const nextConfig: NextConfig = {
     output: 'standalone',
     pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
     // ... rest unchanged
   };
   ```

   NOTE: `outputFileTracingRoot: resolve(import.meta.dirname, '../../')` is already set correctly — this tells Next.js to trace dependencies from the monorepo root, which is essential for standalone output in a monorepo.

2. **Create `apps/test/.dockerignore`**:
   ```
   node_modules
   .next
   .git
   .gitignore
   *.md
   .env*
   !.env.example
   ```
  </action>
  <verify>
    Confirm `output: 'standalone'` is present in next.config.ts:
    `grep -q "output.*standalone" apps/test/next.config.ts && echo "OK" || echo "MISSING"`
    Confirm .dockerignore exists: `test -f apps/test/.dockerignore && echo "OK"`
  </verify>
  <done>next.config.ts has `output: 'standalone'`, .dockerignore excludes node_modules/.next/.git</done>
</task>

<task type="auto">
  <name>Task 2: Create multi-stage Dockerfile for apps/test with Dokploy deployment guide</name>
  <files>apps/test/Dockerfile</files>
  <action>
Create `apps/test/Dockerfile` — a multi-stage Docker build optimized for the pnpm monorepo. The Dockerfile header should contain a deployment guide as comments documenting how to configure Dokploy.

**Strategy: 4-stage build (base → deps → builder → runner)**

**Stage 1: base**
- `FROM node:22-alpine AS base`
- `RUN corepack enable pnpm`
- `WORKDIR /app`

**Stage 2: deps**
- Copy `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml` from monorepo root
- Copy `package.json` for each workspace package the test app needs:
  - `packages/types/package.json`
  - `packages/node/package.json`
  - `packages/react/package.json`
  - `packages/next/package.json`
  - `apps/test/package.json`
- `RUN pnpm install --frozen-lockfile`
- This stage caches dependencies separately from source code

**Stage 3: builder**
- Copy node_modules from deps stage (root + each package)
- Copy full source for workspace packages AND apps/test
- Build workspace packages first (order matters):
  ```
  RUN pnpm --filter=@lsp-indexer/types build && \
      pnpm --filter=@lsp-indexer/node build && \
      pnpm --filter=@lsp-indexer/react build && \
      pnpm --filter=@lsp-indexer/next build
  ```
- Then build the test app:
  ```
  # NEXT_PUBLIC_* vars must be available at build time
  ARG NEXT_PUBLIC_INDEXER_URL
  ARG NEXT_PUBLIC_INDEXER_WS_URL
  ENV NEXT_PUBLIC_INDEXER_URL=$NEXT_PUBLIC_INDEXER_URL
  ENV NEXT_PUBLIC_INDEXER_WS_URL=$NEXT_PUBLIC_INDEXER_WS_URL
  RUN pnpm --filter=test build
  ```

**Stage 4: runner**
- `FROM node:22-alpine AS runner`
- `WORKDIR /app`
- `ENV NODE_ENV=production`
- `RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs`
- Copy standalone output:
  ```
  COPY --from=builder /app/apps/test/.next/standalone ./
  COPY --from=builder /app/apps/test/.next/static ./apps/test/.next/static
  COPY --from=builder /app/apps/test/public ./apps/test/public
  ```
  Note: standalone output places the server.js at the monorepo root structure because of `outputFileTracingRoot`. The entry point will be at `apps/test/server.js`.
- `USER nextjs`
- `EXPOSE 3000 4000`
  - Port 3000: Next.js server
  - Port 4000: WebSocket proxy (from instrumentation.ts)
- `ENV PORT=3000 HOSTNAME="0.0.0.0"`
- `CMD ["node", "apps/test/server.js"]`

**Dockerfile header — Dokploy deployment guide (as comments):**
```
# ==============================================================================
# Dockerfile for apps/test (Next.js test/docs app)
# ==============================================================================
#
# DOKPLOY DEPLOYMENT GUIDE
# ========================
#
# 1. Create a new Application in Dokploy
#    - Source: Git (point to this repo)
#    - Build type: Dockerfile
#    - Dockerfile path: apps/test/Dockerfile
#    - Docker context: . (monorepo root — NOT apps/test)
#
# 2. Build Arguments (REQUIRED — these are baked into the JS bundle):
#    - NEXT_PUBLIC_INDEXER_URL=https://your-hasura.com/v1/graphql
#    - NEXT_PUBLIC_INDEXER_WS_URL=wss://your-hasura.com/v1/graphql
#
# 3. Environment Variables (runtime — set in Dokploy env section):
#    - INDEXER_URL=https://your-hasura.com/v1/graphql
#    - INDEXER_WS_URL=wss://your-hasura.com/v1/graphql
#    - INDEXER_ALLOWED_ORIGINS=https://your-domain.com
#    - WS_PROXY_PORT=4000 (optional, default 4000)
#
# 4. Port Configuration:
#    - Primary port: 3000 (Next.js)
#    - Additional port: 4000 (WebSocket proxy — needs separate port mapping
#      or a reverse proxy rule in Dokploy/Traefik)
#
# 5. Domain/SSL:
#    - Map your domain to port 3000 in Dokploy
#    - For WS proxy: either map a subdomain to port 4000, or configure
#      INDEXER_WS_URL to point to the server-side Hasura directly
#      (WS proxy is only needed for @lsp-indexer/next subscriptions)
#
# 6. Health Check:
#    - Dokploy can use: curl -f http://localhost:3000/ || exit 1
#
# Build locally: docker build -f apps/test/Dockerfile \
#   --build-arg NEXT_PUBLIC_INDEXER_URL=https://... \
#   --build-arg NEXT_PUBLIC_INDEXER_WS_URL=wss://... \
#   -t lsp-indexer-test .
#
# Run locally:  docker run -p 3000:3000 -p 4000:4000 \
#   -e INDEXER_URL=https://... \
#   -e INDEXER_WS_URL=wss://... \
#   lsp-indexer-test
# ==============================================================================
```

**IMPORTANT edge cases to handle:**
- The `@chillwhales/erc725` and `@chillwhales/lsp1` packages are published to npm (not workspace) — they'll be installed normally by pnpm
- The `@next/mdx` and `remark-gfm` plugins are needed at build time for MDX pages
- `outputFileTracingRoot` is set to `../../` (monorepo root), so standalone output preserves the monorepo directory structure. The server.js entry point will be at `apps/test/server.js` relative to the standalone root
- The `public` folder does NOT exist in apps/test (verified) — do NOT include `COPY --from=builder /app/apps/test/public ./apps/test/public`. If a public dir is added later, this line would need to be added back.
  </action>
  <verify>
    Build the Docker image (from monorepo root):
    `docker build -f apps/test/Dockerfile --build-arg NEXT_PUBLIC_INDEXER_URL=https://test.example.com/v1/graphql --build-arg NEXT_PUBLIC_INDEXER_WS_URL=wss://test.example.com/v1/graphql -t lsp-indexer-test . 2>&1 | tail -5`
    
    If build succeeds, verify standalone output exists:
    `docker run --rm lsp-indexer-test ls -la apps/test/server.js`
  </verify>
  <done>
    Dockerfile builds successfully from monorepo root. Image contains standalone Next.js server at apps/test/server.js. Header documents complete Dokploy configuration (build args, env vars, ports, domain setup). Image exposes ports 3000 (Next.js) and 4000 (WS proxy).
  </done>
</task>

</tasks>

<verification>
1. `docker build -f apps/test/Dockerfile --build-arg NEXT_PUBLIC_INDEXER_URL=https://test.example.com/v1/graphql --build-arg NEXT_PUBLIC_INDEXER_WS_URL=wss://test.example.com/v1/graphql -t lsp-indexer-test .` succeeds
2. `docker run --rm -p 3000:3000 -e INDEXER_URL=https://test.example.com/v1/graphql lsp-indexer-test` starts and serves on port 3000
3. `grep -q "output.*standalone" apps/test/next.config.ts` passes
4. Dockerfile header contains complete Dokploy deployment instructions
</verification>

<success_criteria>
- Dockerfile builds the test app in a multi-stage pnpm monorepo setup
- Standalone output produces a self-contained server.js
- NEXT_PUBLIC_* vars are injected as build args (not runtime)
- Server-side env vars (INDEXER_URL, etc.) work at runtime
- Dokploy guide covers: build type, context path, build args, env vars, ports, domain
- Image size is reasonable (< 300MB)
</success_criteria>

<output>
After completion, create `.planning/quick/6-deploy-apps-test-using-dokploy/6-SUMMARY.md`
</output>
