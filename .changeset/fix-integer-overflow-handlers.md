---
'@chillwhales/indexer': patch
---

Fix critical integer overflow errors in hex conversion handlers

Resolves crashes caused by `hexToNumber()` failing on large uint256 hex values in LSP8TokenIdFormat, LSP4TokenType, and decimals handlers. Replaces direct `hexToNumber()` calls with a safe `safeHexToNumber()` utility that validates values against explicit upper bounds per handler (token type ≤ 2, token ID format ≤ 104, decimals ≤ 255) and treats out-of-range values as invalid (null or throw) instead of crashing.
