---
'@chillwhales/indexer': patch
---

Fix critical integer overflow errors in hex conversion handlers

Resolves crashes caused by `hexToNumber()` failing on large uint256 hex values in LSP8TokenIdFormat, LSP4TokenType, and decimals handlers. Replaces direct `hexToNumber()` calls with a safe `safeHexToNumber()` utility that handles large values by extracting lower 32 bits while maintaining backward compatibility with existing small enum values.
