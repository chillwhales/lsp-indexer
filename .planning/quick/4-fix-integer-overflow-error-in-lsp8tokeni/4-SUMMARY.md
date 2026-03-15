---
phase: 4-fix-integer-overflow-error-in-lsp8tokeni
plan: 1
subsystem: indexer-handlers
tags: [bug-fix, integer-overflow, hex-conversion, utils]
dependency_graph:
  requires: []
  provides: [safe-hex-conversion]
  affects: [lsp8-token-id-format, lsp4-token-type, decimals]
tech_stack:
  added: [safeHexToNumber-utility]
  patterns: [safe-conversion, bounds-checking, null-fallback]
key_files:
  created: []
  modified: [
    packages/indexer/src/utils/index.ts,
    packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts,
    packages/indexer/src/handlers/lsp4TokenType.handler.ts,
    packages/indexer/src/handlers/decimals.handler.ts
  ]
decisions: [
  "Use BigInt for conversion with explicit upper bounds per handler",
  "Treat out-of-range values as null (enum handlers) or throw (decimals)",
  "Centralize safe conversion logic in utils module"
]
metrics:
  duration: 300
  completed: "2026-03-15T20:39:05Z"
---

# Quick Task 4: Fix Integer Overflow Error in LSP8TokenId Summary

**One-liner:** Fixed integer overflow crashes in handlers by replacing hexToNumber with safe conversion utility that validates against explicit upper bounds

## Overview

Fixed critical integer overflow errors across multiple indexer handlers where `hexToNumber()` from viem would crash when processing large uint256 hex values. Created a centralized `safeHexToNumber()` utility that converts via BigInt and validates against explicit upper bounds per handler (token type ≤ 2, token ID format ≤ 104, decimals ≤ 255). Out-of-range values are treated as invalid (null for enum handlers, throw for decimals) rather than crashing.

## Tasks Completed

### Task 1: Create safe hex conversion utility function
- **Files:** packages/indexer/src/utils/index.ts
- **Action:** Added `safeHexToNumber` utility function that safely converts hex to number
- **Result:** Centralized solution for handling large uint256 values without crashes
- **Commit:** 61e5fc4

**Key implementation:**
- Uses `hexToBigInt` for initial conversion
- Validates against explicit `maxValue` upper bound per caller
- Returns `null` or throws for out-of-range values (no masking)
- Prevents crashes while rejecting invalid data

### Task 2: Update all handlers to use safe conversion
- **Files:** 
  - packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts
  - packages/indexer/src/handlers/lsp4TokenType.handler.ts  
  - packages/indexer/src/handlers/decimals.handler.ts
- **Action:** Replaced all `hexToNumber` calls with `safeHexToNumber`
- **Result:** All handlers now process large hex values without overflow errors
- **Commit:** 54d7ea1

**Implementation details:**
- Added imports for `safeHexToNumber` to all affected handlers
- Enum handlers (LSP8, LSP4) use `fallbackBehavior: 'null'` with explicit max bounds
- Decimals handler uses default throw behavior with `maxValue: 255` inside existing try-catch
- Maintained backward compatibility with existing small values

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✅ **Build passes:** `pnpm --filter=@chillwhales/indexer build` succeeds without errors
✅ **All hexToNumber calls replaced:** `grep -r "hexToNumber" packages/indexer/src/handlers/` shows no results  
✅ **Backward compatibility maintained:** Small values (format types, token types, decimals) work unchanged
✅ **Error handling prevents crashes:** Out-of-range values return null or are caught, with structured warnings
✅ **Centralized utility:** Consistent safe conversion across all handlers

## Technical Implementation

### Safe Conversion Strategy
- **For values ≤ maxValue:** Direct number conversion via BigInt
- **For values > maxValue:** Return `null` (enum handlers) or throw (decimals handler)
- **Rationale:** Each handler knows its valid range — no silent coercion of invalid data

### Error Handling Patterns
```typescript
// Enum handlers (LSP8, LSP4): null fallback + structured warning
const num = safeHexToNumber(hex, { maxValue: 104, fallbackBehavior: 'null' });
if (num !== null) { value = decodeTokenIdFormat(num); }

// Decimals handler: throw (caught by existing try-catch)
const decimals = safeHexToNumber(hex, { maxValue: 255 }) as number;
```

### Files Modified
1. **utils/index.ts:** Added `safeHexToNumber` utility with BigInt conversion + bounds validation
2. **lsp8TokenIdFormat.handler.ts:** Bounds-checked format enum extraction (max 104)
3. **lsp4TokenType.handler.ts:** Bounds-checked token type extraction (max 2)
4. **decimals.handler.ts:** Range-validated decimals extraction (max 255)

## Impact

- **Reliability:** Eliminated integer overflow crashes in indexer pipeline
- **Data integrity:** Out-of-range values rejected as null/error instead of silently coerced
- **Maintainability:** Centralized conversion logic with explicit bounds per caller
- **Performance:** Minimal overhead compared to crash recovery

## Self-Check: PASSED

✅ **Created files verified:** All utility functions and imports present
✅ **Modified files verified:** All handler updates applied correctly  
✅ **Commits verified:** Both task commits exist (61e5fc4, 54d7ea1)
✅ **Build verification:** TypeScript compilation successful
✅ **Functionality verified:** No hexToNumber calls remain in handlers