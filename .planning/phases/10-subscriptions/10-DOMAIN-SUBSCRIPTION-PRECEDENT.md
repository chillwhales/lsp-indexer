# Phase 10 Domain Subscriptions: Precedent from Phase 10.2

**Extracted:** 2026-03-04
**Source:** Phase 10.2 (Profiles Subscription) commit `e45d841`
**Confidence:** HIGH — all patterns verified from actual shipped code
**Purpose:** Every subsequent domain phase (10.3–10.13) MUST follow these patterns

## Summary

Phase 10.2 evolved significantly beyond its original plan. What was planned as a simple monolithic hook became a comprehensive factory-based architecture with full `include`/`sort` support, 3-overload type narrowing, dual-package (react + next) export, node service layer config builders, and integrated playground tabs. **The existing plans for 10.3–10.13 are OUTDATED and must be rewritten.** They reference the OLD monolithic pattern, wrong file locations, and missing features.

**Critical deviations from CONTEXT.md decisions:**

- CONTEXT.md said "no `include` parameter on subscription hooks" → 10.2 ADDED `include` with full 3-overload type narrowing
- CONTEXT.md said "no sort parameter exposed" → 10.2 ADDED `sort` param
- CONTEXT.md placed hooks in `subscriptions/` directory → 10.2 moved everything to `hooks/` directory
- CONTEXT.md was react-only → 10.2 exports from BOTH `@lsp-indexer/react` AND `@lsp-indexer/next`

These deviations are now the established precedent. All subsequent phases follow 10.2, not CONTEXT.md.

---

## Architecture Overview

### The Factory Pattern (3 Layers)

```
Layer 1: Generic factories (shared across ALL domains)
  hooks/factories/create-use-detail.ts      — single-entity query hooks
  hooks/factories/create-use-list.ts        — paginated list query hooks
  hooks/factories/create-use-infinite.ts    — infinite scroll query hooks
  hooks/factories/create-use-subscription.ts — subscription hooks

Layer 2: Domain factories (one set per domain, in hooks/factories/{domain}/)
  hooks/factories/profiles/create-use-profile.ts
  hooks/factories/profiles/create-use-profiles.ts
  hooks/factories/profiles/create-use-infinite-profiles.ts
  hooks/factories/profiles/create-use-profile-subscription.ts

Layer 3: Thin wrappers (one-liner per hook per package)
  React:  hooks/profiles/use-profile.ts            — calls factory with fetchProfile
  React:  hooks/profiles/use-profile-subscription.ts — calls factory with useSubscription
  Next:   hooks/profiles/use-profile.ts            — calls factory with getProfile (server action)
  Next:   hooks/profiles/use-profile-subscription.ts — calls factory with useSubscription
```

### Key Difference: Query vs Subscription Factories

**Query factories** accept a `queryFn` (fetch function):

```typescript
// React wrapper — passes direct Hasura fetch
export const useProfile = createUseProfile((params) => fetchProfile(getClientUrl(), params));

// Next wrapper — passes server action
export const useProfile = createUseProfile(getProfile);
```

**Subscription factories** accept a `useSubscription` hook:

```typescript
// React wrapper — passes React-specific useSubscription
export const useProfileSubscription = createUseProfileSubscription(useSubscription);

// Next wrapper — passes Next-specific useSubscription
export const useProfileSubscription = createUseProfileSubscription(useSubscription);
```

Why the difference: `useSubscription` is already context-bound (different WebSocket context per package). Query factories can be point-free because `fetchProfile` is stateless. Subscription factories need the already-instantiated hook.

---

## File-by-File Checklist per Domain

For each domain X (e.g., `digital-assets`, `nfts`, `followers`), the following files must be created or modified:

### 1. Node Service Layer: `buildXSubscriptionConfig`

**File:** `packages/node/src/services/{domain}.ts`
**Action:** Add `buildXSubscriptionConfig()` function

```typescript
// Pattern from profiles.ts lines 220-242
type RawXSubscriptionRow = XSubscriptionSubscription['{hasura_table}'][number];

export function buildXSubscriptionConfig(params: {
  filter?: XFilter;
  sort?: XSort;         // Only for entity domains with sort support
  limit?: number;
  include?: XInclude;
}) {
  const where = buildXWhere(params.filter);
  const orderBy = buildXOrderBy(params.sort);  // or hardcoded block-order for event domains
  const includeVars = buildXIncludeDirectives(params.include);

  return {
    document: XSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: XSubscriptionSubscription) => result.{hasura_table},
    parser: (raw: RawXSubscriptionRow[]) =>
      params.include ? parseXs(raw, params.include) : parseXs(raw),
  };
}
```

