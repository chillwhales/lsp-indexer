# Block Fixtures for Integration Tests

Real LUKSO blockchain blocks captured as JSON for deterministic integration testing.

## Fixture Files

| File                 | Description                  | Block Height | Events           |
| -------------------- | ---------------------------- | ------------ | ---------------- |
| `transfer-lsp7.json` | LSP7 token transfer          | TBD          | LSP7.Transfer    |
| `transfer-lsp8.json` | LSP8 NFT transfer            | TBD          | LSP8.Transfer    |
| `multi-event.json`   | Multiple events in one block | TBD          | Mixed LSP events |

## Capture Process

Fixtures are captured using the Subsquid SDK's block format. Each fixture represents a single block with:

- Block header (height, hash, timestamp, parentHash)
- Logs array (address, topics, data, transactionHash, logIndex)
- Transactions (optional, included if needed for context)

## Selection Criteria

**Critical path (happy path):**

- LSP7 transfer: Standard token transfer between two addresses
- LSP8 transfer: Standard NFT transfer between two addresses

**Edge cases:**

- Multi-event: Block with multiple LSP events (DataChanged + Transfer, etc.)

## Adding New Fixtures

1. Identify target block height on LUKSO mainnet
2. Use Subsquid archive or RPC to fetch block data
3. Save as JSON with descriptive filename
4. Update this README with block height and event types
5. Add integration test in `test/integration/` that uses the fixture

## Notes

- Fixtures are version-controlled — no network dependency during tests
- Block format matches Subsquid's `Context.blocks` structure
- For privacy: Do NOT include blocks with sensitive data or PII

---

## Capture Instructions

Use the Subsquid archive endpoint or LUKSO RPC to fetch blocks. Example using archive:

```bash
curl -X POST https://v2.archive.subsquid.io/network/lukso-mainnet \
  -H "Content-Type: application/json" \
  -d '{
    "type": "logs",
    "fromBlock": BLOCK_NUMBER,
    "toBlock": BLOCK_NUMBER,
    "logs": [{ "topic0": ["EVENT_TOPIC0"] }]
  }'
```

Then format as Subsquid block structure and save to this directory.

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
