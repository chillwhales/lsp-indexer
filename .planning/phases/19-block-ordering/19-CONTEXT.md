# Phase 19: Block Ordering - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `blockNumber`, `transactionIndex`, and `logIndex` columns to every indexed entity so each row carries its blockchain position for deterministic ordering. Update schema.graphql, all EventPlugins, all EntityHandlers, and the enrichment/verification pipeline. Does NOT include sorting logic in consumer packages (that's Phase 21).

</domain>

<decisions>
## Implementation Decisions

### Column design
- Non-nullable `Int` columns: `blockNumber`, `transactionIndex`, `logIndex`
- camelCase naming matching existing entity field conventions
- Every entity gets all 3 fields — no exceptions

### Re-sync strategy
- Drop database and re-sync from block 0 after schema changes
- No SQL migrations, no backfill scripts
- TypeORM `synchronize: true` handles schema creation on fresh DB

### "Oldest" retention (BORD-04)
- Only UniversalProfile, DigitalAsset, and NFT entities retain their first-seen block position
- All other entities get the block position of their latest write (upsert overwrites)
- UP/DA/NFT get their block data from the earliest enrichment request in the batch (lowest blockNumber/txIndex/logIndex among all enrichment requests for that address)
- Subsequent updates to UP/DA/NFT skip blockNumber/transactionIndex/logIndex fields entirely — creation sets them, updates never touch them

### Enrichment queue changes
- Add `blockNumber`, `transactionIndex`, `logIndex` as flat fields directly on the `EnrichmentRequest` interface
- Every plugin/handler populates these when calling `ctx.queueEnrichment()`
- Verification step uses the earliest enrichment request per address to set block position on UP/DA/NFT

### GraphQL exposure
- Fields are exposed through Hasura immediately via schema.graphql (auto-tracked)
- No changes to Hasura default ordering — Phase 21 handles sorting logic
- Composite database index `(blockNumber, transactionIndex, logIndex)` added on every entity table now

### Claude's Discretion
- TypeORM decorator details (`@Column`, `@Index` syntax)
- Order of schema.graphql field additions (alphabetical vs grouped)
- How to structure the "skip block fields on update" logic for UP/DA/NFT (TypeORM partial save, custom query builder, etc.)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The requirements (BORD-01 through BORD-06) are precise and the decisions above cover all ambiguity.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-block-ordering*
*Context gathered: 2026-03-09*
