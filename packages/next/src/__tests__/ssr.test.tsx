import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useV3List } from '../index';

function DisabledServerActionQuery(): ReactNode {
  const query = useV3List('blocks', { network: 'lukso-mainnet' }, { enabled: false });
  return <span>{query.status}</span>;
}

describe('Next.js SSR safety', () => {
  it('renders the client hook surface without reading server configuration', () => {
    const previousUrl = process.env.INDEXER_URL;
    const previousPublicUrl = process.env.NEXT_PUBLIC_INDEXER_URL;
    delete process.env.INDEXER_URL;
    delete process.env.NEXT_PUBLIC_INDEXER_URL;
    const queryClient = new QueryClient();

    try {
      expect(
        renderToString(
          <QueryClientProvider client={queryClient}>
            <DisabledServerActionQuery />
          </QueryClientProvider>,
        ),
      ).toContain('pending');
    } finally {
      if (previousUrl === undefined) delete process.env.INDEXER_URL;
      else process.env.INDEXER_URL = previousUrl;
      if (previousPublicUrl === undefined) delete process.env.NEXT_PUBLIC_INDEXER_URL;
      else process.env.NEXT_PUBLIC_INDEXER_URL = previousPublicUrl;
      queryClient.clear();
    }
  });
});
