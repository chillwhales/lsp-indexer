# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M004 | arch | How to compute follower set intersections | Hasura nested `followed`/`followedBy` relationship filters on `universal_profile` query | Server-side SQL joins, no client-side intersection needed. Schema verified to support this. | No |
| D002 | M004 | data | Return type for mutual follow hooks | `Profile[]` (via `ProfileResult<I>`) not `Follower[]` | The consumer wants to know *who* the mutual connections are, not the follow relationship metadata | No |
| D003 | M004 | pattern | Query approach | Query `universal_profile` table (not `follower` table) with nested relationship filters | The result is profiles, not follow records. Reuses existing profile parser and include machinery. | No |
| D004 | M004/S01 | pattern | How mutual follow service functions build where-clauses | Call execute() directly with composed _and where-clauses instead of using fetchProfiles | fetchProfiles builds its own where from ProfileFilter, but mutual follow queries need two simultaneous followedBy/followed relationship conditions that can't be expressed through ProfileFilter. Direct execute() with Universal_Profile_Bool_Exp gives full control. | Yes |
| D005 | M004/S01 | api | Whether mutual follow hook factories should default params to empty object | Mandatory addressA/addressB (or myAddress/targetAddress) params with no default = {} | Unlike profile queries which can be called without filters, mutual follow queries always require two addresses to compute an intersection — calling without them is nonsensical. Mandatory params prevent accidental misuse. | Yes |
| D006 | M005 | pattern | How to batch-fetch encrypted assets by tuple | Separate `fetchEncryptedAssetsBatch` using `_or`/`_and` Hasura where-clauses, not an extension of `fetchEncryptedAssets` | Input shape (tuple array vs single filter) and query shape (_or/_and exact tuples vs single _ilike filter) are fundamentally different. Matches precedent: fetchIsFollowingBatch is separate from fetchFollowers. | No |
| D007 | M005 | data | Address comparison in batch tuple queries | `_ilike` for address, `_eq` for contentId and revision | Non-checksummed address is exactly the same as checksummed — case-insensitive comparison required. contentId and revision are exact-match fields. | No |
| D008 | M005/S01 | pattern | Whether batch hook factory should use createUseList or direct useQuery | Direct useQuery with manual 3-overload signatures, not createUseList | Batch results have no totalCount or pagination — createUseList adds unnecessary pagination machinery. Direct useQuery with enabled guard on tuples.length and stable EMPTY array is simpler and matches the createUseIsFollowingBatch precedent. | Yes |
