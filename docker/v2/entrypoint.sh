#!/bin/sh
set -e

echo "🚀 Indexer v2 starting..."

# Navigate to typeorm package to run migrations
cd /app/packages/typeorm

echo "📊 Applying database migrations..."
pnpm migration:apply

echo "✅ Migrations applied successfully"

# Navigate to indexer-v2 and start
cd /app/packages/indexer-v2

echo "🏃 Starting indexer..."
exec pnpm start:simple
