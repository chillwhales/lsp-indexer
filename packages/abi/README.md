# ABI Package

This package contains the ABI (Application Binary Interface) definitions and related utilities used by LSP-Indexer. The ABIs define the contract interfaces for interacting with smart contracts on the blockchain.

## Features

- Custom ABI JSON files for various smart contracts
- Scripts for code generation from ABI definitions
- Utility functions for working with ABI data

## File Structure

- `custom/`: Contains custom ABI JSON files
- `scripts/`: Scripts for generating and managing ABI files
- `src/`: Generated source code for ABI-related utilities
- `lib/`: Compiled code from `src/`

## Usage

1. Install dependencies:

   ```
   pnpm install
   ```

2. Generate TypeScript bindings (if needed):

   ```
   pnpm codegen
   ```

3. Import and use the generated ABI interfaces in your project.

## Contributing

Please see the main repository's [CONTRIBUTING.md](https://github.com/chillwhales/lsp-indexer/blob/main/CONTRIBUTING.md) for guidelines on how to contribute to this package.
