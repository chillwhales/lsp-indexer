# T02: 09.1-digital-assets 02

**Slice:** S13 — **Milestone:** M001

## Description

Build the internal plumbing layer for digital assets: query key factory, parser (with standard derivation and tokenType mapping), and service functions that translate between the clean public API and Hasura's GraphQL types.

Purpose: The service layer is THE critical translation boundary. It takes simple flat params (DigitalAssetFilter with clean TokenType enums, DigitalAssetSort) and converts them to Hasura's nested `where`/`order_by` objects. The parser is where the SDK's key value-add happens — deriving `standard` from `decimals` presence and mapping raw `"0"`/`"1"`/`"2"` to clean `TOKEN`/`NFT`/`COLLECTION` values.

Output: `keys/digital-assets.ts` (query key factory), `parsers/digital-assets.ts` (Hasura → camelCase + standard derivation), `services/digital-assets.ts` (param translation + execute + parse pipeline). Also adds `@lukso/lsp4-contracts` dependency to `@lsp-indexer/node`.

## Must-Haves

- [ ] 'Query key factory produces unique keys for detail, list, and infinite digital asset queries'
- [ ] 'Parser transforms raw Hasura response to clean DigitalAsset type with camelCase, null coalescing, and array defaults'
- [ ] 'Parser derives standard field ("LSP7" | "LSP8") from decimals presence'
- [ ] 'Parser maps raw tokenType "0"→"TOKEN", "1"→"NFT", "2"→"COLLECTION"'
- [ ] 'Service functions translate flat DigitalAssetFilter/DigitalAssetSort to Hasura where/order_by and return parsed results'
- [ ] 'Service maps TokenType filter (TOKEN/NFT/COLLECTION) to raw Hasura values (0/1/2) using LSP4_TOKEN_TYPES constants'
- [ ] 'Include variables use inverted default: undefined → everything included, provided → explicit opt-in'
- [ ] 'Consumers never see Hasura types — service layer is the translation boundary'

## Files

- `packages/node/src/keys/digital-assets.ts`
- `packages/node/src/parsers/digital-assets.ts`
- `packages/node/src/services/digital-assets.ts`
- `packages/node/package.json`
