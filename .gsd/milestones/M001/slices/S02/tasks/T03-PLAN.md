# T03: 02-new-handlers-structured-logging 03

**Slice:** S02 — **Milestone:** M001

## Description

Create TypeScript source for the existing LSP6Controllers handler and write unit tests to verify the delete-and-recreate cycle works correctly.

Purpose: HNDL-03 requires that LSP6 permission sub-entities are correctly deleted and re-created on data key changes. The handler already exists as 456-line compiled JS with full implementation. The work is: (1) port to TypeScript source, (2) write unit tests proving the critical behaviors, (3) verify correctness against V1 behavior.

Output: `lsp6Controllers.handler.ts` as a type-safe source file matching the compiled JS, plus comprehensive unit tests covering the queueClear → recreate cycle, merge-upsert behavior, and orphan cleanup.

## Must-Haves

- [ ] 'LSP6 permission sub-entities are deleted before re-creation when data key changes'
- [ ] 'Controller entities merge fields correctly across batch and database'
- [ ] 'Sub-entities are linked to parent controllers and orphans are removed'
- [ ] 'AllowedCalls and AllowedERC725YDataKeys decode from CompactBytesArray correctly'

## Files

- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts`
