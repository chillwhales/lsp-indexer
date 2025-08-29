FROM node:22-alpine AS base

# Install dependencies 
RUN apk add --no-cache git

WORKDIR /app
COPY . .

# Build the packages
RUN corepack enable pnpm && pnpm install
RUN pnpm build
RUN chmod 755 start.sh

# CMD ["/bin/bash", "start.sh"]
ENTRYPOINT [ "sh", "-c" ]

# Run the script
CMD [ "./start.sh" ]