**Also export:** `buildXOrderBy` if it was previously private (profiles had to export `buildProfileOrderBy`).
**Also export:** `buildXIncludeDirectives` if it was previously private.

### 2. Subscription Document

**File:** `packages/node/src/documents/{domain}.ts`
**Action:** Add subscription GraphQL document using `graphql()` tag

```typescript
export const XSubscriptionDocument = graphql(`
  subscription XSubscription(
    $where: {hasura_table}_bool_exp
    $order_by: [{hasura_table}_order_by!]
    $limit: Int
    $includeField1: Boolean! = true
    $includeField2: Boolean! = true
    ...
  ) {
    {hasura_table}(where: $where, order_by: $order_by, limit: $limit) {
      // Same field selection as query document
      // Same @include directives
    }
  }
`);
```

**CRITICAL:** The subscription document mirrors the query document exactly — same fields, same `@include` directives, same variables. The only difference is `subscription` operation type instead of `query`.

### 3. Codegen Regeneration

After adding the subscription document, run codegen to generate the subscription TypeScript types:

```bash
pnpm --filter @lsp-indexer/node codegen
```

This produces types like `XSubscriptionSubscription` in `graphql/graphql.ts` that are needed for the `extract` function and `RawXSubscriptionRow` type alias.

### 4. Subscription Factory

**File:** `packages/react/src/hooks/factories/{domain}/create-use-x-subscription.ts`

```typescript
import { buildXSubscriptionConfig, xKeys } from '@lsp-indexer/node';
import type { PartialX, X, XInclude, XResult, UseSubscriptionReturn } from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseXSubscriptionParams, UseSubscriptionFn } from '../../types';

export function createUseXSubscription(useSubscription: UseSubscriptionFn) {
  // 3 overloads: include → XResult<I>, no include → X, widest → PartialX
  function useXSubscription<const I extends XInclude>(
    params: UseXSubscriptionParams & {
      include: I;
      onData?: (data: XResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<XResult<I>>;
  function useXSubscription(
    params?: Omit<UseXSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: X[]) => void;
    },
  ): UseSubscriptionReturn<X>;
  function useXSubscription(
    params: UseXSubscriptionParams & {
      include?: XInclude;
      onData?: (data: PartialX[]) => void;
    },
  ): UseSubscriptionReturn<PartialX>;
  // Implementation with any[] for onData to avoid contravariance
  function useXSubscription(
    params: UseXSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialX> {
    const {
      filter,
      sort,
      limit = DEFAULT_SUBSCRIPTION_LIMIT,
      include,
      enabled = true,
      invalidate = false,
      onData,
      onReconnect,
    } = params;

    const queryClient = useQueryClient();
    const config = buildXSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [xKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useXSubscription;
}
```

**Key patterns:**

- `onData` is per-overload with narrowed types (NOT on the base params interface)
- Implementation signature uses `any[]` for onData to avoid contravariance conflict
- `useQueryClient()` called unconditionally (Rules of Hooks), only passed when `invalidate: true`
- Config assembly delegated to `buildXSubscriptionConfig` in node service layer
- `DEFAULT_SUBSCRIPTION_LIMIT` (10) imported from constants

### 5. Subscription Types

**File:** `packages/react/src/hooks/types/{domain}.ts`

```typescript
export interface UseXSubscriptionParams {
  filter?: XFilter;
  sort?: XSort; // Only for domains with sort support
  limit?: number;
  include?: XInclude;
  enabled?: boolean;
  invalidate?: boolean;
  onReconnect?: () => void;
  // NOTE: onData is NOT here — it's per-overload in the factory
}
```

**Update:** `packages/react/src/hooks/types/index.ts` to export the new types.

### 6. React Thin Wrapper

**File:** `packages/react/src/hooks/{domain}/use-x-subscription.ts`

```typescript
import { createUseXSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

export const useXSubscription = createUseXSubscription(useSubscription);
```

