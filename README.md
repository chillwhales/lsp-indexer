# LSP Indexer

The LSP Indexer is an open-source project designed to listen for important events on the LUKSO blockchain and extract valuable information from them. This indexer focuses on events like `DataChanged`, `Executed`, `UniversalReceiver`, `TokenIdDataChanged`, LSP7 & LSP8 `Transfer`, `Follow`, `Unfollow`, and decodes information such as `LSP3Profile`, `LSP4Metadata`, and more.

## What It Does

- Listens to important blockchain events
- Extracts and decodes valuable information from those events
- Indexes data for easy querying and analysis

## List of Events

The indexer listens for the following events:

- `Executed(uint256,address,uint256,bytes4)`
- `DataChanged(bytes32,bytes)`
- `UniversalReceiver(address,uint256,bytes32,bytes,bytes)`
- `Transfer(address,address,address,uint256,bool,bytes)` (LSP7 Transfer)
- `Transfer(address,address,address,bytes32,bool,bytes)` (LSP8 Transfer)
- `TokenIdDataChanged(bytes32,bytes32,bytes)`
- `Follow(address,address)`
- `Unfollow(address,address)`

## Installation

To get started with the LSP Indexer, follow these steps:

1. Clone the repository:

   ```
   git clone https://github.com/chillwhales/sqd-indexer.git
   cd sqd-indexer
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Set up environment variables by copying `.env.example` to `.env` and filling in the required values.

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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
