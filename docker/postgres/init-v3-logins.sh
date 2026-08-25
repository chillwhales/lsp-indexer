#!/bin/sh
set -eu

create_or_update_login() {
  role=$1
  credential=$2

  if [ -z "$role" ] || [ -z "$credential" ]; then
    echo 'Database login names and passwords must not be empty' >&2
    exit 1
  fi

  psql --set=role="$role" --set=credential="$credential" <<'SQL'
SELECT format(
  'CREATE ROLE %I LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
  :'role',
  :'credential'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role') \gexec

ALTER ROLE :"role"
  LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
  PASSWORD :'credential';
SQL
}

networks=$(printf '%s' "$DATABASE_MIGRATION_NETWORKS" | tr -d '[:space:]')
old_ifs=$IFS
IFS=,
for network in $networks; do
  case "$network" in
    lukso-mainnet)
      create_or_update_login \
        "$DATABASE_RUNTIME_LOGIN_LUKSO_MAINNET" \
        "$DATABASE_RUNTIME_PASSWORD_LUKSO_MAINNET"
      ;;
    ethereum-mainnet)
      create_or_update_login \
        "$DATABASE_RUNTIME_LOGIN_ETHEREUM_MAINNET" \
        "$DATABASE_RUNTIME_PASSWORD_ETHEREUM_MAINNET"
      ;;
    ethereum-sepolia)
      create_or_update_login \
        "$DATABASE_RUNTIME_LOGIN_ETHEREUM_SEPOLIA" \
        "$DATABASE_RUNTIME_PASSWORD_ETHEREUM_SEPOLIA"
      ;;
    *)
      printf 'Unsupported DATABASE_MIGRATION_NETWORKS entry: %s\n' "$network" >&2
      exit 1
      ;;
  esac
done
IFS=$old_ifs

create_or_update_login "$DATABASE_API_LOGIN" "$DATABASE_API_PASSWORD"
