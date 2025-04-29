FROM node:22-alpine AS base

# needed because @chillwhales/chill-shop-contracts is private
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN

# Install dependencies 
RUN apk add --no-cache git

WORKDIR /app
COPY . .

# Build the packages
RUN corepack enable pnpm && pnpm install
RUN pnpm build

CMD ["pnpm", "start"]
