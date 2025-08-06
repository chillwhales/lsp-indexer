FROM node:22-alpine AS base

# Install dependencies 
RUN apk add --no-cache git

WORKDIR /app
COPY . .

# Build the packages
RUN corepack enable pnpm && pnpm install
RUN chmod 755 scripts/start.sh

# CMD ["/bin/bash", "scripts/start.sh"]
ENTRYPOINT [ "sh", "-c" ]

# Run the script
CMD [ "scripts/start.sh" ]
