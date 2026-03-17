# T04: 09.1-digital-assets 04

**Slice:** S13 — **Milestone:** M001

## Description

Build the test app digital assets playground page that exercises all three hooks (in both client and server modes) with live Hasura data — proving the entire vertical slice works end-to-end. Includes color-coded badges for the 4 token type combinations, full LSP4 metadata display, and conditional LSP8 section.

Purpose: This is the ultimate validation. If a developer can load the test app, navigate to /digital-assets, enter an address, and see real digital asset data with correctly derived `standard` and mapped `tokenType` rendered — the entire document → parser → service → hook architecture works for the digital assets domain.

Output: `/digital-assets` page in the test app with single asset view (full card + LSP4 metadata + conditional LSP8 section), list view with all filters and sorts, and infinite scroll view — all using shadcn/ui components. Color-coded badges for LSP7 Token/NFT and LSP8 NFT/Collection.

## Must-Haves

- [ ] 'Developer can navigate to /digital-assets in test app and see digital asset playground UI'
- [ ] 'Developer can enter an address and see typed DigitalAsset data rendered with standard badge'
- [ ] 'Developer can see color-coded badges: LSP7 Token (blue), LSP7 NFT (purple), LSP8 NFT (orange), LSP8 Collection (yellow)'
- [ ] 'Developer can filter by name, symbol, tokenType, category, holderAddress, ownerAddress'
- [ ] 'Developer can sort by name, symbol, holderCount, creatorCount, totalSupply, createdAt'
- [ ] 'Developer can toggle between client mode (@lsp-indexer/react) and server mode (@lsp-indexer/next)'
- [ ] 'Developer can see useInfiniteDigitalAssets with load more / infinite scroll'
- [ ] 'Developer can click preset address buttons (CHILL LSP7, Chillwhales LSP8)'
- [ ] 'Developer can see LSP4 metadata section (description, category, attributes, links) on single asset'
- [ ] 'Developer can see conditional LSP8 section (referenceContract, tokenIdFormat, baseUri) only when standard === "LSP8"'
- [ ] 'Developer can see loading skeleton and error states'
- [ ] 'Developer can toggle raw JSON view for debugging'

## Files

- `apps/test/src/app/digital-assets/page.tsx`
- `apps/test/src/app/digital-assets/layout.tsx`
- `apps/test/src/components/nav.tsx`
