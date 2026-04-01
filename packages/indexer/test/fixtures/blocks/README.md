# Block Fixtures for Integration Tests

Synthetic block fixtures in Subsquid format for deterministic integration testing.

These fixtures use **real event topic0 hashes** from LUKSO LSP standards but **synthetic addresses, hashes, and block numbers** for simplicity and privacy. This approach ensures deterministic, fast tests without network dependencies while validating the pipeline structure and event processing logic.

## Fixture Files

| File                 | Description                  | Block Height | Events                                    |
| -------------------- | ---------------------------- | ------------ | ----------------------------------------- |
| `transfer-lsp7.json` | LSP7 token transfer          | 5234567      | LSP7.Transfer                             |
| `transfer-lsp8.json` | LSP8 NFT transfer            | 5234789      | LSP8.Transfer                             |
| `multi-event.json`   | Multiple events in one block | 5235012      | LSP7.Transfer, DataChanged, LSP8.Transfer |

## Fixture Structure

Fixtures use the Subsquid SDK's block format. Each fixture represents a single block with:

- Block header (height, hash, timestamp, parentHash) — synthetic values
- Logs array (address, topics, data, transactionHash, logIndex) — real topic0 hashes, synthetic addresses
- **Real elements:** Event topic0 hashes from the indexer's ABI codegen (LSP7, LSP8, DataChanged)
- **Synthetic elements:** Addresses (`0x1234...`, `0xdead...`), hashes, block numbers for privacy/simplicity

## Selection Criteria

**Critical path (happy path):**

- LSP7 transfer: Standard token transfer between two addresses
- LSP8 transfer: Standard NFT transfer between two addresses

**Edge cases:**

- Multi-event: Block with multiple LSP events (DataChanged + Transfer, etc.)

## Adding New Fixtures

1. Create synthetic block fixture matching Subsquid block structure
2. Use **real topic0 hashes** from the indexer's ABI codegen for event types
3. Use **synthetic addresses/hashes** for privacy (e.g., `0x1234...`, `0xabcd...`)
4. Save as JSON with descriptive filename
5. Update this README with fixture purpose and event types
6. Add integration test in `test/integration/` that uses the fixture

## Notes

- Fixtures are version-controlled — no network dependency during tests
- Block format matches Subsquid's `Context.blocks` structure
- **Synthetic data ensures privacy** — no real addresses or transaction data
- **Real topic0 hashes ensure accuracy** — events match actual LUKSO LSP standards

## Block Structure Format

Each JSON fixture follows this structure:

```json
{
  "header": {
    "height": NUMBER,
    "hash": "0x...",
    "timestamp": TIMESTAMP,
    "parentHash": "0x..."
  },
  "logs": [
    {
      "address": "0x...",
      "topics": ["0x...", "0x...", ...],
      "data": "0x...",
      "transactionHash": "0x...",
      "transactionIndex": NUMBER,
      "logIndex": NUMBER,
      "removed": false
    }
  ]
}
```
