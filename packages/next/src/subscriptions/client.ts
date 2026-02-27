import {
  SubscriptionClient as BaseSubscriptionClient,
  type ConnectionState,
} from '@lsp-indexer/node';
import { ClientAuth } from './proxy';

/**
 * Next.js WebSocket subscription client that connects through the proxy at /api/graphql.
 *
 * This client extends the base SubscriptionClient from @lsp-indexer/node and:
 * 1. Connects to /api/graphql instead of direct GraphQL endpoint (URL hidden)
 * 2. Includes client authentication headers to prevent external abuse
 * 3. Transforms relative URLs to absolute WebSocket URLs in the browser
 * 4. Uses the same interface as React client for consistency
 */
export class SubscriptionClient extends BaseSubscriptionClient {
  private readonly clientAuth: ClientAuth;

  constructor(url = '/api/graphql', authSecret?: string) {
    super(url);
    this.clientAuth = new ClientAuth(authSecret || this.getDefaultAuthSecret());
  }

  /**
   * Override to provide the proxy URL instead of the direct GraphQL endpoint.
   */
  protected getConnectionUrl(): string {
    // Return the URL passed to constructor (defaults to '/api/graphql')
    return this.url;
  }

  /**
   * Override to provide client authentication headers for the proxy.
   */
  protected getConnectionParams(): Record<string, unknown> {
    const { token, nonce } = this.clientAuth.generateClientToken();
    const headers = ClientAuth.getHeaders();

    return {
      [headers.TOKEN_HEADER]: token,
      [headers.NONCE_HEADER]: nonce,
    };
  }

  /**
   * Override to convert relative URLs to absolute WebSocket URLs in the browser.
   */
  protected transformUrl(url: string): string {
    if (!url.startsWith('/')) return url;

    // Convert relative URL to absolute WebSocket URL
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${url}`;
  }

  private getDefaultAuthSecret(): string {
    // In client-side Next.js, we need to get the auth secret somehow.
    // This could be from a public env var or fetched from an API endpoint.
    // For now, we'll use a placeholder that indicates this needs configuration.
    return process.env.NEXT_PUBLIC_LSP_INDEXER_CLIENT_SECRET || 'need-to-configure-auth-secret';
  }
}

// Re-export ConnectionState for convenience
export type { ConnectionState };