That's it. 3 lines + import.

### 7. Next.js Thin Wrapper

**File:** `packages/next/src/hooks/{domain}/use-x-subscription.ts`

```typescript
'use client';

import { createUseXSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

export const useXSubscription = createUseXSubscription(useSubscription);
```

**CRITICAL:** Next.js wrappers MUST have `'use client'` directive at top.
**CRITICAL:** Next.js imports factory from `@lsp-indexer/react`, NOT relative path.
**CRITICAL:** Next.js imports `useSubscription` from `../use-subscription` (its own package-specific version).

### 8. Factory Barrel Export

**File:** `packages/react/src/hooks/factories/{domain}/index.ts`

```typescript
export * from './create-use-x';
export * from './create-use-xs';
export * from './create-use-infinite-xs';
export * from './create-use-x-subscription';
```

**Update:** `packages/react/src/hooks/factories/index.ts` to add `export * from './{domain}';`

### 9. Hook Barrel Export

**File:** `packages/react/src/hooks/{domain}/index.ts`

```typescript
export * from './use-x';
export * from './use-xs';
export * from './use-infinite-xs';
export * from './use-x-subscription';
```

### 10. Next.js Hook Barrel Export

**File:** `packages/next/src/hooks/{domain}/index.ts`

```typescript
export * from './use-x';
export * from './use-xs';
export * from './use-infinite-xs';
export * from './use-x-subscription';
```

### 11. Playground Integration

**File:** `apps/test/src/app/{domain}/page.tsx`

The subscription tab is added to the EXISTING domain page (NOT a separate `/subscriptions` page). Pattern from profiles:

```typescript
function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useXSubscription } = useHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useXSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });

  // Connection/subscription status badges
  // Invalidate toggle switch
  // Filter controls (shared with list/infinite tabs)
  // Sort controls
  // Include toggles
  // ResultsList with subscription data
}
```

**Add Subscription tab to the tabs array:**

```typescript
{
  value: 'subscription',
  label: 'Subscription',
  icon: <Radio className="size-4" />,
  render: (mode) => <SubscriptionTab mode={mode} />,
}
```

**Import mode-switching hooks:**

```typescript
import {
  useXSubscription as useXSubscriptionNext,
  // ... other hooks
} from '@lsp-indexer/next';
import {
  useXSubscription as useXSubscriptionReact,
  // ... other hooks
} from '@lsp-indexer/react';
```

---

## Query Hook Refactoring Decision

### Current State

Only **profiles** has been refactored to the factory pattern. All other 11 domains still use the OLD monolithic pattern:

| Domain         | react hooks                          | next hooks                           | Factory pattern? |
| -------------- | ------------------------------------ | ------------------------------------ | ---------------- |
| profiles       | `hooks/profiles/` (directory)        | `hooks/profiles/` (directory)        | ✅ YES           |
| digital-assets | `hooks/digital-assets.ts` (monolith) | `hooks/digital-assets.ts` (monolith) | ❌ NO            |
| nfts           | `hooks/nfts.ts` (monolith)           | `hooks/nfts.ts` (monolith)           | ❌ NO            |
| ... all others | monolith                             | monolith                             | ❌ NO            |

### Recommendation: Refactor EACH Domain During Its Subscription Phase

Each 10.X phase should:

1. **Refactor** the existing monolithic `hooks/{domain}.ts` into factory-based `hooks/factories/{domain}/` + `hooks/{domain}/` directory
2. **Add** the subscription factory + thin wrappers
3. **Refactor** the next.js monolithic hooks to use shared factories from `@lsp-indexer/react`

**Why refactor query hooks too:**

- The generic factories (`createUseDetail`, `createUseList`, `createUseInfinite`) already exist and are proven
- The domain directory structure (`hooks/{domain}/`) is needed for the subscription file anyway
- Doing it atomically per domain keeps PRs focused
- The next.js package currently duplicates ~250 lines per domain — factories reduce to ~5 lines per hook
- Consistency across the codebase

**What the refactoring looks like for each domain:**

Before (monolith):

```
packages/react/src/hooks/digital-assets.ts     (268 lines)
packages/next/src/hooks/digital-assets.ts      (247 lines)
```

After (factory + wrappers):

