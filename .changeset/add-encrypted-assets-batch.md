---
'@lsp-indexer/types': minor
'@lsp-indexer/node': minor
'@lsp-indexer/react': minor
'@lsp-indexer/next': minor
---

Add batch encrypted asset fetch for multiple `(address, contentId, revision)` tuples in a single query

- Add `EncryptedAssetBatchTupleSchema`, `UseEncryptedAssetsBatchParamsSchema` Zod schemas and inferred types
- Add `fetchEncryptedAssetsBatch` service with `_or`/`_and` Hasura query and 3-overload include narrowing
- Add `encryptedAssetKeys.batch()` cache key factory entry
- Add `createUseEncryptedAssetsBatch` factory and `useEncryptedAssetsBatch` hook in `@lsp-indexer/react`
- Add `getEncryptedAssetsBatch` server action and `useEncryptedAssetsBatch` hook in `@lsp-indexer/next`
- Add batch encrypted asset documentation to node, react, and next docs pages
