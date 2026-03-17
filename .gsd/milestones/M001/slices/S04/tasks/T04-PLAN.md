# T04: 03.1-improve-debug-logging-strategy 04

**Slice:** S04 — **Milestone:** M001

## Description

Fix remaining code quality issues: eliminate ALL type assertions from test code by using proper TypeScript interfaces, and move logger creation to only where it's actually used (inside if/else blocks, not before).

Purpose: Follow TypeScript best practices completely - no type assertions anywhere, proper interface definitions, and variables declared in minimal scope.

Output: Zero type assertions, zero ESLint warnings, clean TypeScript code that leverages the type system properly.

## Must-Haves

- [ ] 'Logger only created when needed (inside debug block or for both paths)'
- [ ] 'Zero type assertions in test code - proper interface typing used'
- [ ] 'ESLint passes with no warnings'

## Files

- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
