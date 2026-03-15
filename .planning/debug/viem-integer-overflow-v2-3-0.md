---
status: awaiting_human_verify
trigger: "Investigate issue: viem-integer-overflow-v2-3-0"
created: 2026-03-15T00:00:00Z
updated: 2026-03-15T00:06:00Z
---

## Current Focus

hypothesis: CONFIRMED - Fix is ready for final verification
test: TypeScript build successful, need runtime test against blockchain data  
expecting: indexer processes block 641099 without IntegerOutOfRangeError
next_action: human verification that fix resolves original issue

## Symptoms

expected: Indexer should start successfully and process blocks without errors
actual: Indexer crashes with IntegerOutOfRangeError during block processing at step PERSIST_RAW
errors: IntegerOutOfRangeError: Number "3501836619249046757190354514789947885965281414295160332437663727732996582989545150758971143169622342758887986783356008926982520132399812182007705668816582337824119687764993599803641632539249598456492688302215787972997501402224593160506526649288055152346327857526390n" is not in safe integer range (-9007199254740991 to 9007199254740991). Stack trace shows error at: viem@2.47.4 hexToNumber -> decodeVerifiableUri (/app/packages/indexer/src/utils/index.ts:23:61) -> lsp3Profile.handler.js:34:81
reproduction: Run indexer with "pnpm --filter=@chillwhales/indexer start:simple" - crashes consistently at block 641099
started: Issue started after upgrading to indexer version 2.3.0, previously working

## Eliminated

## Evidence

- timestamp: 2026-03-15T00:01:00Z
  checked: /app/packages/indexer/src/utils/index.ts lines 23-24
  found: decodeVerifiableUri function calls hexToNumber(dataValue) to check if value is 0
  implication: Large hex values that exceed JS safe integer range will crash

- timestamp: 2026-03-15T00:02:00Z
  checked: lsp3Profile.handler.ts line 37
  found: Handler calls decodeVerifiableUri(event.dataValue) on LSP3Profile data
  implication: Some LSP3Profile dataValue contains extremely large hex number

- timestamp: 2026-03-15T00:03:00Z
  checked: decimals.handler.ts line 88 and 106-108
  found: Other handlers already protect against hexToNumber overflow with try-catch
  implication: The pattern for handling this issue already exists in codebase

- timestamp: 2026-03-15T00:04:00Z
  checked: grep for hexToNumber usage in formatTokenId (utils/index.ts:389)
  found: formatTokenId also calls hexToNumber without protection for LSP8TokenIdFormatEnum.NUMBER
  implication: Multiple places vulnerable to same overflow issue

- timestamp: 2026-03-15T00:05:40Z
  checked: pnpm --filter=@chillwhales/indexer build
  found: TypeScript compilation succeeds without errors after BigInt fix
  implication: Syntax is correct, no type errors introduced by the fix

## Resolution

root_cause: decodeVerifiableUri function uses hexToNumber(dataValue) === 0 to check for zero values, but hexToNumber throws IntegerOutOfRangeError when hex value exceeds JavaScript's safe integer range (-2^53 to 2^53). LSP3Profile data contains extremely large hex values that trigger this overflow. formatTokenId also has same vulnerability.
fix: Replace hexToNumber with BigInt in both decodeVerifiableUri and formatTokenId functions
verification: 
1. Code analysis confirms fix is correct - BigInt can handle arbitrarily large numbers without overflow. Original logic preserved for zero-checking and token ID formatting.
2. TypeScript build succeeds after fix - no type errors or compilation issues
3. Ready for final runtime verification - indexer should process block 641099 without IntegerOutOfRangeError
files_changed: ['/home/coder/lsp-indexer/packages/indexer/src/utils/index.ts']