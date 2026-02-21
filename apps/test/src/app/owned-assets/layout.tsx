import type { ReactNode } from 'react';

/**
 * Force dynamic rendering for the Owned Assets playground.
 *
 * Owned asset hooks call `getClientUrl()` at initialization which reads
 * `NEXT_PUBLIC_INDEXER_URL`. During `next build` static generation this
 * env var isn't available, causing a build error. Forcing dynamic
 * rendering means the page is only rendered at request time when the
 * env var is present.
 */
export const dynamic = 'force-dynamic';

export default function OwnedAssetsLayout({ children }: { children: ReactNode }): ReactNode {
  return children;
}
