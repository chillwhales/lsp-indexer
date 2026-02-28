'use client';

import { SubscriptionClient as BaseSubscriptionClient } from '@lsp-indexer/node';

/**
 * Next.js WebSocket subscription client that connects through the proxy.
 *
 * This client extends the base SubscriptionClient from @lsp-indexer/node and
 * converts relative proxy URLs (e.g. `/api/graphql`) to absolute WebSocket
 * URLs using the current browser location. No client-side authentication is
 * needed — the proxy validates connections via the Origin header.
 */
export class SubscriptionClient extends BaseSubscriptionClient {
  constructor(url = '/api/graphql') {
    super(url);
  }

  /**
   * Return the proxy URL passed to the constructor.
   */
  protected getConnectionUrl(): string {
    return this.url;
  }

  /**
   * Convert relative URLs to absolute WebSocket URLs in the browser.
   * Absolute URLs are returned as-is.
   */
  protected transformUrl(url: string): string {
    if (!url.startsWith('/')) return url;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${url}`;
  }
}
