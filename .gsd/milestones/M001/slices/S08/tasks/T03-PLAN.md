# T03: 05.2-lsp4-base-uri-count-parity 03

**Slice:** S08 — **Milestone:** M001

## Description

Create new lsp4MetadataBaseUri handler that derives per-token LSP4Metadata entities from LSP8TokenMetadataBaseURI + NFT tokenIds.

Purpose: GAP-06 — This is the big gap (~84K missing LSP4Metadata entities out of 116K total). V1's `utils/lsp4MetadataBaseUri.ts` has two trigger paths: (1) on NFT mint, check if parent collection has a base URI and derive per-token metadata URL, (2) on base URI change, derive URLs for ALL existing NFTs. V2 has no equivalent. The handler creates LSP4Metadata entities in the batch, which are automatically picked up by the existing `lsp4MetadataFetch.handler.ts` for IPFS/HTTP fetching.

Output: New `lsp4MetadataBaseUri.handler.ts` that closes the ~84K entity gap.

## Must-Haves

- [ ] 'When an NFT is minted and parent LSP8 collection has LSP8TokenMetadataBaseURI, an LSP4Metadata entity is created with derived URL'
- [ ] 'When LSP8TokenMetadataBaseURI changes via DataChanged, LSP4Metadata entities are created for ALL existing NFTs of that collection'
- [ ] "LSP4Metadata entity ID follows format 'BaseURI - {address} - {tokenId}'"
- [ ] "URL derivation: baseUri.endsWith('/') ? baseUri + formattedTokenId : baseUri + '/' + formattedTokenId"
- [ ] 'Created LSP4Metadata entities are automatically picked up by lsp4MetadataFetch handler'

## Files

- `packages/indexer-v2/src/handlers/lsp4MetadataBaseUri.handler.ts`
