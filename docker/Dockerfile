FROM node:22.15.0-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/comparison-tool/package.json ./packages/comparison-tool/package.json
COPY packages/indexer/package.json ./packages/indexer/package.json
COPY packages/indexer-v3/package.json ./packages/indexer-v3/package.json
COPY packages/next/package.json ./packages/next/package.json
COPY packages/node/package.json ./packages/node/package.json
COPY packages/react/package.json ./packages/react/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY apps/docs/package.json ./apps/docs/package.json

RUN pnpm install --filter @chillwhales/indexer-v3... --frozen-lockfile

FROM dependencies AS builder

COPY packages/indexer-v3 ./packages/indexer-v3

RUN pnpm --filter @chillwhales/indexer-v3 build

FROM base AS production-dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/indexer-v3/package.json ./packages/indexer-v3/package.json

RUN pnpm install --filter @chillwhales/indexer-v3 --prod --frozen-lockfile

FROM node:22.15.0-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/packages/indexer-v3/node_modules ./packages/indexer-v3/node_modules
COPY --from=builder --chown=node:node /app/packages/indexer-v3/lib ./packages/indexer-v3/lib
COPY --from=builder --chown=node:node /app/packages/indexer-v3/drizzle ./packages/indexer-v3/drizzle
COPY --from=builder --chown=node:node /app/packages/indexer-v3/hasura ./packages/indexer-v3/hasura
COPY --from=builder --chown=node:node /app/packages/indexer-v3/package.json ./packages/indexer-v3/package.json
COPY --chown=node:node docker/entrypoint.sh /app/entrypoint.sh

RUN chmod 0555 /app/entrypoint.sh

USER node

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["indexer"]
