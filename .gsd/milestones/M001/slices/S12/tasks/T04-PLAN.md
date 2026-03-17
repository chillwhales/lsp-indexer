# T04: 08-first-vertical-slice 04

**Slice:** S12 — **Milestone:** M001

## Description

Build the test app profiles playground page that exercises all three profile hooks with live Hasura data — proving the entire vertical slice works end-to-end.

Purpose: This is the ultimate validation. If a developer can load the test app, navigate to /profiles, enter an address, and see real Universal Profile data rendered — the entire document → parser → service → hook architecture works. This page also serves as living documentation for how to use the hooks.

Output: `/profiles` page in the test app with single profile view, list view, and infinite scroll view — all using shadcn/ui components (Card, Skeleton, Alert, Collapsible, Tabs).

## Must-Haves

- [ ] 'Developer can navigate to /profiles in test app and see profile playground UI'
- [ ] 'Developer can enter an address and see typed Universal Profile data rendered'
- [ ] 'Developer can see loading skeleton while data fetches'
- [ ] 'Developer can see error alert when fetch fails or address is invalid'
- [ ] 'Developer can click preset address buttons to quickly load known profiles'
- [ ] 'Developer can toggle raw JSON view for debugging'
- [ ] 'Developer can see useProfiles list with filtering'
- [ ] 'Developer can see useInfiniteProfiles with load more / infinite scroll'

## Files

- `apps/test/src/app/profiles/page.tsx`
- `apps/test/src/components/nav.tsx`
- `apps/test/src/components/ui/alert.tsx`
- `apps/test/src/components/ui/collapsible.tsx`
- `apps/test/src/components/ui/select.tsx`
- `apps/test/src/components/ui/tabs.tsx`
