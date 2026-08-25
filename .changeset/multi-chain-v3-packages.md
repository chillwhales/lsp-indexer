---
'@lsp-indexer/types': major
'@lsp-indexer/node': major
'@lsp-indexer/react': major
'@lsp-indexer/next': major
---

Replace the v2 consumer internals with the network-scoped v3 data model and Node client. Every
request now has an explicit network, runtime schemas cover all v3 API domains, cache keys are
chain-safe, React/Next expose uniform hooks and server actions for all 15 roots, live reconnects
invalidate exact network caches, and unsupported legacy query behavior fails with typed validation
errors.
