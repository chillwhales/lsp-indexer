'use client';

/**
 * Client-side React context for env availability flags.
 *
 * Receives boolean-only `EnvAvailability` from the RSC layout via props
 * and exposes it to any client component via `useEnvAvailability()`.
 */

import { createContext, useContext, type ReactNode } from 'react';

import type { EnvAvailability } from '@/lib/env-config';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EnvContext = createContext<EnvAvailability | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Wraps children with env availability context.
 *
 * @param value - Boolean flags from `getEnvAvailability()` (RSC-safe, no secrets).
 */
export function EnvProvider({
  value,
  children,
}: {
  value: EnvAvailability;
  children: ReactNode;
}): ReactNode {
  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Read env availability flags from context.
 *
 * @throws If called outside `<EnvProvider>`.
 */
export function useEnvAvailability(): EnvAvailability {
  const ctx = useContext(EnvContext);
  if (ctx === null) {
    throw new Error('useEnvAvailability must be used within an <EnvProvider>');
  }
  return ctx;
}
