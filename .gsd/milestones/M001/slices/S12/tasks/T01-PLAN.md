# T01: 08-first-vertical-slice 01

**Slice:** S12 — **Milestone:** M001

## Description

Create the Profile domain types and GraphQL documents — the foundation layer that everything else builds on.

Purpose: Types define the clean public API contract (camelCase, no Hasura leakage). Documents define the actual GraphQL queries sent to Hasura. Codegen regeneration produces the Hasura filter/aggregate types needed by the service layer.

Output: `types/profiles.ts` with all type definitions, `documents/profiles.ts` with 2 GraphQL document strings (single profile + profile list), regenerated codegen output in `graphql/`.

## Must-Haves

- [ ] 'Profile, ProfileImage, ProfileFilter, ProfileSort, ProfileInclude types exist and are importable'
- [ ] 'GraphQL documents for single profile, profile list, and profile list with aggregate exist'
- [ ] '@include directives on all optional nested fields with Boolean defaults of true'
- [ ] 'Codegen output includes Hasura filter/aggregate/ordering types for universal_profile'

## Files

- `packages/react/src/types/profiles.ts`
- `packages/react/src/documents/profiles.ts`
- `packages/react/src/graphql/graphql.ts`
- `packages/react/src/graphql/gql.ts`
- `packages/react/schema.graphql`
