#!/bin/sh
set -eu

cd /app/packages/indexer-v3

case "${1:-indexer}" in
  indexer)
    exec node lib/app/index-events.js
    ;;
  metadata)
    exec node lib/app/process-metadata.js
    ;;
  migrate)
    exec node lib/app/migrate-database.js
    ;;
  hasura-apply)
    exec node lib/app/apply-hasura.js
    ;;
  check-database)
    exec node lib/app/check-database.js
    ;;
  check-network)
    exec node lib/app/check-network.js
    ;;
  probe-network)
    exec node lib/app/probe-network.js
    ;;
  compare-shadow)
    exec node lib/app/compare-shadow.js
    ;;
  observe-soak)
    exec node lib/app/observe-soak.js
    ;;
  *)
    exec "$@"
    ;;
esac
