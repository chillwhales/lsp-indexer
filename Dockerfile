FROM node:22-alpine AS base

ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN
ENV DB_URL=postgresql://postgres:postgres@postgres:5432/postgres

COPY . .
RUN corepack enable pnpm && pnpm install
RUN pnpm build
RUN pnpm migration:generate
RUN pnpm migration:apply

CMD ["pnpm", "start"]