```
packages/react/src/hooks/factories/digital-assets/
  create-use-digital-asset.ts                    (~65 lines)
  create-use-digital-assets.ts                   (~70 lines)
  create-use-infinite-digital-assets.ts          (~73 lines)
  create-use-digital-asset-subscription.ts       (~104 lines)
  index.ts                                       (4 lines)

packages/react/src/hooks/digital-assets/
  use-digital-asset.ts                           (~35 lines — one-liner)
  use-digital-assets.ts                          (~38 lines — one-liner)
  use-infinite-digital-assets.ts                 (~50 lines — one-liner)
  use-digital-asset-subscription.ts              (~12 lines — one-liner)
  index.ts                                       (4 lines)

packages/next/src/hooks/digital-assets/
  use-digital-asset.ts                           (~37 lines — one-liner)
  use-digital-assets.ts                          (~39 lines — one-liner)
  use-infinite-digital-assets.ts                 (~48 lines — one-liner)
  use-digital-asset-subscription.ts              (~15 lines — one-liner)
  index.ts                                       (4 lines)
```

---

## Domain Classification

### Entity Domains (sort optional, Hasura default ordering)

| Phase | Domain           | Hasura Table            | Hook Name                       | Sort Support                  |
| ----- | ---------------- | ----------------------- | ------------------------------- | ----------------------------- |
| 10.3  | Digital Assets   | `digital_asset`         | `useDigitalAssetSubscription`   | Yes (name, holderCount, etc.) |
| 10.4  | NFTs             | `nft`                   | `useNftSubscription`            | Yes (name, isBurned, etc.)    |
| 10.5  | Owned Assets     | `owned_asset`           | `useOwnedAssetSubscription`     | Yes (digitalAssetName, etc.)  |
| 10.6  | Owned Tokens     | `owned_token`           | `useOwnedTokenSubscription`     | Yes                           |
| 10.8  | Creators         | `creator`               | `useCreatorSubscription`        | Yes (arrayIndex, etc.)        |
| 10.9  | Issued Assets    | `issued_asset`          | `useIssuedAssetSubscription`    | Yes (arrayIndex, etc.)        |
| 10.10 | Encrypted Assets | `lsp29_encrypted_asset` | `useEncryptedAssetSubscription` | Yes                           |

### Event Domains (block-order desc mandatory sort)

| Phase | Domain                | Hasura Table                  | Hook Name                                | Default Sort                                                |
| ----- | --------------------- | ----------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| 10.7  | Followers             | `follower`                    | `useFollowerSubscription`                | `block_number desc, transaction_index desc, log_index desc` |
| 10.11 | Data Changed Events   | `data_changed_event`          | `useDataChangedEventSubscription`        | `block_number desc, transaction_index desc, log_index desc` |
| 10.12 | Token ID Data Changed | `token_id_data_changed_event` | `useTokenIdDataChangedEventSubscription` | `block_number desc, transaction_index desc, log_index desc` |
| 10.13 | Universal Receiver    | `universal_receiver_event`    | `useUniversalReceiverEventSubscription`  | `block_number desc, transaction_index desc, log_index desc` |

**Event domains:** Sort param should still be accepted but default to block-order desc. The `buildXOrderBy` function handles this.

---

## Domain-Specific Complexity Notes

### Domains with nested relation includes

Some domains have complex include configs with nested sub-includes. The subscription document needs to mirror the query document's `@include` directives:

| Domain                | Include Complexity                                                       | Nested Relations                                                        |
| --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Profiles              | Simple — 9 boolean fields                                                | None                                                                    |
| Digital Assets        | Medium — 18 boolean fields                                               | None                                                                    |
| NFTs                  | High — NFT fields + collection (DA) + holder (Profile)                   | `collection: DigitalAssetInclude`, `holder: ProfileInclude`             |
| Owned Assets          | High — OA fields + digitalAsset (DA) + universalProfile (Profile)        | `digitalAsset: DigitalAssetInclude`, `universalProfile: ProfileInclude` |
| Owned Tokens          | Highest — OT fields + nft + ownedAsset + digitalAsset + universalProfile | 4 nested relations                                                      |
| Followers             | Medium — follower/followed profile sub-includes                          | `followerProfile: ProfileInclude`, `followedProfile: ProfileInclude`    |
| Creators              | High — creator + profile + digitalAsset                                  | `profile: ProfileInclude`, `digitalAsset: DigitalAssetInclude`          |
| Issued Assets         | High — same as creators pattern                                          | `issuerProfile: ProfileInclude`, `digitalAsset: DigitalAssetInclude`    |
| Encrypted Assets      | High — EA fields + universalProfile                                      | `universalProfile: ProfileInclude`, `encryption: EncryptionInclude`     |
| Data Changed Events   | Medium — event + universalProfile + digitalAsset                         | `universalProfile: ProfileInclude`, `digitalAsset: DigitalAssetInclude` |
| Token ID Data Changed | Medium — event + digitalAsset + nft                                      | `digitalAsset: DigitalAssetInclude`, `nft: NftInclude`                  |
| Universal Receiver    | Highest — event + universalProfile + fromProfile + fromAsset             | 3 relations, 46 GraphQL variables                                       |

