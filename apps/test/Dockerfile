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
#    - PORT=3000 (optional, default 3000 — Next.js server port)
#    - WS_PROXY_PORT=4000 (optional, default 4000 — WebSocket proxy port)
#
# 4. Port Configuration:
#    - Primary port: PORT env var, default 3000 (Next.js)
#    - Additional port: WS_PROXY_PORT env var, default 4000 (WebSocket proxy)
#    - Both are configurable — update Dokploy port mappings to match
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

# ---------------------------------------------------------------------------
# Stage 1: base — shared Node.js + pnpm base image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
RUN corepack enable pnpm
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: deps — install all dependencies (cached by lockfile)
# ---------------------------------------------------------------------------
FROM base AS deps

# Copy workspace config and lockfile first for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json for each workspace package the test app needs
COPY packages/types/package.json ./packages/types/
COPY packages/node/package.json ./packages/node/
COPY packages/react/package.json ./packages/react/
COPY packages/next/package.json ./packages/next/
COPY apps/test/package.json ./apps/test/

# Install all dependencies (dev + prod needed for build)
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: builder — build workspace packages then the Next.js app
# ---------------------------------------------------------------------------
FROM base AS builder

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/node/node_modules ./packages/node/node_modules
COPY --from=deps /app/packages/react/node_modules ./packages/react/node_modules
COPY --from=deps /app/packages/next/node_modules ./packages/next/node_modules
COPY --from=deps /app/apps/test/node_modules ./apps/test/node_modules

# Copy workspace config (needed for pnpm --filter commands)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy full source for workspace packages
COPY packages/types ./packages/types
COPY packages/node ./packages/node
COPY packages/react ./packages/react
COPY packages/next ./packages/next

# Copy full source for the test app
COPY apps/test ./apps/test

# Build workspace packages in dependency order
RUN pnpm --filter=@lsp-indexer/types build && \
    pnpm --filter=@lsp-indexer/node build && \
    pnpm --filter=@lsp-indexer/react build && \
    pnpm --filter=@lsp-indexer/next build

# NEXT_PUBLIC_* vars are baked into the client JS bundle at build time.
# INDEXER_URL is needed at build time because transpilePackages inlines
# process.env references — but it only runs server-side (via 'use server').
ARG NEXT_PUBLIC_INDEXER_URL
ARG NEXT_PUBLIC_INDEXER_WS_URL
ARG INDEXER_URL
ENV NEXT_PUBLIC_INDEXER_URL=$NEXT_PUBLIC_INDEXER_URL
ENV NEXT_PUBLIC_INDEXER_WS_URL=$NEXT_PUBLIC_INDEXER_WS_URL
ENV INDEXER_URL=$INDEXER_URL

# Build the Next.js test app (standalone output)
RUN pnpm --filter=test build

# ---------------------------------------------------------------------------
# Stage 4: runner — minimal production image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (preserves monorepo structure due to outputFileTracingRoot)
COPY --from=builder /app/apps/test/.next/standalone ./
COPY --from=builder /app/apps/test/.next/static ./apps/test/.next/static

# NOTE: apps/test/public does not exist currently. If a public/ directory is
# added later, uncomment the following line:
# COPY --from=builder /app/apps/test/public ./apps/test/public

USER nextjs

# Default ports (override via PORT / WS_PROXY_PORT env vars)
# Next.js server: PORT (default 3000)
# WebSocket proxy: WS_PROXY_PORT (default 4000, from instrumentation.ts)
EXPOSE 3000 4000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV WS_PROXY_PORT=4000

CMD ["node", "apps/test/server.js"]
