# T02: 11-server-actions-publish-readiness 02

**Slice:** S15 — **Milestone:** M001

## Description

Validate all 4 packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) for npm publish readiness using `publint` and `arethetypeswrong`, fix any issues found, verify server/client bundle separation, and confirm `npm pack` contents are clean.

Purpose: Ensure every package can be published to npm without exports map issues, missing type declarations, or bundle contamination — the final quality gate before shipping.
Output: All 4 packages pass publish validation tools with zero errors, clean npm pack output.

## Must-Haves

- [ ] 'Developer can run publint on all 4 packages and see zero errors'
- [ ] 'Developer can run arethetypeswrong on all 4 packages and see zero errors'
- [ ] 'Developer can import from @lsp-indexer/node in a server context without client code leaking'
- [ ] 'Developer can npm pack each package and see only dist/ and package metadata included'

## Files

- `package.json`
- `packages/types/package.json`
- `packages/node/package.json`
- `packages/react/package.json`
- `packages/next/package.json`
- `packages/types/tsup.config.ts`
- `packages/node/tsup.config.ts`
- `packages/react/tsup.config.ts`
- `packages/next/tsup.config.ts`
