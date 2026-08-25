#!/usr/bin/env bash
set -Eeuo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
production=false

if [[ ${1:-} == '--production' ]]; then
  production=true
  shift
fi

command_name=${1:-help}
shift || true

if $production; then
  env_file=${LSP_INDEXER_ENV_FILE:-$script_dir/../.env.prod}
  compose_args=(
    -f "$script_dir/docker-compose.yml"
    -f "$script_dir/docker-compose.prod.yml"
    --env-file "$env_file"
  )
else
  env_file=${LSP_INDEXER_ENV_FILE:-$script_dir/../.env}
  compose_args=(-f "$script_dir/docker-compose.yml" --env-file "$env_file")
fi

compose() {
  docker compose "${compose_args[@]}" "$@"
}

require_env_file() {
  if [[ ! -f $env_file ]]; then
    printf 'Missing environment file: %s\n' "$env_file" >&2
    printf 'Copy .env.example there and configure it before starting the stack.\n' >&2
    exit 1
  fi
}

show_help() {
  cat <<'HELP'
Usage: ./manage.sh [--production] <command> [arguments]

Commands:
  start                 Build/pull and start the complete v3 stack
  stop                  Stop services without removing containers or volumes
  down                  Remove containers and networks; preserve volumes
  restart [service]     Restart the stack or one service
  status                Show service and one-shot job state
  logs [service]        Follow logs (default: indexer-lukso)
  build                 Build the local v3 image
  pull                  Pull production images
  migrate               Re-run the idempotent database migration
  hasura-apply          Re-apply and validate Hasura metadata
  health                Verify both indexers, both metadata workers, and Hasura
  db                    Open an interactive admin psql session
  db-dump [file]        Create a PostgreSQL custom-format backup
  config                Render and validate the merged Compose configuration

Development reads ../.env. --production reads ../.env.prod and combines the
base file with docker-compose.prod.yml.
HELP
}

case $command_name in
  start)
    require_env_file
    if $production; then
      compose pull
      compose up -d
    else
      compose up -d --build
    fi
    printf 'Hasura:  %s\n' "$(compose port hasura 8080)"
    printf 'Grafana: %s\n' "$(compose port grafana 3000)"
    ;;
  stop)
    require_env_file
    compose stop
    ;;
  down)
    require_env_file
    compose down --remove-orphans
    ;;
  restart)
    require_env_file
    if (($# > 0)); then
      compose restart "$1"
    else
      compose restart
    fi
    ;;
  status)
    require_env_file
    compose ps --all
    ;;
  logs)
    require_env_file
    compose logs --follow --tail=200 "${1:-indexer-lukso}"
    ;;
  build)
    require_env_file
    compose build
    ;;
  pull)
    require_env_file
    compose pull
    ;;
  migrate)
    require_env_file
    compose run --rm migration
    ;;
  hasura-apply)
    require_env_file
    compose run --rm hasura-apply
    ;;
  health)
    require_env_file
    compose ps --all
    for service in indexer-lukso metadata-lukso indexer-ethereum metadata-ethereum; do
      port=9090
      if [[ $service == metadata-* ]]; then port=9091; fi
      if compose exec -T "$service" node -e \
        "fetch('http://localhost:$port/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"; then
        printf '%s: healthy\n' "$service"
        continue
      fi

      container_id=$(compose ps --all --quiet "$service")
      if [[ -n $container_id ]] &&
        [[ $(docker inspect --format '{{.State.Status}}:{{.State.ExitCode}}' "$container_id") == exited:0 ]]; then
        printf '%s: completed bounded work successfully\n' "$service"
        continue
      fi

      printf '%s: unhealthy or failed\n' "$service" >&2
      exit 1
    done
    compose exec -T hasura curl --fail --silent http://localhost:8080/healthz >/dev/null
    printf 'hasura: healthy\n'
    ;;
  db)
    require_env_file
    compose exec postgres sh -c 'exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
    ;;
  db-dump)
    require_env_file
    destination=${1:-v3-backup-$(date -u +%Y%m%dT%H%M%SZ).dump}
    compose exec -T postgres sh -c \
      'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' >"$destination"
    printf 'Backup written to %s\n' "$destination"
    ;;
  config)
    require_env_file
    compose config
    ;;
  help|-h|--help)
    show_help
    ;;
  *)
    printf 'Unknown command: %s\n\n' "$command_name" >&2
    show_help >&2
    exit 1
    ;;
esac
