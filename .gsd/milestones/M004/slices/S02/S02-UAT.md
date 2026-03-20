# S02: Build Validation & Docs — UAT

**Milestone:** M004
**Written:** 2026-03-20

## UAT Type

- UAT mode: mixed (artifact-driven build checks + live-runtime playground verification)
- Why this mode is sufficient: Build validation is fully artifact-driven (exit codes). Playground page requires a live Hasura endpoint for runtime verification of hook behavior.

## Preconditions

- All 5 packages build clean: `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build && pnpm --filter=docs build`
- Docs app dev server running: `pnpm --filter=docs dev` (for playground testing)
- `.env` configured with `NEXT_PUBLIC_HASURA_URL` pointing to a live Hasura instance with follower data

## Smoke Test

Navigate to `http://localhost:3000/mutual-follows` — the page loads with 6 tabs, two address inputs visible, and no console errors.

## Test Cases

### 1. Playground page renders with all 6 tabs

1. Start docs dev server: `pnpm --filter=docs dev`
2. Navigate to `http://localhost:3000/mutual-follows`
3. **Expected:** Page title shows "Mutual Follows". Six tabs visible: "Mutual Follows", "∞ Mutual Follows", "Mutual Followers", "∞ Mutual Followers", "By My Follows", "∞ By My Follows".

### 2. Nav sidebar shows mutual-follows link

1. Navigate to `http://localhost:3000`
2. Open the sidebar navigation
3. **Expected:** A "Mutual Follows" link with UsersRound icon appears in the Playground section, between the follows and other playground links.

### 3. Mutual Follows tab returns results with valid addresses

1. Navigate to `/mutual-follows`
2. On the "Mutual Follows" tab, enter two known LUKSO addresses that share mutual follows in the `addressA` and `addressB` inputs
3. Click search / trigger the query
4. **Expected:** ProfileCard components render showing profiles both addresses follow. Each card shows the profile name and address.

### 4. Include toggles narrow returned data

1. On the "Mutual Follows" tab with results loaded
2. Toggle on additional include fields (e.g., LSP3Profile, tags, images)
3. **Expected:** ProfileCards update to show additional profile data matching the toggled fields. No TypeScript errors in console.

### 5. HookMode toggle switches between React and Next.js

1. On any tab, toggle HookMode from "React" to "Next.js"
2. **Expected:** The hook source switches — React mode calls Hasura directly via `getClientUrl()`, Next.js mode routes through server actions. Results should be identical for the same inputs.

### 6. Infinite scroll tabs load more results

1. Switch to the "∞ Mutual Follows" tab
2. Enter two addresses with many mutual follows
3. Scroll to the bottom or click "Load More"
4. **Expected:** Additional profiles append to the list. The page count increments. No duplicate profiles appear.

### 7. Followed By My Follows uses correct parameter names

1. Switch to "By My Follows" tab
2. **Expected:** Input labels show `myAddress` and `targetAddress` (not `addressA`/`addressB`)
3. Enter valid addresses
4. **Expected:** Results show profiles from myAddress's following list that also follow targetAddress.

### 8. Node docs list mutual follow functions

1. Navigate to `http://localhost:3000/docs/node`
2. Find the fetch functions table
3. **Expected:** A "Mutual Follows" row lists `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows` with descriptions.

### 9. React docs list all 6 hooks

1. Navigate to `http://localhost:3000/docs/react`
2. Find the Available Domains table
3. **Expected:** A "Mutual Follows" row lists all 6 hooks. A dedicated "Mutual Follow Hooks" section shows usage examples with `addressA`/`addressB` params and include narrowing.

### 10. Next.js docs list server actions and hooks

1. Navigate to `http://localhost:3000/docs/next`
2. Find the server actions table
3. **Expected:** A "Mutual Follows" row lists `getMutualFollows`, `getMutualFollowers`, `getFollowedByMyFollows`. A hook→action mapping table shows all 6 hooks. Usage examples include both client-side and server component patterns.

## Edge Cases

### Empty intersection

1. Enter two addresses that follow completely different profiles
2. **Expected:** Mutual Follows tab returns an empty list with no error — just "no results" state.

### Invalid address format

1. Enter an invalid address (e.g., "not-an-address") in addressA
2. **Expected:** Zod validation rejects the input. ErrorAlert displays a VALIDATION error.

### Single address missing

1. Enter only addressA, leave addressB empty
2. **Expected:** Query does not fire (hook stays disabled/idle). No error shown until both addresses are provided.

### Sort controls change result order

1. Load results on any base (non-infinite) tab
2. Change sort field (e.g., from default to a different ProfileSortField)
3. **Expected:** Results re-order according to the selected sort field.

## Failure Signals

- Console shows JavaScript errors or unhandled promise rejections
- Any tab shows ErrorAlert with unexpected error category (not NETWORK when Hasura is down)
- Build commands exit non-zero
- Docs pages show MDX parse errors or missing content sections
- ProfileCard renders with missing/undefined data despite include fields being toggled on

## Not Proven By This UAT

- Production Hasura query performance under load — this UAT uses dev-mode queries only
- WebSocket subscription behavior for mutual follow changes — these hooks are query-only, not subscriptions
- Cross-browser compatibility of the playground page

## Notes for Tester

- The playground page requires a live Hasura instance with real follower data. Without it, all tabs will show NETWORK errors — this is expected.
- Use LUKSO mainnet addresses that are known to have follower relationships for meaningful test data.
- The HookMode toggle requires the docs app's `.env` to have both `NEXT_PUBLIC_HASURA_URL` (for React mode) and server-side Hasura URL config (for Next.js mode).
- Build validation (test cases 8-10) can be done without a live Hasura — just run the docs dev server and navigate to docs pages.
