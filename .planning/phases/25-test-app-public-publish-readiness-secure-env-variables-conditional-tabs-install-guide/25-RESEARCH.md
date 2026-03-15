# Phase 25: Test App Public Publish Readiness - Research

**Researched:** 2026-03-15
**Domain:** Next.js app security hardening, conditional UI, developer onboarding
**Confidence:** HIGH

## Summary

The test app (`apps/test`) is a Next.js 16 (App Router) playground that exercises all 4 `@lsp-indexer` packages across 12 domain pages. It currently has two critical problems blocking public publication:

1. **The home page (`src/app/page.tsx`) displays raw `process.env` values** for all 4 env variables — including `INDEXER_URL` and `INDEXER_WS_URL` which are server-only secrets. Since `page.tsx` is a React Server Component (no `'use client'` directive), the values are rendered into the HTML payload sent to the browser. While `NEXT_PUBLIC_*` vars are inherently client-visible, the `INDEXER_URL` and `INDEXER_WS_URL` values should never appear in HTML output.

2. **Every domain page shows both Client and Server mode buttons unconditionally**, even when the required env variables for one mode aren't configured. The Client mode (`@lsp-indexer/react`) needs `NEXT_PUBLIC_INDEXER_URL`; the Server mode (`@lsp-indexer/next`) needs `INDEXER_URL`. If only one set is configured, the other mode will crash at runtime with `IndexerError: MISSING_ENV_VAR`.

The fix is straightforward: replace the env-dumping home page with a quick install guide, pass env-availability flags to the `PlaygroundPageLayout` component to conditionally hide mode buttons, and verify no server secrets leak to the client bundle.

**Primary recommendation:** Remove all `process.env` display from the home page, replace with install guide content, and add a server-side env detection mechanism that passes boolean availability flags (not values) to client components for conditional tab rendering.

## Standard Stack

### Core (already in use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.0.0 | App Router framework | Already the test app's foundation |
| React | ^19.0.0 | UI | Already in use |
| Tailwind CSS | ^4.1.18 | Styling | Already in use |
| shadcn/ui (radix-ui) | ^1.4.3 | Component library | Already provides Card, Badge, Tabs, etc. |
| lucide-react | ^0.574.0 | Icons | Already in use |

### Supporting (no new deps needed)
This phase requires zero new dependencies. Everything needed is already available in the stack.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server-side boolean flags | `publicRuntimeConfig` from next.config | Deprecated in App Router — use server components or env detection |

**Installation:** No new packages needed.

## Architecture Patterns

### Current App Structure
```
apps/test/src/
├── app/
│   ├── page.tsx                              # HOME — RSC, currently dumps env vars
│   ├── layout.tsx                            # Root layout — RSC, wraps Providers
│   ├── providers.tsx                         # 'use client' — QueryClient, subscriptions, theme
│   ├── globals.css                           # Tailwind CSS
│   ├── profiles/page.tsx                     # 'use client' — domain playground
│   ├── digital-assets/page.tsx               # 'use client' — domain playground
│   ├── nfts/page.tsx                         # 'use client' — domain playground
│   ├── owned-assets/page.tsx                 # 'use client' — domain playground
│   ├── owned-tokens/page.tsx                 # 'use client' — domain playground
│   ├── follows/page.tsx                      # 'use client' — domain playground
│   ├── creators/page.tsx                     # 'use client' — domain playground
│   ├── issued-assets/page.tsx                # 'use client' — domain playground
│   ├── encrypted-assets/page.tsx             # 'use client' — domain playground
│   ├── data-changed-events/page.tsx          # 'use client' — domain playground
│   ├── token-id-data-changed-events/page.tsx # 'use client' — domain playground
│   └── universal-receiver-events/page.tsx    # 'use client' — domain playground
├── components/
│   ├── nav.tsx                               # 'use client' — sidebar with domain links
│   ├── connection-status.tsx                 # 'use client' — validates client import
│   ├── playground/
│   │   ├── page-layout.tsx                   # 'use client' — PlaygroundPageLayout with Client/Server toggle
│   │   ├── index.ts                          # Barrel exports
│   │   └── ...                               # Filter, sort, include, results components
│   └── ...                                   # Domain card components
├── hooks/
│   ├── use-debounce.ts
│   └── use-mobile.ts
├── lib/utils.ts
└── instrumentation.ts                        # Server-only — starts WS proxy
```

