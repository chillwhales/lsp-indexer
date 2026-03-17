# S15: Server Actions Publish Readiness

**Goal:** Add Zod input validation to all 21 server action functions in `@lsp-indexer/next`, using existing param schemas from `@lsp-indexer/types`.
**Demo:** Add Zod input validation to all 21 server action functions in `@lsp-indexer/next`, using existing param schemas from `@lsp-indexer/types`.

## Must-Haves


## Tasks

- [x] **T01: 11-server-actions-publish-readiness 01** `est:11min`
  - Add Zod input validation to all 21 server action functions in `@lsp-indexer/next`, using existing param schemas from `@lsp-indexer/types`. Invalid inputs throw `IndexerError` with a new `VALIDATION` category — consumers catch validation errors the same way they catch network/GraphQL errors.

Purpose: Ensure server actions reject malformed inputs early with clear error messages, before they reach the GraphQL layer. This is the ACTION-03 requirement.
Output: Updated error types, validation utility, and all 12 action files wired with input validation.
- [x] **T02: 11-server-actions-publish-readiness 02** `est:3min`
  - Validate all 4 packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) for npm publish readiness using `publint` and `arethetypeswrong`, fix any issues found, verify server/client bundle separation, and confirm `npm pack` contents are clean.

Purpose: Ensure every package can be published to npm without exports map issues, missing type declarations, or bundle contamination — the final quality gate before shipping.
Output: All 4 packages pass publish validation tools with zero errors, clean npm pack output.

## Files Likely Touched

- `packages/types/src/errors.ts`
- `packages/node/src/errors/indexer-error.ts`
- `packages/next/package.json`
- `packages/next/src/actions/validate.ts`
- `packages/next/src/actions/profiles.ts`
- `packages/next/src/actions/digital-assets.ts`
- `packages/next/src/actions/nfts.ts`
- `packages/next/src/actions/owned-assets.ts`
- `packages/next/src/actions/owned-tokens.ts`
- `packages/next/src/actions/followers.ts`
- `packages/next/src/actions/creators.ts`
- `packages/next/src/actions/issued-assets.ts`
- `packages/next/src/actions/encrypted-assets.ts`
- `packages/next/src/actions/data-changed-events.ts`
- `packages/next/src/actions/token-id-data-changed-events.ts`
- `packages/next/src/actions/universal-receiver-events.ts`
- `package.json`
- `packages/types/package.json`
- `packages/node/package.json`
- `packages/react/package.json`
- `packages/next/package.json`
- `packages/types/tsup.config.ts`
- `packages/node/tsup.config.ts`
- `packages/react/tsup.config.ts`
- `packages/next/tsup.config.ts`
