# S13: Digital Assets

**Goal:** Create the Digital Asset domain types (Zod schemas + inferred TS types) and GraphQL documents — the foundation layer for the entire digital assets vertical slice.
**Demo:** Create the Digital Asset domain types (Zod schemas + inferred TS types) and GraphQL documents — the foundation layer for the entire digital assets vertical slice.

## Must-Haves


## Tasks

- [x] **T01: 09.1-digital-assets 01**
  - Create the Digital Asset domain types (Zod schemas + inferred TS types) and GraphQL documents — the foundation layer for the entire digital assets vertical slice.

Purpose: Types define the clean public API contract (camelCase, no Hasura leakage). The `DigitalAsset` type is richer than `Profile` — it includes the derived `standard` field (LSP7/LSP8), token type using clean enum values, LSP4 metadata (icons, images, links, attributes), and LSP8-specific nullable fields. Documents define the actual GraphQL queries sent to Hasura. Codegen regeneration produces the Hasura filter/aggregate types needed by the service layer.

Output: `packages/types/src/digital-assets.ts` with all Zod schemas and inferred types, `packages/node/src/documents/digital-assets.ts` with 2 GraphQL document strings (single asset + asset list), regenerated codegen output in `packages/node/src/graphql/`.
- [x] **T02: 09.1-digital-assets 02**
  - Build the internal plumbing layer for digital assets: query key factory, parser (with standard derivation and tokenType mapping), and service functions that translate between the clean public API and Hasura's GraphQL types.

Purpose: The service layer is THE critical translation boundary. It takes simple flat params (DigitalAssetFilter with clean TokenType enums, DigitalAssetSort) and converts them to Hasura's nested `where`/`order_by` objects. The parser is where the SDK's key value-add happens — deriving `standard` from `decimals` presence and mapping raw `"0"`/`"1"`/`"2"` to clean `TOKEN`/`NFT`/`COLLECTION` values.

Output: `keys/digital-assets.ts` (query key factory), `parsers/digital-assets.ts` (Hasura → camelCase + standard derivation), `services/digital-assets.ts` (param translation + execute + parse pipeline). Also adds `@lukso/lsp4-contracts` dependency to `@lsp-indexer/node`.
- [x] **T03: 09.1-digital-assets 03**
  - Create the consumer-facing hooks for both @lsp-indexer/react and @lsp-indexer/next, server actions, and wire all digital asset exports through every package entry point — making the full API available for import.

Purpose: This plan makes everything usable. React hooks wrap TanStack Query around the service functions for direct browser→Hasura calls. Next.js hooks use server actions as queryFn for browser→server→Hasura routing. Entry points expose the right things from the right packages.

Output: `hooks/digital-assets.ts` in @lsp-indexer/react with 3 hooks, `actions/digital-assets.ts` + `hooks/digital-assets.ts` in @lsp-indexer/next, updated `index.ts` in all 3 packages (@lsp-indexer/node, @lsp-indexer/react, @lsp-indexer/next). All 4 packages build clean.
- [x] **T04: 09.1-digital-assets 04**
  - Build the test app digital assets playground page that exercises all three hooks (in both client and server modes) with live Hasura data — proving the entire vertical slice works end-to-end. Includes color-coded badges for the 4 token type combinations, full LSP4 metadata display, and conditional LSP8 section.

Purpose: This is the ultimate validation. If a developer can load the test app, navigate to /digital-assets, enter an address, and see real digital asset data with correctly derived `standard` and mapped `tokenType` rendered — the entire document → parser → service → hook architecture works for the digital assets domain.

Output: `/digital-assets` page in the test app with single asset view (full card + LSP4 metadata + conditional LSP8 section), list view with all filters and sorts, and infinite scroll view — all using shadcn/ui components. Color-coded badges for LSP7 Token/NFT and LSP8 NFT/Collection.

## Files Likely Touched

- `packages/types/src/digital-assets.ts`
- `packages/types/src/index.ts`
- `packages/node/src/documents/digital-assets.ts`
- `packages/node/src/graphql/graphql.ts`
- `packages/node/src/graphql/gql.ts`
- `packages/node/src/keys/digital-assets.ts`
- `packages/node/src/parsers/digital-assets.ts`
- `packages/node/src/services/digital-assets.ts`
- `packages/node/package.json`
- `packages/react/src/hooks/digital-assets.ts`
- `packages/react/src/index.ts`
- `packages/next/src/actions/digital-assets.ts`
- `packages/next/src/hooks/digital-assets.ts`
- `packages/next/src/index.ts`
- `packages/node/src/index.ts`
- `apps/test/src/app/digital-assets/page.tsx`
- `apps/test/src/app/digital-assets/layout.tsx`
- `apps/test/src/components/nav.tsx`
