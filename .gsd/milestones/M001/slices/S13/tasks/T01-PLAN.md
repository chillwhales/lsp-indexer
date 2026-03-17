# T01: 09.1-digital-assets 01

**Slice:** S13 — **Milestone:** M001

## Description

Create the Digital Asset domain types (Zod schemas + inferred TS types) and GraphQL documents — the foundation layer for the entire digital assets vertical slice.

Purpose: Types define the clean public API contract (camelCase, no Hasura leakage). The `DigitalAsset` type is richer than `Profile` — it includes the derived `standard` field (LSP7/LSP8), token type using clean enum values, LSP4 metadata (icons, images, links, attributes), and LSP8-specific nullable fields. Documents define the actual GraphQL queries sent to Hasura. Codegen regeneration produces the Hasura filter/aggregate types needed by the service layer.

Output: `packages/types/src/digital-assets.ts` with all Zod schemas and inferred types, `packages/node/src/documents/digital-assets.ts` with 2 GraphQL document strings (single asset + asset list), regenerated codegen output in `packages/node/src/graphql/`.

## Must-Haves

- [ ] 'DigitalAsset, DigitalAssetFilter, DigitalAssetSort, DigitalAssetInclude types exist and are importable from @lsp-indexer/types'
- [ ] 'DigitalAsset type has standard field ("LSP7" | "LSP8"), tokenType (TOKEN | NFT | COLLECTION), and all LSP8-specific nullable fields'
- [ ] 'GraphQL documents for single digital asset and digital asset list with aggregate exist'
- [ ] '@include directives on all optional nested fields with Boolean! = true defaults (inverted: everything included by default)'
- [ ] 'Codegen output includes Hasura digital_asset filter/aggregate/ordering types'
- [ ] 'TokenType uses clean enum values (TOKEN | NFT | COLLECTION) not raw "0"/"1"/"2" strings'

## Files

- `packages/types/src/digital-assets.ts`
- `packages/types/src/index.ts`
- `packages/node/src/documents/digital-assets.ts`
- `packages/node/src/graphql/graphql.ts`
- `packages/node/src/graphql/gql.ts`
