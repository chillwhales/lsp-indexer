# Requirements: LSP Indexer V2

**Defined:** 2026-02-06
**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

## v1 Requirements

Requirements for completing the V2 rewrite. Each maps to roadmap phases.

### Handler Migration

- [ ] **HMIG-01**: User can see totalSupply handler running as standalone EntityHandler with `listensToBag: ['LSP7Transfer', 'LSP8Transfer']`
- [ ] **HMIG-02**: User can see ownedAssets handler running as standalone EntityHandler with `listensToBag: ['LSP7Transfer', 'LSP8Transfer']`
- [ ] **HMIG-03**: User can see decimals handler adapted to new EntityHandler interface
- [ ] **HMIG-04**: User can see FormattedTokenId handler populating `NFT.formattedTokenId` based on LSP8TokenIdFormat
- [ ] **HMIG-05**: User can verify no legacy code remains — DataKeyPlugin interface, populate helpers, handler helpers all deleted

### New Handlers

- [ ] **HNDL-01**: User can see Follow entities created with deterministic IDs when Follow events occur
- [ ] **HNDL-02**: User can see Follow entities removed when Unfollow events occur
- [ ] **HNDL-03**: User can see LSP6 permission sub-entities correctly deleted and re-created on data key changes

### Metadata Fetchers

- [ ] **META-01**: User can see LSP3 profile metadata fetched from IPFS/HTTP and 7 sub-entity types created
- [ ] **META-02**: User can see LSP4 digital asset metadata fetched and 8 sub-entity types plus Score/Rank created
- [ ] **META-03**: User can see LSP29 encrypted asset metadata fetched and 7 sub-entity types created
- [ ] **META-04**: User can verify metadata handlers only fetch at chain head (`isHead === true`)
- [ ] **META-05**: User can verify metadata fetch failures are retried with proper error tracking

### Infrastructure

- [ ] **INFR-01**: User can see structured JSON logs with consistent field schemas across all 6 pipeline steps
- [ ] **INFR-02**: User can filter logs by severity level (info/warn/debug) and by pipeline step

### Integration

- [ ] **INTG-01**: User can see processor configured with all EventPlugin log subscriptions from the registry
- [ ] **INTG-02**: User can boot the application and see all EventPlugins and EntityHandlers discovered and registered
- [ ] **INTG-03**: User can run integration tests with real block fixtures that verify all 6 pipeline steps
- [ ] **INTG-04**: User can verify handler ordering preserves V1's dependency graph

### Deployment

- [ ] **DEPL-01**: User can run V2 alongside V1 in Docker with separate databases indexing the same chain
- [ ] **DEPL-02**: User can run automated comparison between V1 and V2 database state

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Deployment

- **DEPL-03**: Full automated V1/V2 comparison test suite with CI integration
- **DEPL-04**: Production cutover procedure with rollback plan
- **DEPL-05**: Performance benchmarks (V2 vs V1 throughput, memory, CPU)

### Infrastructure

- **INFR-03**: Subsquid Portal SDK migration (new DataSourceBuilder API)
- **INFR-04**: Multi-stage Docker build optimization (reduce image size)

## Out of Scope

| Feature                       | Reason                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| Marketplace functionality     | Removed from scope — issues #40-#46, #56 closed as not planned         |
| New LSP standards not in V1   | V2 must match V1 parity first before adding new standards              |
| GraphQL API changes           | Hasura auto-generates from schema, no custom resolvers needed          |
| V1 code changes               | V1 is frozen, only V2 gets work                                        |
| Schema changes                | TypeORM entities shared between V1 and V2, no breaking changes allowed |
| Subsquid Portal SDK migration | Breaking API changes, plan as separate post-V2 milestone               |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| HMIG-01     | 1     | Pending |
| HMIG-02     | 1     | Pending |
| HMIG-03     | 1     | Pending |
| HMIG-04     | 1     | Pending |
| HMIG-05     | 1     | Pending |
| HNDL-01     | 2     | Pending |
| HNDL-02     | 2     | Pending |
| HNDL-03     | 2     | Pending |
| INFR-01     | 2     | Pending |
| INFR-02     | 2     | Pending |
| META-01     | 3     | Pending |
| META-02     | 3     | Pending |
| META-03     | 3     | Pending |
| META-04     | 3     | Pending |
| META-05     | 3     | Pending |
| INTG-01     | 4     | Pending |
| INTG-02     | 4     | Pending |
| INTG-03     | 4     | Pending |
| INTG-04     | 4     | Pending |
| DEPL-01     | 5     | Pending |
| DEPL-02     | 5     | Pending |

**Coverage:**

- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---

_Requirements defined: 2026-02-06_
_Last updated: 2026-02-06 after roadmap creation_
