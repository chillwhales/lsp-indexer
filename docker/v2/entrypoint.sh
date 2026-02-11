#!/bin/sh
set -e

echo "🚀 Indexer v2 starting..."

# Navigate to typeorm package to run migrations
cd /app/packages/typeorm

echo "📊 Generating database migrations from schema.graphql..."
pnpm migration:generate

echo "📊 Applying database migrations..."
pnpm migration:apply

echo "✅ Database migrations applied successfully"

# Configure Hasura if enabled
if [ "$ENABLE_HASURA" = "true" ]; then
  echo "🔧 Hasura enabled - waiting for Hasura to be ready..."
  
  # Wait for Hasura to be healthy (max 60 seconds)
  HASURA_URL="${HASURA_GRAPHQL_ENDPOINT:-http://hasura:8080}"
  for i in $(seq 1 60); do
    if wget --spider -q "$HASURA_URL/healthz" 2>/dev/null; then
      echo "✅ Hasura is ready"
      break
    fi
    echo "⏳ Waiting for Hasura... ($i/60)"
    sleep 1
  done
  
  echo "🔧 Generating Hasura configuration..."
  pnpm hasura:generate
  
  echo "🔧 Applying Hasura metadata..."
  pnpm hasura:apply
  
  echo "✅ Hasura configured successfully"
else
  echo "ℹ️  Hasura disabled (ENABLE_HASURA not set to 'true')"
fi

# Navigate to indexer-v2 and start
cd /app/packages/indexer-v2

echo "🏃 Starting indexer..."
exec pnpm start:simple
