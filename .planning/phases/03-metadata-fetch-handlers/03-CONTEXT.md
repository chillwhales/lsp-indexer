# Phase 3: Metadata Fetch Handlers - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

All three metadata standards (LSP3, LSP4, LSP29) are fetched from IPFS/HTTP, parsed into sub-entities, and persisted — with proper head-only gating and retry handling. The existing base handlers (lsp3Profile, lsp4Metadata, lsp29EncryptedAsset) already create main entities with `isDataFetched: false`. This phase builds the fetch handlers that consume those entities, fetch the JSON, and create sub-entities.

</domain>

<decisions>
## Implementation Decisions

### Sub-entity lifecycle

- Two distinct paths based on data value:
  - **Non-empty data value:** Decode URL → fetch at chain head → on success only, `queueClear()` old sub-entities then insert new ones. Stale sub-entities remain if fetch fails (stale data better than no data).
  - **Empty data value (`0x`):** Immediately `queueClear()` all sub-entities for that address + update main entity with `url: null`, `isDataFetched: false`. This is the explicit "metadata removed" path.
- Main metadata entity is never deleted — only updated. Null URL means nothing to fetch, backlog drain skips it.

### Fetch scope at chain head

- Match V1 behavior: at chain head (`isHead === true`), query DB for all `isDataFetched: false` entities up to a configurable limit (`FETCH_LIMIT`), not just entities in the current batch.
- Prioritization order: (1) unfetched with no errors, (2) retryable HTTP status codes (408, 429, 5xx), (3) retryable error codes (ETIMEDOUT, EPROTO).
- This drains the backlog accumulated during historical sync. Without it, metadata from historical sync would never be fetched.

### Error tracking on entities

- Match V1's per-entity error fields exactly: `fetchErrorMessage`, `fetchErrorCode`, `fetchErrorStatus`, `retryCount`.
- Worker pool handles retry within a single batch run (transient failures). Entity-level fields handle retry across batch runs over time. They are complementary.
- After `FETCH_RETRY_COUNT` attempts across batches, stop retrying that entity.
- On successful fetch: clear all error fields + set `isDataFetched: true`.

### Handler granularity

- One handler per metadata standard: LSP3, LSP4, LSP29 (three separate handler files).
- Shared fetch utility function (e.g., `fetchAndPersistMetadata()` in `utils/`) handles the common flow: worker pool interaction, error tracking updates, `isHead` gating, `queueClear()` on success.
- Each handler provides its own parsing function and sub-entity type list to the shared utility.
- LSP4 has unique complexity: handles both DataChanged and TokenIdDataChanged triggers, BaseURI resolution for NFTs, Score/Rank extraction from attributes.

### Claude's Discretion

- Shared fetch utility internal structure and signature
- How to split worker pool requests across the three handlers (sequential vs. combined batch)
- Test structure and mock patterns for metadata fetch handlers
- Exact sub-entity parsing implementation (faithful port from V1 utils)

</decisions>

<specifics>
## Specific Ideas

- V1's spin-wait pattern (`while (count < expected) { await timeout(1000) }`) must NOT be replicated — the V2 MetadataWorkerPool already uses proper `Promise.all` resolution
- V1's LSP4 handler extracts Score and Rank from LSP4MetadataAttribute entries where `key === 'Score'` or `key === 'Rank'` — V2 must replicate this for data parity
- The existing `MetadataWorkerPool` TypeScript source is already complete with retry + exponential backoff — handlers should use it via `hctx.workerPool.fetchBatch()`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 03-metadata-fetch-handlers_
_Context gathered: 2026-02-09_
