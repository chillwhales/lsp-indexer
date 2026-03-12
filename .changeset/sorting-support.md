---
'@lsp-indexer/types': minor
'@lsp-indexer/node': minor
---

Add newest/oldest block-order sorting across all 12 query domains. All domain services now default to newest-first when no sort parameter is provided. Non-block sort fields include block-order as a deterministic pagination tiebreaker. Removed individual block/timestamp sort fields in favor of consistent newest/oldest.
