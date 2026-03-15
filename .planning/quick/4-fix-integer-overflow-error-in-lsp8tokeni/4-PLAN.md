---
phase: 4-fix-integer-overflow-error-in-lsp8tokeni  
plan: 1
type: execute
wave: 1
depends_on: []
files_modified: [
  packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts,
  packages/indexer/src/handlers/lsp4TokenType.handler.ts,
  packages/indexer/src/handlers/decimals.handler.ts,
  packages/indexer/src/utils/index.ts
]
autonomous: true
requirements: [OVERFLOW-01]

must_haves:
  truths:
    - "Large hex values don't cause hexToNumber overflow in any handler (LSP8TokenIdFormat, LSP4TokenType, decimals)"
    - "All handlers safely process uint256 hex strings without integer overflow"
    - "Handlers maintain backward compatibility with existing small values"
  artifacts:
    - path: "packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts"
      provides: "Fixed integer overflow in hexToNumber conversion"
      min_lines: 60
    - path: "packages/indexer/src/handlers/lsp4TokenType.handler.ts"
      provides: "Fixed integer overflow in hexToNumber conversion"
      min_lines: 60
    - path: "packages/indexer/src/handlers/decimals.handler.ts" 
      provides: "Fixed integer overflow in hexToNumber conversion"
      min_lines: 120
    - path: "packages/indexer/src/utils/index.ts"
      provides: "Safe hex conversion utility functions"
      min_lines: 40
  key_links:
    - from: "LSP8TokenIdFormat handler"
      to: "decodeTokenIdFormat utility"
      via: "safe hex to format conversion"
      pattern: "BigInt.*hexToNumber"
---

<objective>
Fix integer overflow errors throughout the indexer where hexToNumber fails on large uint256 values.

Purpose: Prevent indexer crashes when processing any large hex values that exceed JavaScript's safe integer range across all handlers (LSP8TokenIdFormat, LSP4TokenType, decimals).
Output: All handlers safely process large hex values without overflow errors, with reusable utility functions.
</objective>

<execution_context>
@/home/coder/.config/Claude/get-shit-done/workflows/execute-plan.md
@/home/coder/.config/Claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts
@packages/indexer/src/handlers/lsp4TokenType.handler.ts  
@packages/indexer/src/handlers/decimals.handler.ts
@packages/indexer/src/utils/index.ts

## Issue Analysis

The error occurs in multiple handlers using `hexToNumber()` on large uint256 values:

1. **LSP8TokenIdFormat handler** line 41: `decodeTokenIdFormat(hexToNumber(event.dataValue))`
2. **LSP4TokenType handler** line 41: `decodeTokenType(hexToNumber(event.dataValue))`  
3. **Decimals handler** line 88: `value: hexToNumber(result.returnData)`

Problem: `hexToNumber()` from viem throws on hex values exceeding Number.MAX_SAFE_INTEGER (2^53 - 1).

While these values should typically be small integers, the blockchain can contain large uint256 values that cause crashes.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create safe hex conversion utility function</name>
  <files>packages/indexer/src/utils/index.ts</files>
  <action>
    Add a safe hex to number conversion utility function to utils:
    
    1. Import `hexToBigInt` from viem
    2. Add new utility function:
       ```typescript
       /**
        * Safely convert hex to number with explicit upper-bound validation.
        * Rejects '0x' as empty data. Out-of-range values throw or return null.
        */
       export function safeHexToNumber(
         hex: string,
         options: { maxValue?: number; fallbackBehavior?: 'throw' | 'null' } = {},
       ): number | null { ... }
       ```
    3. Export the function for use in handlers
    
    This provides a centralized solution that validates against explicit upper bounds per caller.
  </action>
  <verify>pnpm --filter=@chillwhales/indexer build</verify>
  <done>Utils module contains safe hex conversion function that handles large uint256 values</done>
</task>

<task type="auto">
  <name>Task 2: Update all handlers to use safe conversion</name>
  <files>packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts, packages/indexer/src/handlers/lsp4TokenType.handler.ts, packages/indexer/src/handlers/decimals.handler.ts</files>
  <action>
    Replace all hexToNumber calls with safeHexToNumber utility in all affected handlers:
    
    **LSP8TokenIdFormat handler:**
    1. Import safeHexToNumber from utils: `import { safeHexToNumber } from '@/utils'`
    2. Replace `hexToNumber(event.dataValue)` with `safeHexToNumber(event.dataValue, { maxValue: 104, fallbackBehavior: 'null' })`
    3. Check for null return and log structured warning for out-of-range values
    
    **LSP4TokenType handler:**
    1. Import safeHexToNumber from utils: `import { safeHexToNumber } from '@/utils'` 
    2. Replace `hexToNumber(event.dataValue)` with `safeHexToNumber(event.dataValue, { maxValue: 2, fallbackBehavior: 'null' })`
    3. Check for null return and log structured warning for out-of-range values
    
    **Decimals handler:**
    1. Import safeHexToNumber from utils: `import { safeHexToNumber } from '@/utils'`
    2. Replace `hexToNumber(result.returnData)` with `safeHexToNumber(result.returnData, { maxValue: 255 })`
    3. Existing try-catch catches throws for out-of-range or invalid values
    
    Enum handlers use null fallback with explicit bounds; decimals handler uses throw (caught by existing try-catch).
  </action>
  <verify>grep -r "hexToNumber" packages/indexer/src/handlers/ && echo "Should show no results" || echo "All hexToNumber calls replaced"</verify>
  <done>All handlers use safe hex conversion and include error handling to prevent crashes on large values</done>
</task>

</tasks>

<verification>
All handlers process large hex values without integer overflow errors while maintaining backward compatibility with existing format/type detection.
</verification>

<success_criteria>
- Build passes without TypeScript errors 
- All hexToNumber calls replaced with safe conversion utility
- No remaining hexToNumber usage in handlers (verified by grep)
- Backward compatibility maintained for existing small values (format types, token types, decimals)
- Error handling prevents future crashes on unexpected values
- Centralized utility function for consistent safe conversion across all handlers
</success_criteria>

<output>
After completion, create `.planning/quick/4-fix-integer-overflow-error-in-lsp8tokeni/4-SUMMARY.md`
</output>