### Domains without singular hooks (no detail factory needed)

- Creators — no `useCreator` (no natural key)
- Issued Assets — no `useIssuedAsset` (no natural key)
- Encrypted Assets — no `useEncryptedAsset` (no natural key)

### Domains with special query hooks

- Data Changed Events — has `useLatestDataChangedEvent` (latest hook, not detail)
- Token ID Data Changed Events — has `useLatestTokenIdDataChangedEvent`
- Followers — has `useFollowCount` and `useIsFollowing` (separate from list hooks)

These special hooks DON'T need subscription counterparts but DO need factory refactoring.

---

## Existing Plan Deficiencies (10.3–10.13)

The current plans in `.planning/phases/10.{3-13}-*/10.X-01-PLAN.md` have these issues:

1. **Wrong file locations:** Plans put hooks in `packages/react/src/subscriptions/` — should be `packages/react/src/hooks/`
2. **No factory pattern:** Plans create monolithic hooks — should use `createUseXSubscription` factory
3. **No `include` or `sort` params:** Plans only have `filter`, `limit` — should have full `include` + `sort`
4. **No 3-overload type narrowing:** Plans have single return type — should have 3 overloads
5. **No `@lsp-indexer/next` export:** Plans only export from react — should export from both packages
6. **No node service `buildXSubscriptionConfig`:** Plans inline config — should delegate to service layer
7. **No subscription document creation:** Plans reference documents that don't exist
8. **No codegen step:** After adding subscription document, codegen must run
9. **No query hook refactoring:** Plans don't refactor existing monolithic hooks to factory pattern
10. **Wrong playground pattern:** Plans add to `/subscriptions` page — should add tab to existing domain page
11. **No domain types:** Plans don't create `UseXSubscriptionParams` type

---

## Step-by-Step Execution Template

For each domain subscription phase (10.3–10.13):

### Step 1: Node Service Layer

1. Add subscription document to `packages/node/src/documents/{domain}.ts`
2. Run codegen: `pnpm --filter @lsp-indexer/node codegen`
3. Export `buildXOrderBy` and `buildXIncludeDirectives/Vars` if not already exported
4. Add `buildXSubscriptionConfig` to `packages/node/src/services/{domain}.ts`
5. Export new function from `packages/node/src/index.ts` if needed

### Step 2: React Factory + Types

1. Create domain factory dir: `packages/react/src/hooks/factories/{domain}/`
2. Create query factories: `create-use-x.ts`, `create-use-xs.ts`, `create-use-infinite-xs.ts`
3. Create subscription factory: `create-use-x-subscription.ts`
4. Create factory barrel: `factories/{domain}/index.ts`
5. Update `factories/index.ts` to export new domain
6. Add subscription types to `hooks/types/{domain}.ts`
7. Update `hooks/types/index.ts`

### Step 3: React Thin Wrappers

1. Create hook dir: `packages/react/src/hooks/{domain}/`
2. Create per-hook files: `use-x.ts`, `use-xs.ts`, `use-infinite-xs.ts`, `use-x-subscription.ts`
3. Create hook barrel: `hooks/{domain}/index.ts`
4. Delete old monolithic: `packages/react/src/hooks/{domain}.ts`
5. Update `hooks/index.ts` — change `export * from './{domain}'` (still works, now points to directory)

### Step 4: Next.js Thin Wrappers

