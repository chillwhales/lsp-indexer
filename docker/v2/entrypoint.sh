#!/bin/sh
set -e

echo "🚀 Indexer v2 starting..."

# Navigate to typeorm package to run migrations
cd /app/packages/typeorm

echo "📊 Generating database migrations from schema.graphql..."
pnpm migration:generate || {
  echo "ℹ️  No schema changes detected - skipping migration generation"
}

echo "📊 Applying database migrations..."
pnpm migration:apply

echo "✅ Database migrations applied successfully"

# Configure Hasura (always runs)
echo "🔧 Waiting for Hasura to be ready..."

# Wait for Hasura to be healthy (max 60 seconds)
HASURA_URL="${HASURA_GRAPHQL_ENDPOINT:-http://hasura:8080}"
HASURA_READY=0
for i in $(seq 1 60); do
  if wget --spider -q "$HASURA_URL/healthz" 2>/dev/null; then
    echo "✅ Hasura is ready"
    HASURA_READY=1
    break
  fi
  echo "⏳ Waiting for Hasura... ($i/60)"
  sleep 1
done

if [ "$HASURA_READY" -ne 1 ]; then
  echo "❌ Hasura was not ready after 60 seconds. Aborting."
  exit 1
fi

echo "🔧 Generating Hasura configuration..."
pnpm hasura:generate

echo "🔧 Applying Hasura metadata..."
pnpm hasura:apply

echo "✅ Hasura configured successfully"

# Navigate to indexer-v2 and start
cd /app/packages/indexer-v2

echo "🏃 Starting indexer..."
exec pnpm start:simple
