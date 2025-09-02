# Indexer Package

The indexer is the core component of LSP-Indexer that processes blockchain data and indexes it into a database for easy querying. This package contains all the logic for scanning, processing, and storing on-chain events.

## Features

- Blockchain event scanning and processing
- Entity-relationship mapping between smart contracts and their data
- TypeORM integration for database operations
- Extensible processor and scanner architecture

## File Structure

- `src/`: Source code for the indexer logic
- `lib/`: Compiled code from `src/`
  - `app/`: Main application components (processor, scanner)
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions for various operations
  - `model.ts`: Database entity models

## Usage

1. Install dependencies:

   ```
   pnpm install
   ```

2. Set up the database connection by configuring the environment variables in `.env`

3. Run the indexer:

   ```
   pnpm start
   ```

4. Access the indexed data via GraphQL queries (configured through TypeORM)

## Contributing

Please see the main repository's [CONTRIBUTING.md](https://github.com/chillwhales/lsp-indexer/blob/main/CONTRIBUTING.md) for guidelines on how to contribute to this package.
