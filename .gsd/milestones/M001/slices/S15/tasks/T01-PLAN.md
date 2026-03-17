# T01: 11-server-actions-publish-readiness 01

**Slice:** S15 — **Milestone:** M001

## Description

Add Zod input validation to all 21 server action functions in `@lsp-indexer/next`, using existing param schemas from `@lsp-indexer/types`. Invalid inputs throw `IndexerError` with a new `VALIDATION` category — consumers catch validation errors the same way they catch network/GraphQL errors.

Purpose: Ensure server actions reject malformed inputs early with clear error messages, before they reach the GraphQL layer. This is the ACTION-03 requirement.
Output: Updated error types, validation utility, and all 12 action files wired with input validation.

## Must-Haves

- [ ] 'Developer gets an IndexerError with category VALIDATION when passing invalid inputs to any server action'
- [ ] 'Validation error message includes Zod field-level details showing which input was wrong'
- [ ] 'Valid inputs pass through validation transparently — no behavior change for correct usage'
- [ ] 'All 21 exported server action functions validate their inputs before calling service functions'

## Files

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
