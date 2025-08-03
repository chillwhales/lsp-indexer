FROM node:22-alpine AS base

# Install dependencies 
RUN apk add --no-cache git

WORKDIR /app
COPY . .

# Build the packages
RUN corepack enable pnpm && pnpm install
RUN pnpm build

CMD ["pnpm", "start"]
