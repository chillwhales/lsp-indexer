# ==============================================================================
# Multi-stage Dockerfile for indexer
# Optimized for production with proper layer caching and minimal image size
# ==============================================================================

FROM node:22-alpine AS base

# Install git (required for pnpm dependency resolution)
RUN apk add --no-cache git

# Enable pnpm
RUN corepack enable pnpm

WORKDIR /app

# ==============================================================================
# Stage 1: Dependencies
# Cache pnpm dependencies separately from source code
# ==============================================================================

FROM base AS deps

# Copy pnpm workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all package.json files for workspace resolution
COPY packages/abi/package.json ./packages/abi/
COPY packages/typeorm/package.json ./packages/typeorm/
COPY packages/indexer/package.json ./packages/indexer/

# Install all dependencies (production + dev for build)
# Using --no-frozen-lockfile temporarily until lockfile is updated locally
RUN pnpm install --no-frozen-lockfile

# ==============================================================================
# Stage 2: Build
# Compile TypeScript and generate code
# ==============================================================================

FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/abi/node_modules ./packages/abi/node_modules
COPY --from=deps /app/packages/typeorm/node_modules ./packages/typeorm/node_modules
COPY --from=deps /app/packages/indexer/node_modules ./packages/indexer/node_modules

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy source code for packages needed by indexer
COPY packages/abi ./packages/abi
COPY packages/typeorm ./packages/typeorm
COPY packages/indexer ./packages/indexer

# Build all packages
RUN pnpm --filter=@chillwhales/abi build && \
    pnpm --filter=@chillwhales/typeorm build && \
    pnpm --filter=@chillwhales/indexer build

# ==============================================================================
# Stage 3: Runtime
# Minimal production image with only runtime dependencies
# ==============================================================================

FROM base AS runner

WORKDIR /app

# Copy pnpm workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for workspace structure
COPY packages/abi/package.json ./packages/abi/
COPY packages/typeorm/package.json ./packages/typeorm/
COPY packages/indexer/package.json ./packages/indexer/

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/abi/lib ./packages/abi/lib
COPY --from=builder /app/packages/typeorm/lib ./packages/typeorm/lib
COPY --from=builder /app/packages/typeorm/schema.graphql ./packages/typeorm/
COPY --from=builder /app/packages/indexer/lib ./packages/indexer/lib

# Note: packages/typeorm/db is NOT copied - it's generated at runtime by TypeORM migrations
# The db/ directory is gitignored and created automatically by @subsquid/typeorm-store

# Copy runtime source files needed by ts-node
COPY --from=builder /app/packages/indexer/src ./packages/indexer/src
COPY --from=builder /app/packages/indexer/tsconfig.json ./packages/indexer/

# Install production dependencies only
# Using --no-frozen-lockfile temporarily until lockfile is updated locally
RUN pnpm install --prod --no-frozen-lockfile

# Copy entrypoint script for running migrations before starting indexer
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create logs directory with proper permissions
RUN mkdir -p /app/packages/indexer/logs && \
    chown -R node:node /app && \
    chown node:node /app/entrypoint.sh

# Switch to non-root user for security
USER node

# Set working directory to app root (entrypoint will cd to packages)
WORKDIR /app

# Environment variables (can be overridden by docker-compose)
ENV NODE_ENV=production \
    LOG_DIR=/app/packages/indexer/logs \
    INDEXER_ENABLE_FILE_LOGGER=true \
    LOG_LEVEL=info

# Health check - verify the indexer process is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD pgrep -f "ts-node.*lib/app/index.js" || exit 1

# Run migrations then start indexer
ENTRYPOINT ["/app/entrypoint.sh"]
