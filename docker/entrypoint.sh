#!/bin/sh
set -e

echo "🚀 Indexer starting..."

# Navigate to indexer package to run migrations
cd /app/packages/indexer

echo "📊 Generating database migrations from schema.graphql..."
pnpm migration:generate || {
  echo "ℹ️  No schema changes detected - skipping migration generation"
}

echo "📊 Applying database migrations..."
pnpm migration:apply

echo "✅ Database migrations applied successfully"

# Run hand-written backfill migration (idempotent)
echo "📊 Running backfill migration..."
if [ -f /app/packages/typeorm/db/migrations/backfill-network.sql ]; then
  # Construct DB_URL from Subsquid env vars if not already set
  if [ -z "$DB_URL" ]; then
    DB_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  fi
  psql "$DB_URL" -f /app/packages/typeorm/db/migrations/backfill-network.sql
  echo "✅ Backfill migration applied"
else
  echo "ℹ️  No backfill migration found - skipping"
fi

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

# Navigate to indexer and start
cd /app/packages/indexer

echo "🏃 Starting indexer..."
exec pnpm start:simple
