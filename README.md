# LSP Indexer

The LSP Indexer is an open-source project designed to listen for important events on the LUKSO blockchain and extract valuable information from them. This indexer focuses on events like `DataChanged`, `Executed`, `UniversalReceiver`, `OwnershipTransferred`, `TokenIdDataChanged`, LSP7 & LSP8 `Transfer`, `Follow`, `Unfollow`, and decodes information such as `LSP3Profile`, `LSP4Metadata`, `LSP6Permissions` and more.

## 📁 Repository Structure

```
lsp-indexer/
├── packages/              # Monorepo packages
│   ├── abi/               # Contract ABIs (Subsquid typegen)
│   ├── typeorm/           # Database entities & migrations
│   ├── indexer/           # Indexer v1 (legacy, read-only)
│   └── indexer-v2/        # Indexer v2 (active development)
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # System architecture
│   ├── CONTRIBUTING.md    # Contribution guide
│   ├── AGENTS.md          # AI agent guidelines
│   └── docker/            # Docker deployment docs
│
├── docker/                # Docker configurations
│   ├── v1/                # Legacy setup (indexer v1)
│   └── v2/                # Current setup (indexer v2)
│
├── sql/                   # SQL resources
│   └── views/             # View definitions
│
├── .planning/             # GSD project planning
├── .github/               # GitHub Actions & workflows
├── scripts/               # Build & utility scripts
└── .env.example           # Environment template
```

This monorepo uses **pnpm workspaces** for package management. See [docs/](./docs/) for detailed documentation.

## 🚀 Quick Start

### Option 1: Docker (Recommended for Production)

```bash
# Setup
cd docker/v2
cp ../../.env.example ../../.env
nano ../../.env  # Set RPC_URL

# Start services
./docker-v2.sh start

# Monitor logs
./docker-v2.sh logs indexer-v2 all
```

See [docs/docker/QUICKSTART.md](./docs/docker/QUICKSTART.md) for details.

### Option 2: Local Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Setup environment
cp .env.example .env
nano .env  # Configure variables

# Run migrations
pnpm migration:generate
pnpm migration:apply

# Start indexer v2
pnpm start:v2
```

## 📦 Project Architecture

The project is organized into several packages that handle different aspects of the indexer's functionality:

- **abi** — ABI definitions for LUKSO smart contracts (LSP0-LSP8, etc.)
- **typeorm** — Database entities generated from `schema.graphql` and migrations
- **indexer** — Legacy indexer (v1) - read-only reference
- **indexer-v2** — Current indexer with plugin architecture (active development)

Each package has its own `package.json` file with dependencies and scripts. The project uses a monorepo structure managed by pnpm workspaces.

## What It Does

- Listens to important blockchain events
- Extracts and decodes valuable information from those events
- Indexes data for easy querying and analysis

## List of Events

The indexer listens for the following events:

- `Executed(uint256,address,uint256,bytes4)`
- `DataChanged(bytes32,bytes)`
- `UniversalReceiver(address,uint256,bytes32,bytes,bytes)`
- `OwnershipTransferred(address,address)`
- `TokenIdDataChanged(bytes32,bytes32,bytes)`
- `Transfer(address,address,address,uint256,bool,bytes)` (LSP7 Transfer)
- `Transfer(address,address,address,bytes32,bool,bytes)` (LSP8 Transfer)
- `Follow(address,address)`
- `Unfollow(address,address)`

## Installation

To get started with the LSP Indexer, follow these steps:

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

## Environment Variables

The following table lists the environment variables that can be configured for this project, along with their default values:

| Variable Name           | Description                                     | Default Value                                           |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `DB_URL`                | The PostgreSQL database URL                     | `postgresql://postgres:postgres@postgres:5432/postgres` |
| `SQD_GATEWAY`           | The Subsquid Gateway URL                        | `https://v2.archive.subsquid.io/network/lukso-mainnet`  |
| `RPC_URL`               | The RPC URL for EVM blockchain                  | `https://rpc.lukso.sigmacore.io`                        |
| `RPC_RATE_LIMIT`        | Rate limit for RPC calls (requests per seconds) | 10                                                      |
| `FINALITY_CONFIRMATION` | Confirmation threshold for finality (blocks)    | 75 (approximately 15 minutes to finality)               |
| `IPFS_GATEWAY`          | The IPFS Gateway URL                            | `https://api.universalprofile.cloud/ipfs/`              |
| `FETCH_LIMIT`           | Maximum number of items to fetch at once        | 10,000                                                  |
| `FETCH_BATCH_SIZE`      | Number of items per fetch batch                 | 1,000                                                   |
| `FETCH_RETRY_COUNT`     | Maximum retry attempts for fetching data        | 5                                                       |

## Usage

Before running the indexer, you need to build the project:

```
pnpm build
```

If you have a fresh database, you also need to run migrations:

```
pnpm migration:generate
pnpm migration:apply
```

To start the indexer, use the following command:

```
pnpm start
```

This will start the indexer, which will begin listening for events on the LUKSO blockchain.

## Contributing

We welcome contributions! Please see our [Contribution Guidelines](CONTRIBUTING.md) for more details.

## Troubleshooting

If you encounter issues while setting up or running the indexer, here are some common problems and their solutions:

1. **Missing environment variables**: Make sure all required environment variables in `.env` are set correctly. You can copy the example file using `cp .env.example .env`.

2. **Dependency issues**: If you have trouble installing dependencies, try deleting the `node_modules` directory and the lock files (`pnpm-lock.yaml`), then run `pnpm install` again.

3. **Database connection problems**: Ensure that your database is running and accessible at the URL specified in your environment variables.

4. **Migration errors**: If migrations fail, check the error message for clues. You might need to manually inspect or modify the generated migration files.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
