FROM node:22-alpine AS base

# needed because @chillwhales/chill-shop-contracts is privaye
ARG NODE_AUTH_TOKEN
RUN export NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN

# Install dependencies 
RUN apk add --no-cache git

WORKDIR /app
COPY . .

# Build the packages
RUN corepack enable pnpm && pnpm install
RUN pnpm build

ARG DB_URL
RUN export DB_URL=$DB_URL

# Setup the database
RUN pnpm migration:generate
RUN pnpm migration:apply

CMD ["pnpm", "start"]
