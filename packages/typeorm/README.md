# TypeORM Package

This package contains the database schema and TypeORM configuration for LSP-Indexer. It defines the entity models and relationships used to store indexed blockchain data.

## Features

- TypeORM integration with PostgreSQL
- GraphQL schema generation from entities
- Migrations for database schema updates

## File Structure

- `src/`: Generated source code for TypeORM configurations and migrations
- `lib/`: Compiled code from `src/`
- `schema.graphql`: Generated GraphQL schema based on entity models

## Usage

1. Install dependencies:

   ```
   pnpm install
   ```

2. Set up the database connection by configuring the environment variables in `.env`

3. Run migrations to create/update the database schema:

   ```
   pnpm migration:generate
   pnpm migration:apply
   ```

4. Access the GraphQL API for querying indexed data

## Contributing

Please see the main repository's [CONTRIBUTING.md](https://github.com/chillwhales/lsp-indexer/blob/main/CONTRIBUTING.md) for guidelines on how to contribute to this package.
