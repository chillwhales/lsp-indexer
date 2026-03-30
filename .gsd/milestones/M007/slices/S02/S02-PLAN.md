# S02: NftFilter + OwnedToken propagation

**Goal:** Add 4 new NftFilter fields with Hasura where-clause builders. Propagate all 7 new NFT fields into OwnedToken's nested NFT include (documents, scalar field map, service builders).
**Demo:** After this: After this: NFTs filterable by chillClaimed/orbsClaimed/maxLevel/cooldownExpiryBefore; getOwnedTokens returns nested NFT custom fields with include narrowing.

## Tasks