### Pattern 1: Environment Variable Architecture (Current)

**What:** 4 env variables control the test app, split across client/server boundaries:

| Variable | Scope | Used By | Required For |
|----------|-------|---------|-------------|
| `NEXT_PUBLIC_INDEXER_URL` | Client + Server | `@lsp-indexer/react` hooks (via `getClientUrl()`) | Client mode (Browser → Hasura directly) |
| `INDEXER_URL` | Server only | `@lsp-indexer/next` server actions (via `getServerUrl()`) | Server mode (Browser → Server Action → Hasura) |
| `NEXT_PUBLIC_INDEXER_WS_URL` | Client + Server | `@lsp-indexer/react` subscriptions (via `getClientWsUrl()`) | Client subscriptions |
| `INDEXER_WS_URL` | Server only | `@lsp-indexer/next` WS proxy (via `getServerWsUrl()`) | Server subscriptions |
| `WS_PROXY_PORT` | Server only | `instrumentation.ts` — proxy listen port | WS proxy (defaults to 4000) |
| `INDEXER_ALLOWED_ORIGINS` | Server only | Not used by app directly (in `.env`) | CORS (external) |

**Critical insight:** `getServerUrl()` falls back to `NEXT_PUBLIC_INDEXER_URL` if `INDEXER_URL` is not set. This means setting only `NEXT_PUBLIC_INDEXER_URL` enables BOTH modes (client directly, server via fallback). The conditional tab logic must account for this.

### Pattern 2: Client/Server Mode Toggle (Current)

**What:** `PlaygroundPageLayout` (`src/components/playground/page-layout.tsx`) renders a Client/Server toggle button pair. Each domain page passes tab configs with a `render(mode: HookMode)` function. The `mode` parameter (`'client' | 'server'`) selects which hook set to use.

**How it works:**
1. `PlaygroundPageLayout` renders two buttons: Client (`@lsp-indexer/react`) and Server (`@lsp-indexer/next`)
2. `mode` state is stored in the layout component
3. `key={mode}` on the `<Tabs>` component forces full remount when switching modes (avoids hook-rule violations)
4. Each domain page has a `useHooks(mode)` helper that returns either React or Next hook set

**Problem:** Both buttons are always rendered. If only one side's env vars are configured, clicking the other mode will crash at runtime.

**Note on fallback behavior:** The underlying `getServerUrl()` falls back to `NEXT_PUBLIC_INDEXER_URL`, and `getServerWsUrl()` can derive from `getServerUrl()`. So technically, server mode *could* work with only `NEXT_PUBLIC_*` vars set. However, we intentionally use **strict gating** for the tab UI — the table below reflects the *policy decision*, not raw fallback capabilities:

| Env Set | Client Tab Shown | Server Tab Shown | Policy Rationale |
|---------|-----------------|-----------------|------------------|
| `NEXT_PUBLIC_INDEXER_URL` only | ✓ | ✗ | Server tab requires explicit `INDEXER_URL` — fallback behavior is a convenience, not a signal that server mode is intentionally configured |
| `INDEXER_URL` only | ✗ | ✓ | Client tab requires `NEXT_PUBLIC_INDEXER_URL` |
| Both set | ✓ | ✓ | Both modes explicitly configured |
| Neither | ✗ | ✗ | Nothing configured |

The user's requirement is clear: "if only server side is set or only client side is set, don't show the tabs." The strict detection approach:
- Show **Client** button only if `NEXT_PUBLIC_INDEXER_URL` is set
- Show **Server** button only if `INDEXER_URL` is set
- If both set, show both (current behavior)
- If only one set, auto-select that mode and hide the toggle entirely

### Pattern 3: Passing Server-Side Env Availability to Client Components

**What:** Since all 12 domain pages use `'use client'`, they can't read `process.env.INDEXER_URL` directly (server-only vars aren't bundled into client JS). The availability flags need to flow from server → client.

**Recommended approach:** Create a server component wrapper or use the existing `layout.tsx` (which is an RSC) to detect env availability and pass boolean flags down. Two clean options:

**Option A — Props through layout (simplest):**
Add an `EnvContext` provider initialized in `layout.tsx` (RSC) that passes `{ hasClientUrl: boolean, hasServerUrl: boolean, hasClientWs: boolean, hasServerWs: boolean }` to a client-side context. The `PlaygroundPageLayout` reads from this context.

