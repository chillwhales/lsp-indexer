FROM node:22-alpine AS base

# needed because @chillwhales/chill-shop-contracts is privaye
ARG NODE_AUTH_TOKEN
RUN export NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN

# Install dependencies only when needed
RUN apk add --no-cache git

# Get the monorepo
COPY . .

# Build the packages
RUN corepack enable pnpm && pnpm install
RUN pnpm build

# Setup the database
RUN pnpm migration:generate
RUN pnpm migration:apply

CMD ["pnpm", "start"]
