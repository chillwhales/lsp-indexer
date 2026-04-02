#!/bin/sh
set -e

cd /app/packages/indexer

echo "🏃 Starting indexer..."
exec pnpm start:simple