1. Create hook dir: `packages/next/src/hooks/{domain}/`
2. Create per-hook files with `'use client'` + factory import from `@lsp-indexer/react`
3. Add `use-x-subscription.ts` with `'use client'` + factory + next `useSubscription`
4. Create hook barrel: `hooks/{domain}/index.ts`
5. Delete old monolithic: `packages/next/src/hooks/{domain}.ts`
6. Update `hooks/index.ts` if needed (already uses `export * from './{domain}'`)

### Step 5: Playground

1. Add `useXSubscription` to the `useHooks(mode)` function in existing domain page
2. Import from both `@lsp-indexer/react` and `@lsp-indexer/next` with aliases
3. Create `SubscriptionTab` component with status badges, filter/sort/include controls, invalidate toggle
4. Add tab to `PlaygroundPageLayout` tabs array

### Step 6: Build + Verify

```bash
pnpm build
```

Verify: subscription hook exported from both packages, playground builds, types inferred.

---

## Common Pitfalls

### Pitfall 1: Forgetting Codegen After Adding Subscription Document

**What:** Adding `XSubscriptionDocument` but forgetting to run codegen
**Impact:** `XSubscriptionSubscription` type doesn't exist, TypeScript fails
**Prevention:** Always run `pnpm --filter @lsp-indexer/node codegen` after adding document

### Pitfall 2: Missing `'use client'` in Next.js Wrappers

**What:** Next.js hook file without `'use client'` directive
**Impact:** Build fails with "cannot use React hooks in server component"
**Prevention:** Every file in `packages/next/src/hooks/` that exports a hook MUST have `'use client'`

### Pitfall 3: Wrong useSubscription Import in Next.js

**What:** Importing `useSubscription` from `@lsp-indexer/react` instead of `../use-subscription`
**Impact:** Uses wrong WebSocket context (React direct vs Next.js proxy)
**Prevention:** Next.js subscription wrappers always import from `../use-subscription` (local)

### Pitfall 4: onData on Base Params

**What:** Putting `onData` on `UseXSubscriptionParams` interface
**Impact:** Type narrowing breaks — `onData(data: PartialX[])` for all overloads
**Prevention:** `onData` is per-overload in the factory, NOT on the base params

### Pitfall 5: Not Exporting Service Functions

**What:** `buildXOrderBy` or `buildXIncludeDirectives` not exported from node
**Impact:** Factory can't import them
**Prevention:** Check that all builder functions used by `buildXSubscriptionConfig` are exported

### Pitfall 6: Subscription Document Mismatching Query Document

**What:** Subscription document has different fields than query document
**Impact:** Parsers fail or return incomplete data
**Prevention:** Copy field selection from query document, change only operation type to `subscription`

### Pitfall 7: Forgetting to Delete Old Monolithic Files

**What:** Old `hooks/{domain}.ts` monolith still exists alongside new `hooks/{domain}/` directory
**Impact:** Duplicate exports, barrel confusion
**Prevention:** Delete old monolith after creating new directory structure

---

## Sources

All patterns verified from actual shipped code at commit `e45d841`:

- `packages/react/src/hooks/factories/profiles/create-use-profile-subscription.ts` — subscription factory pattern
- `packages/react/src/hooks/factories/profiles/create-use-profile.ts` — query detail factory pattern
- `packages/react/src/hooks/factories/profiles/create-use-profiles.ts` — query list factory pattern
- `packages/react/src/hooks/factories/profiles/create-use-infinite-profiles.ts` — query infinite factory pattern
- `packages/react/src/hooks/factories/create-use-subscription.ts` — generic subscription hook
- `packages/react/src/hooks/profiles/use-profile-subscription.ts` — react thin wrapper
- `packages/next/src/hooks/profiles/use-profile-subscription.ts` — next thin wrapper
- `packages/node/src/services/profiles.ts` — `buildProfileSubscriptionConfig` pattern
- `packages/node/src/documents/profiles.ts` — subscription document pattern
- `packages/react/src/hooks/types/profiles.ts` — `UseProfileSubscriptionParams` pattern
- `packages/react/src/hooks/types/subscription.ts` — `UseSubscriptionFn` type
- `apps/test/src/app/profiles/page.tsx` — playground integration pattern

---

_Extracted: 2026-03-04_
_Source: Phase 10.2 commit e45d841_
