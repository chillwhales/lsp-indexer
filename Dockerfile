FROM node:22-alpine AS base

# `NODE_AUTH_TOKEN` needed because @chillwhales/chill-shop-contracts is private
ARG DB_URL
ARG NODE_AUTH_TOKEN
ENV DB_URL=$DB_URL
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN

# Install dependencies 
RUN apk add --no-cache git

WORKDIR /app
COPY . .

# Build the packages
RUN corepack enable pnpm && pnpm install
RUN pnpm build

CMD [ "pnpm", "start" ]
