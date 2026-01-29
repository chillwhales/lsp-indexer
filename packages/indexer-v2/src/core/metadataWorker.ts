/**
 * Metadata fetch worker thread.
 *
 * Runs in a separate thread via `worker_threads`. Receives FetchRequest[]
 * messages from the parent, fetches each URL, and posts FetchResult[] back.
 *
 * Handles three URL types:
 *   - `data:` URLs  — parsed inline (no network)
 *   - `ipfs://` URLs — rewritten to IPFS gateway, fetched via HTTP
 *   - `http(s)://` URLs — fetched directly
 */
import { parentPort, workerData } from 'worker_threads';

import axios from 'axios';
import parseDataURL from 'data-urls';

// ---------------------------------------------------------------------------
// Configuration passed from parent via workerData
// ---------------------------------------------------------------------------

interface WorkerConfig {
  ipfsGateway: string;
  requestTimeoutMs: number;
}

const config: WorkerConfig = workerData ?? {
  ipfsGateway: 'https://api.universalprofile.cloud/ipfs/',
  requestTimeoutMs: 30_000,
};

// Reuse TCP connections across requests within this worker
const httpClient = axios.create({
  timeout: config.requestTimeoutMs,
  headers: { Accept: 'application/json' },
});

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function resolveUrl(url: string): string {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', config.ipfsGateway);
  }
  return url;
}

// ---------------------------------------------------------------------------
// Types (duplicated here to avoid import path issues in worker context)
// ---------------------------------------------------------------------------

interface FetchRequest {
  id: string;
  url: string;
  entityType: string;
  retries: number;
}

interface FetchResult {
  id: string;
  entityType: string;
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: string;
  errorStatus?: number;
  retryable: boolean;
}

// ---------------------------------------------------------------------------
// Fetch logic
// ---------------------------------------------------------------------------

function isRetryableError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    // Retryable HTTP status codes
    if (error.response?.status) {
      return [408, 429, 500, 502, 503, 504].includes(error.response.status);
    }
    // Retryable network errors
    const code = (error.code ?? '').toLowerCase();
    return ['econnreset', 'etimedout', 'eproto', 'econnaborted', 'enotfound'].includes(code);
  }
  return false;
}

async function fetchSingle(request: FetchRequest): Promise<FetchResult> {
  const { id, url, entityType } = request;

  try {
    // Handle data: URLs inline (no network)
    if (url.startsWith('data:')) {
      const parsed = parseDataURL(url);
      if (!parsed) {
        return { id, entityType, success: false, error: 'Invalid data URL', retryable: false };
      }

      const mimeType = parsed.mimeType.toString();
      if (!mimeType.startsWith('application/json')) {
        return {
          id,
          entityType,
          success: false,
          error: `Invalid mime type. Expected 'application/json'. Got: '${mimeType}'`,
          retryable: false,
        };
      }

      try {
        const data = JSON.parse(Buffer.from(parsed.body).toString());
        return { id, entityType, success: true, data, retryable: false };
      } catch (parseError) {
        return {
          id,
          entityType,
          success: false,
          error: `JSON parse error: ${String(parseError)}`,
          retryable: false,
        };
      }
    }

    // HTTP / IPFS fetch
    const resolved = resolveUrl(url);
    const response = await httpClient.get(resolved);
    return { id, entityType, success: true, data: response.data, retryable: false };
  } catch (error) {
    const retryable = isRetryableError(error);

    if (axios.isAxiosError(error)) {
      return {
        id,
        entityType,
        success: false,
        error: error.message,
        errorCode: error.code ?? undefined,
        errorStatus: error.response?.status,
        retryable,
      };
    }

    return {
      id,
      entityType,
      success: false,
      error: String(error),
      retryable,
    };
  }
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

if (parentPort) {
  parentPort.on('message', async (requests: FetchRequest[]) => {
    const results = await Promise.all(requests.map(fetchSingle));
    parentPort!.postMessage(results);
  });
}