**Option B — Server action check:**
A server action `getEnvAvailability()` called once by the provider. Slightly more complex, no real benefit over Option A.

**Recommendation:** Option A. The layout already wraps everything in `<Providers>`. Add an `<EnvProvider>` that receives boolean props computed in the RSC layout. This is zero-dependency, fully type-safe, and doesn't expose any values.

### Pattern 4: Home Page Replacement

**Current home page (`page.tsx`):**
1. "Package Status" card — validates all 4 `@lsp-indexer/*` imports resolve
2. "Environment" card — **displays raw env var values** via `EnvRow` components using `process.env.*`
3. `<ConnectionStatus />` — validates client-side import

**New home page should be:**
1. Quick install guide — how to install `@lsp-indexer` packages, set env vars, wrap providers
2. Keep the package status validation (useful for debugging, doesn't leak secrets)
3. Show env configuration status with **boolean indicators** (set/not-set) without showing actual values

### Anti-Patterns to Avoid
- **Rendering `process.env.*` values in HTML output:** Even in RSCs, the values get serialized into the HTML. Never display server-only env var values to users.
- **Using `NEXT_PUBLIC_` for server-only secrets:** The `INDEXER_URL` and `INDEXER_WS_URL` are correctly NOT prefixed — this is right. Don't change it.
- **Checking env vars at build time:** Env vars should be checked at runtime. Next.js inlines `NEXT_PUBLIC_*` at build time, but server-only vars are read at runtime.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering for install guide | Custom markdown parser | Static JSX with shadcn/ui components | Install guide is static content — JSX is simpler and type-safe |
| Env var validation | Custom validation | Existing `getClientUrl()`/`getServerUrl()` pattern | Already throws `IndexerError` with helpful messages |
| Client/Server context | Custom subscription pattern | React Context + RSC props | Standard Next.js pattern, already used for other contexts |

**Key insight:** The test app already has all the patterns needed. This phase is about restricting/conditionally rendering existing UI, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Leaking Server Env Vars Through RSC Serialization
**What goes wrong:** Even though `page.tsx` is a server component, `process.env.INDEXER_URL` rendered into JSX gets serialized into the HTML response. Any user can View Source and see the value.
**Why it happens:** RSCs render on the server but their output is HTML sent to the client. The HTML contains the rendered values, not the code.
**How to avoid:** Never render env var values. Only render boolean indicators (checkmark/X for set/not-set).
**Warning signs:** `process.env.SOME_SECRET` appearing in any JSX expression that produces visible output.

### Pitfall 2: NEXT_PUBLIC_ Variables Are Always Client-Visible
**What goes wrong:** Treating `NEXT_PUBLIC_INDEXER_URL` as a secret.
**Why it happens:** Misunderstanding Next.js env scoping. `NEXT_PUBLIC_*` vars are inlined into the client JS bundle at build time.
**How to avoid:** Accept that `NEXT_PUBLIC_INDEXER_URL` is inherently public. The Hasura endpoint URL being public is fine — it's the server-side `INDEXER_URL` (which might point to an internal endpoint or carry auth) that must stay private.
**Warning signs:** N/A — this is actually correct behavior, not a bug.

### Pitfall 3: getServerUrl() Fallback Behavior
**What goes wrong:** Assuming server mode requires `INDEXER_URL` to be set, when in reality `getServerUrl()` falls back to `NEXT_PUBLIC_INDEXER_URL`.
**Why it happens:** Not reading the `env.ts` implementation carefully.
**How to avoid:** For conditional tab display, check `INDEXER_URL` explicitly rather than relying on `getServerUrl()` not throwing.
**Warning signs:** Server mode appearing available when only `NEXT_PUBLIC_INDEXER_URL` is set, but subscriptions failing because `INDEXER_WS_URL` isn't set.

### Pitfall 4: Providers Wrapping Subscriptions When WS Isn't Available
**What goes wrong:** `providers.tsx` unconditionally wraps children in both `ReactSubscriptionProvider` and `NextSubscriptionProvider`. If WS URLs aren't configured, these providers will crash when subscription hooks try to connect.
**Why it happens:** `providers.tsx` doesn't check env availability before mounting subscription providers.
**How to avoid:** Conditionally render subscription providers based on env availability flags. If WS isn't available, skip the provider — subscription tabs should be hidden anyway.
**Warning signs:** Console errors about failed WebSocket connections even when not using subscription features.

### Pitfall 5: Hardcoded Proxy URL in Providers
**What goes wrong:** `providers.tsx` has `<NextSubscriptionProvider proxyUrl="ws://localhost:4000">` hardcoded.
**Why it happens:** Dev convenience.
**How to avoid:** For public publication, this should either use a relative URL or be configurable. However, the Next.js subscription provider already defaults to `/api/graphql` — the hardcoded `ws://localhost:4000` overrides this. For production, remove the hardcoded value or make it env-driven.
**Warning signs:** WebSocket connections failing in non-localhost deployments.

## Code Examples

### Example 1: EnvProvider Pattern (Server → Client Boolean Flags)

```typescript
// src/lib/env-config.ts — server-only utility
// This file should only be imported by server components

export interface EnvAvailability {
  hasClientUrl: boolean;
  hasServerUrl: boolean;
  hasClientWs: boolean;
  hasServerWs: boolean;
}

export function getEnvAvailability(): EnvAvailability {
  // Strict detection: each flag checks only its explicit env var.
  // The underlying env.ts helpers have fallback chains (e.g. getServerUrl()
  // falls back to NEXT_PUBLIC_INDEXER_URL), but for UI gating we only show
  // a mode tab when its env var is intentionally configured.
  return {
    hasClientUrl: Boolean(process.env.NEXT_PUBLIC_INDEXER_URL),
    hasServerUrl: Boolean(process.env.INDEXER_URL),
    hasClientWs: Boolean(process.env.NEXT_PUBLIC_INDEXER_WS_URL),
    hasServerWs: Boolean(process.env.INDEXER_WS_URL),
  };
}
```

```tsx
// src/components/env-provider.tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { EnvAvailability } from '@/lib/env-config';

const EnvContext = createContext<EnvAvailability | null>(null);

export function EnvProvider({ value, children }: { value: EnvAvailability; children: ReactNode }) {
  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
}

export function useEnvAvailability(): EnvAvailability {
  const ctx = useContext(EnvContext);
  if (!ctx) throw new Error('useEnvAvailability must be used within EnvProvider');
  return ctx;
}
```

```tsx
// In layout.tsx (RSC):
import { getEnvAvailability } from '@/lib/env-config';
import { EnvProvider } from '@/components/env-provider';

export default function RootLayout({ children }: { children: ReactNode }) {
  const envAvailability = getEnvAvailability();
  return (
    <html>
      <body>
        <Providers>
          <EnvProvider value={envAvailability}>
            {/* ... sidebar, content ... */}
          </EnvProvider>
        </Providers>
      </body>
    </html>
  );
}
```

### Example 2: Conditional Mode Toggle in PlaygroundPageLayout

```tsx
// In PlaygroundPageLayout:
const { hasClientUrl, hasServerUrl } = useEnvAvailability();

// Determine available modes
const availableModes: HookMode[] = [];
if (hasClientUrl) availableModes.push('client');
if (hasServerUrl) availableModes.push('server');

// Default to first available mode
const [mode, setMode] = useState<HookMode>(availableModes[0] ?? 'client');

// Only show toggle if both modes available
const showModeToggle = availableModes.length > 1;
```

### Example 3: Conditional Subscription Provider Wrapping

```tsx
// In providers.tsx — conditionally wrap subscription providers
export function Providers({
  hasClientWs,
  hasServerWs,
  children,
}: {
  hasClientWs: boolean;
  hasServerWs: boolean;
  children: ReactNode;
}) {
  let content = <TooltipProvider>{children}</TooltipProvider>;

  if (hasServerWs) {
    content = <NextSubscriptionProvider>{content}</NextSubscriptionProvider>;
  }
  if (hasClientWs) {
    content = <ReactSubscriptionProvider>{content}</ReactSubscriptionProvider>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
    </ThemeProvider>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `publicRuntimeConfig` in next.config | Server components + env checks | Next.js 13+ (App Router) | Server-only env vars stay on server; use RSC props to pass booleans to client |

**Deprecated/outdated:**
- `publicRuntimeConfig` / `serverRuntimeConfig` in `next.config.js`: Deprecated in App Router. Use server components for server-side env access.

## Open Questions

1. **Install guide content depth**
   - What we know: The home page should become a "quick install guide" for @lsp-indexer packages.
   - What's unclear: How detailed should this be? Full npm install + env setup + provider wrapping? Or just a link to external docs?
   - Recommendation: Include a concise quickstart (install commands, env vars, provider setup, first hook usage) directly in the page using shadcn/ui Card components. Keep it self-contained — no external doc dependency.

2. **Should subscription tabs be hidden when WS is unavailable?**
   - What we know: User requirement says "if only server side or only client side is set, don't show the tabs." This refers to the Client/Server mode toggle, not the inner feature tabs (single, list, infinite, subscription).
   - What's unclear: Should subscription-specific tabs also be conditionally hidden when WS env vars aren't configured?
   - Recommendation: Yes — hide the Subscription tab from the inner tabs when the active mode's WS is unavailable. This prevents confusing errors. But this is a secondary concern after the main mode toggle.

3. **Hardcoded `ws://localhost:4000` in providers.tsx**
   - What we know: The Next subscription provider is configured with a hardcoded localhost WS URL, overriding the default `/api/graphql`.
   - What's unclear: Is this intentional for dev only, or should it be env-driven for public deployment?
   - Recommendation: Make it env-driven: `process.env.NEXT_PUBLIC_WS_PROXY_URL ?? undefined` (letting it fall back to the provider's default `/api/graphql`).

## Detailed Inventory: Files to Modify

### Must Change
| File | What to Change | Why |
|------|---------------|-----|
| `src/app/page.tsx` | Remove env value display, replace with install guide | Leaks server secrets |
| `src/app/layout.tsx` | Add env availability detection, pass to EnvProvider | Server → client boolean flow |
| `src/app/providers.tsx` | Accept env availability props, conditionally wrap subscription providers | Prevent crashes when WS unavailable |
| `src/components/playground/page-layout.tsx` | Read env context, conditionally show mode toggle | User requirement: conditional tabs |
| `.env.example` | Add all vars with clear documentation | Public-facing template |

### Should Change
| File | What to Change | Why |
|------|---------------|-----|
| `src/components/connection-status.tsx` | Update or integrate into new home page | Current page restructure |
| `src/components/nav.tsx` | Minor: Update "Home" label to reflect new purpose | UX clarity |

### New Files
| File | Purpose |
|------|---------|
| `src/lib/env-config.ts` | Server-only env availability detection |
| `src/components/env-provider.tsx` | Client-side env availability context |

## Env Variable Security Audit

### Current Exposure Analysis

| Variable | Scope | Currently Exposed in HTML? | Action Needed |
|----------|-------|---------------------------|--------------|
| `NEXT_PUBLIC_INDEXER_URL` | Client | Yes (page.tsx EnvRow) — **acceptable**, it's public by design | Show as set/not-set indicator only (cleaner) |
| `INDEXER_URL` | Server | **YES (page.tsx EnvRow) — SECURITY ISSUE** | Remove value display, show only set/not-set boolean |
| `NEXT_PUBLIC_INDEXER_WS_URL` | Client | Yes (page.tsx EnvRow) — acceptable | Show as set/not-set indicator only |
| `INDEXER_WS_URL` | Server | **YES (page.tsx EnvRow) — SECURITY ISSUE** | Remove value display, show only set/not-set boolean |
| `WS_PROXY_PORT` | Server | Not exposed | No change needed |
| `INDEXER_ALLOWED_ORIGINS` | Server | Not exposed | No change needed |

### Next.js Bundle Analysis

The `NEXT_PUBLIC_*` variables are inlined into the client JS bundle by Next.js at build time. This is by design and documented. The non-prefixed `INDEXER_URL` and `INDEXER_WS_URL` are NOT in the client bundle — they only leak via the RSC HTML output of `page.tsx`. Fixing `page.tsx` to not render their values fully resolves the leak.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — all files listed in Architecture Patterns section
- `packages/node/src/client/env.ts` — env variable resolution logic
- `apps/test/src/app/page.tsx` — env variable exposure point

### Secondary (MEDIUM confidence)
- Next.js App Router env variable behavior — well-documented: `NEXT_PUBLIC_*` inlined at build, server-only vars only available in server components/actions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, all patterns already established in the codebase
- Architecture: HIGH — direct codebase inspection, clear env variable flow understood
- Pitfalls: HIGH — all pitfalls verified by reading actual source code (env.ts fallback, page.tsx exposure)

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable — no fast-moving dependencies)
