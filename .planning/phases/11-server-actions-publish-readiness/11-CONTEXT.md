# Phase 11: Server Actions & Publish Readiness - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Zod input validation to all existing server actions in `@lsp-indexer/next`, verify server/client bundle separation, and validate all 4 packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) for npm publish readiness with `publint` and `arethetypeswrong`.

Server actions for all 11 domains already exist with `'use server'` directives and 3-overload generic patterns. Zod schemas for all domain inputs already exist in `@lsp-indexer/types`. This phase wires validation into the actions and validates the packages for publishing.

</domain>

<decisions>
## Implementation Decisions

### Validation error behavior

- Zod validation failures in server actions throw `IndexerError` with a new `VALIDATION` category — consumers catch validation errors the same way they catch network/GraphQL errors
- Add `VALIDATION` to `IndexerErrorCategory` and add validation-specific error codes (e.g., `VALIDATION_FAILED`) to `IndexerErrorCode` in `@lsp-indexer/types`
- Error message should include Zod's field-level details so the developer knows which input was wrong

### Claude's Discretion

- Exact Zod error code(s) added to `IndexerErrorCode` (e.g., `VALIDATION_FAILED`, `VALIDATION_INVALID_ADDRESS`, or just one generic code)
- Whether to validate at the action layer only or also add validation in service functions
- README content and structure for each package — standard npm README conventions
- publint/arethetypeswrong fix approach — whatever the tools flag, fix it
- Source maps inclusion/exclusion in published packages
- Any exports map adjustments needed to pass validation tools

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The existing patterns from 10 completed phases establish all conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 11-server-actions-publish-readiness_
_Context gathered: 2026-03-05_
