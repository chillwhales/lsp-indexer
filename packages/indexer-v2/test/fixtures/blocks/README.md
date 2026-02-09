# Block Fixtures for Integration Tests

Synthetic blockchain fixtures in Subsquid-compatible format for deterministic integration testing.

## Fixture Files

| File                 | Description                  | Events                                    |
| -------------------- | ---------------------------- | ----------------------------------------- |
| `transfer-lsp7.json` | LSP7 token transfer          | LSP7.Transfer                             |
| `transfer-lsp8.json` | LSP8 NFT transfer            | LSP8.Transfer                             |
| `multi-event.json`   | Multiple events in one block | LSP7.Transfer, DataChanged, LSP8.Transfer |

## About These Fixtures

These are **synthetic fixtures** designed to mimic the structure of real LUKSO blockchain blocks for testing purposes. They are NOT captured from actual mainnet blocks.

### Why Synthetic?

- Deterministic: Same input produces same results every test run
- Minimal: Only includes fields needed for testing (no network dependency)
- Privacy: No real addresses or transaction data
- Fast: No RPC calls or archive queries needed

### Structure

Each fixture follows Subsquid's `Context.blocks` structure with a **minimal subset of fields**:

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

**Note:** These fixtures omit some fields present in real Subsquid blocks (e.g., `header.id`, `log.id`, `log.block`, `getTransaction`). Tests should only rely on the fields present in these fixtures.

## Selection Criteria

**Critical path (happy path):**

- LSP7 transfer: Standard token transfer between two addresses
- LSP8 transfer: Standard NFT transfer between two addresses

**Edge cases:**

- Multi-event: Block with multiple LSP events (DataChanged + Transfer, etc.)

## Adding New Fixtures

1. Create a JSON file following the structure above
2. Use placeholder addresses/hashes (e.g., `0x123456...`)
3. Ensure correct topic0 values for event types (from @chillwhales/abi)
4. Save as JSON with descriptive filename
5. Update this README with description and event types
6. Add integration test in `test/integration/` that uses the fixture

## Notes

- Fixtures are version-controlled — no network dependency during tests
- Block format is a **minimal subset** of Subsquid's `Context.blocks` structure
- Addresses and hashes are synthetic placeholders
- Event topic0 values are real (from LUKSO LSP contracts)

---

## Capture Instructions (for real blocks)

If you need to capture real LUKSO mainnet blocks:

Use the Subsquid archive endpoint or LUKSO RPC:

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
