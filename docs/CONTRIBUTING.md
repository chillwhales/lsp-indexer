# Contributing to LSP Indexer

Thank you for considering contributing to the LSP Indexer! We welcome all types of contributions, including bug reports, feature requests, documentation improvements, and code changes.

## Setting Up the Development Environment

1. Clone the repository:

   ```
   git clone https://github.com/chillwhales/lsp-indexer.git
   cd lsp-indexer
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Set up environment variables by copying `.env.example` to `.env` and filling in the required values.

## Project Structure

The LSP Indexer is a monorepo organized into several packages:

- `packages/abi/`: Contains ABI definitions for smart contracts.
- `packages/indexer/`: The main indexer package that listens to blockchain events.
- `packages/typeorm/`: TypeORM setup and database schema.

Each package has its own `package.json` and TypeScript configuration. The main entry point is in `packages/indexer/src/app/index.ts`.

## Common Workflows

### Building the Project

To build all packages:

```
pnpm build
```

### Running Migrations

For a fresh database, run:

```
pnpm migration:generate
pnpm migration:apply
```

### Starting the Indexer

To start listening for blockchain events:

```
pnpm start
```

## Coding Standards

- Follow TypeScript best practices
- Use consistent naming conventions
- Write clear, concise comments when necessary
- Ensure all new code is properly tested
- This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Please follow this format for your commit messages.

## Pull Request Process

1. Fork the repository and create a new branch for your changes.
2. Make your changes and commit them with clear, descriptive messages following the Conventional Commits format.
3. Push your changes to GitHub and open a pull request against the main branch.
4. Your pull request will be reviewed by maintainers, who may suggest changes or improvements.

## Reporting Issues

Please report all issues on the [GitHub issue tracker](https://github.com/chillwhales/lsp-indexer/issues). When reporting bugs, please include:

- A clear and descriptive title
- Steps to reproduce the bug
- The expected behavior
- The actual behavior
- Any relevant logs or error messages

## Feature Requests

We welcome feature requests! To request a new feature:

1. Open an issue on GitHub with a clear description of the feature.
2. Explain why this feature would be useful.

## Thank You!

Thank you for contributing to LSP Indexer!
