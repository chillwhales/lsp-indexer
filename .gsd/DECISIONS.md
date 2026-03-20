# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M004 | arch | How to compute follower set intersections | Hasura nested `followed`/`followedBy` relationship filters on `universal_profile` query | Server-side SQL joins, no client-side intersection needed. Schema verified to support this. | No |
| D002 | M004 | data | Return type for mutual follow hooks | `Profile[]` (via `ProfileResult<I>`) not `Follower[]` | The consumer wants to know *who* the mutual connections are, not the follow relationship metadata | No |
| D003 | M004 | pattern | Query approach | Query `universal_profile` table (not `follower` table) with nested relationship filters | The result is profiles, not follow records. Reuses existing profile parser and include machinery. | No |
