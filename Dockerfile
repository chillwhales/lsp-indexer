FROM node:22-alpine AS base

ENV NODE_AUTH_TOKEN
ENV DB_URL

RUN corepack enable pnpm && pnpm install
RUN pnpm build
RUN pnpm migration:generate
RUN pnpm migration:apply

CMD ["pnpm", "start"]
