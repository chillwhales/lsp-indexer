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
  echo "🔧 Hasura enabled - generating Hasura configuration..."
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
