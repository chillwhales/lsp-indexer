# S12: First Vertical Slice

**Goal:** Create the Profile domain types and GraphQL documents — the foundation layer that everything else builds on.
**Demo:** Create the Profile domain types and GraphQL documents — the foundation layer that everything else builds on.

## Must-Haves


## Tasks

- [x] **T01: 08-first-vertical-slice 01**
  - Create the Profile domain types and GraphQL documents — the foundation layer that everything else builds on.

Purpose: Types define the clean public API contract (camelCase, no Hasura leakage). Documents define the actual GraphQL queries sent to Hasura. Codegen regeneration produces the Hasura filter/aggregate types needed by the service layer.

Output: `types/profiles.ts` with all type definitions, `documents/profiles.ts` with 2 GraphQL document strings (single profile + profile list), regenerated codegen output in `graphql/`.
- [x] **T02: 08-first-vertical-slice 02**
  - Build the internal plumbing layer: query key factory, parser, and service functions that translate between the clean public API and Hasura's GraphQL types.

Purpose: The service layer is THE critical translation boundary. It takes simple flat params (ProfileFilter, ProfileSort) and converts them to Hasura's nested `where`/`order_by` objects. This is where the library's value lies — consumers never see `_ilike`, `_eq`, `followed_by_aggregate`, etc.

Output: `keys/profiles.ts` (query key factory), `parsers/profiles.ts` (Hasura → camelCase transform), `services/profiles.ts` (param translation + execute + parse pipeline).
- [x] **T03: 08-first-vertical-slice 03**
  - Create the consumer-facing hooks and wire all profile domain exports through the three entry points — making the full API available for import.

Purpose: This is the plan that makes everything usable. Hooks wrap TanStack Query around the service functions. Entry points expose the right things from the right places (hooks from client, services from server, types from types).

Output: `hooks/profiles.ts` with 3 hooks, updated `index.ts` (hooks + keys), updated `server.ts` (services), updated `types.ts` (profile types). Package builds clean.
- [x] **T04: 08-first-vertical-slice 04**
  - Build the test app profiles playground page that exercises all three profile hooks with live Hasura data — proving the entire vertical slice works end-to-end.

Purpose: This is the ultimate validation. If a developer can load the test app, navigate to /profiles, enter an address, and see real Universal Profile data rendered — the entire document → parser → service → hook architecture works. This page also serves as living documentation for how to use the hooks.

Output: `/profiles` page in the test app with single profile view, list view, and infinite scroll view — all using shadcn/ui components (Card, Skeleton, Alert, Collapsible, Tabs).

## Files Likely Touched

- `packages/react/src/types/profiles.ts`
- `packages/react/src/documents/profiles.ts`
- `packages/react/src/graphql/graphql.ts`
- `packages/react/src/graphql/gql.ts`
- `packages/react/schema.graphql`
- `packages/react/src/keys/profiles.ts`
- `packages/react/src/parsers/profiles.ts`
- `packages/react/src/services/profiles.ts`
- `packages/react/src/hooks/profiles.ts`
- `packages/react/src/index.ts`
- `packages/react/src/server.ts`
- `packages/react/src/types.ts`
- `apps/test/src/app/profiles/page.tsx`
- `apps/test/src/components/nav.tsx`
- `apps/test/src/components/ui/alert.tsx`
- `apps/test/src/components/ui/collapsible.tsx`
- `apps/test/src/components/ui/select.tsx`
- `apps/test/src/components/ui/tabs.tsx`
