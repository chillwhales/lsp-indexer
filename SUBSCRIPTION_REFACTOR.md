# Subscription Architecture Refactor

**Branch:** `refactor/subscription-architecture`  
**Goal:** Create clean, unified subscription architecture before domain implementations

## Problem Statement

Current subscription architecture has several issues:

1. **Thick hooks** — `useSubscription` in both react/next is 200+ lines of state management
2. **Logic duplication** — Each domain subscription hook repeats variable building, parsing, error handling
3. **Transport coupling** — Domain-specific logic mixed with WebSocket/SSE transport details
4. **Inconsistent patterns** — Subscription hooks don't follow the thin wrapper pattern of query hooks

## Target Architecture

### Core Principles

1. **Same abstraction level** — Domain functions in `@lsp-indexer/node`, transport in packages
2. **Unified interface** — Both React (WebSocket) and Next (SSE) implement same client interface
3. **Thin wrappers** — Hooks are as simple as `useProfiles() → useQuery(fetchProfiles)`
4. **Single connection** — Multiple subscriptions multiplex over one WebSocket (React) or shared handler (Next)

### Architecture Layers

```
┌─────────────────────────────────────────────────┐
│ Domain Hooks (react/next)                       │
│ useProfileSubscription() → ultra-thin wrapper   │
└─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────┐
│ Domain Config Builders (node)                   │
│ createProfilesSubscription() → SubscriptionConfig│
└─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────┐
│ Subscription Client (react - shared)            │
│ SubscriptionClient with state management        │
└─────────────────────────────────────────────────┘
```

**SIMPLIFIED:** Next.js client components can use the React `SubscriptionClient` directly since they run in the browser. No need for separate SSE transport - just WebSocket to GraphQL endpoint.

### Interface Design

#### Core Node Interfaces

```typescript
// Generic subscription function - like execute() but streaming
export function subscribe<T>(
  client: SubscriptionClient,
  config: SubscriptionConfig<T>,
  options?: SubscriptionOptions,
): SubscriptionResult<T>;

// What domain functions return
interface SubscriptionConfig<T> {
  document: string;
  variables: Record<string, unknown>;
  dataKey: string;
  parser: (raw: unknown[]) => T[];
}

// Hook-level options (enabled, callbacks, etc.)
interface SubscriptionOptions {
  enabled?: boolean;
  invalidate?: boolean;
  invalidateKeys?: readonly (readonly unknown[])[];
  onData?: (data: any[]) => void;
  onReconnect?: () => void;
}

// What subscribe() returns
interface SubscriptionResult<T> {
  data: T[] | null;
  isConnected: boolean;
  isSubscribed: boolean;
  error: IndexerError | null;
  dispose: () => void;
}
```

#### Client Interface

```typescript
// Common interface that both React and Next implement
interface SubscriptionClient {
  executeSubscription(
    payload: { query: string; variables?: Record<string, unknown> },
    sink: SubscriptionSink,
  ): () => void;

  onReconnect(callback: () => void): () => void;
  readonly isConnected: boolean;
}

interface SubscriptionSink {
  next: (result: { data?: Record<string, unknown> }) => void;
  error: (error: unknown) => void;
  complete: () => void;
}
```

## Implementation Plan

### Phase 1: Core Infrastructure ✋ **CURRENT**

- [x] **1.1** Create `SubscriptionClient` interface in `@lsp-indexer/types`
- [x] **1.2** ~~Create generic `subscribe()` function in `@lsp-indexer/node`~~ **REVISED:** State management moved to SubscriptionClient
- [x] **1.3** Update React `SubscriptionClient` to implement new interface
- [x] **1.4** ~~Update Next `SubscriptionClient` to implement new interface~~ **REVISED:** Next.js will reuse React client directly
- [ ] **1.5** Create thin `useSubscription` wrappers in both packages

### Phase 2: Simplify Next.js Package

- [ ] **2.1** Remove complex SSE implementation from `@lsp-indexer/next`
- [ ] **2.2** Update `@lsp-indexer/next` to re-export React subscription client and hooks
- [ ] **2.3** Create optional WebSocket proxy utility for server-side scenarios (future)

### Phase 3: Domain Migration

- [ ] **3.1** Add `createProfilesSubscription()` to `@lsp-indexer/node`
- [ ] **3.2** Create thin `useSubscription` wrapper in `@lsp-indexer/react`
- [ ] **3.3** Replace thick `useProfileSubscription` with thin wrapper in both packages
- [ ] **3.4** Remove old thick `useSubscription` implementation
- [ ] **3.5** Update exports and documentation

### Phase 4: Validation & Cleanup

- [ ] **4.1** Test subscription behavior (connection, reconnection, error handling)
- [ ] **4.2** Verify single WebSocket connection is shared across multiple hooks
- [ ] **4.3** Test Next.js client components using React subscription client
- [ ] **4.4** Clean up unused SSE code and update types
- [ ] **4.5** Document new simplified architecture

## Current Status

**Active Phase:** 1 - Core Infrastructure  
**Next Step:** 1.1 - Create SubscriptionClient interface

## Notes

- This refactor affects existing subscription infrastructure in PR #227
- All domain subscription branches (`feat/sub-*`) will need to be updated after this merges
- The goal is to make domain subscription implementations trivial once this architecture exists
- Single WebSocket connection strategy follows GraphQL-WS protocol for efficient multiplexing

## Files Being Modified

### Core Infrastructure

- `packages/types/src/subscriptions.ts` — New interfaces
- `packages/node/src/subscriptions/subscribe.ts` — New generic function
- `packages/node/src/index.ts` — Export new functions

### React Package

- `packages/react/src/subscriptions/client.ts` — Update to implement interface
- `packages/react/src/subscriptions/use-subscription.ts` — Replace with thin wrapper
- `packages/react/src/index.ts` — Update exports

### Next Package

- `packages/next/src/subscriptions/client.ts` — New SSE-based implementation
- `packages/next/src/subscriptions/use-subscription.ts` — Replace with thin wrapper
- `packages/next/src/index.ts` — Update exports

### Test Domain (Profiles)

- `packages/node/src/services/profiles.ts` — Add createProfilesSubscription
- `packages/react/src/hooks/profiles.ts` — Update useProfileSubscription
- `packages/next/src/hooks/profiles.ts` — Update useProfileSubscription (if exists)
