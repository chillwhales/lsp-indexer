---
'@chillwhales/indexer': patch
---

Fix IntegerOutOfRangeError when processing large hex values in viem v2.47.4

Replace `hexToNumber()` with `BigInt()` in `decodeVerifiableUri` and `formatTokenId` functions to handle arbitrarily large hex numbers that exceed JavaScript's safe integer range. This resolves crashes at block 641099 where extremely large hex values caused viem's hexToNumber to throw IntegerOutOfRangeError.
