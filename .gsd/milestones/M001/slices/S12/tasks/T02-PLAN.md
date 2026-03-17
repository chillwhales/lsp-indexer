# T02: 08-first-vertical-slice 02

**Slice:** S12 — **Milestone:** M001

## Description

Build the internal plumbing layer: query key factory, parser, and service functions that translate between the clean public API and Hasura's GraphQL types.

Purpose: The service layer is THE critical translation boundary. It takes simple flat params (ProfileFilter, ProfileSort) and converts them to Hasura's nested `where`/`order_by` objects. This is where the library's value lies — consumers never see `_ilike`, `_eq`, `followed_by_aggregate`, etc.

Output: `keys/profiles.ts` (query key factory), `parsers/profiles.ts` (Hasura → camelCase transform), `services/profiles.ts` (param translation + execute + parse pipeline).

## Must-Haves

- [ ] 'Query key factory produces unique keys for detail, list, and infinite queries'
- [ ] 'Parser transforms raw Hasura response to clean Profile type with camelCase, null coalescing, and array defaults'
- [ ] 'Service functions translate flat ProfileFilter/ProfileSort to Hasura where/order_by and return parsed results'
- [ ] 'Consumers never see Hasura types — service layer is the translation boundary'

## Files

- `packages/react/src/keys/profiles.ts`
- `packages/react/src/parsers/profiles.ts`
- `packages/react/src/services/profiles.ts`
