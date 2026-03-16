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
import axios from 'axios';
import parseDataURL from 'data-urls';
import { parentPort, workerData } from 'worker_threads';
import type { WorkerLogMessage } from './types/workerMessages';

// ---------------------------------------------------------------------------
// Configuration passed from parent via workerData
// ---------------------------------------------------------------------------

interface WorkerConfig {
  ipfsGateway: string;
  requestTimeoutMs: number;
}

const config: WorkerConfig = (workerData as WorkerConfig | undefined) ?? {
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
  // Handle bare IPFS CIDv0 (Qm...) and CIDv1 (bafy.../bafk...) hashes without ipfs:// prefix
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(url) || /^baf[a-z2-7]{56,}/.test(url)) {
    return `${config.ipfsGateway}${url}`;
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

/** Return type of data-urls parser (no DefinitelyTyped package available). */
interface DataURLResult {
  mimeType: { toString(): string };
  body: Uint8Array;
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
    return ['econnreset', 'etimedout', 'eproto', 'econnaborted', 'enotfound', 'eai_again'].includes(
      code,
    );
  }
  return false;
}

async function fetchSingle(request: FetchRequest): Promise<FetchResult> {
  const { id, url, entityType } = request;

  try {
    // Handle data: URLs inline (no network)
    if (url.startsWith('data:')) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- data-urls has no type declarations
      const parsed = parseDataURL(url) as DataURLResult | null;
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
        const data: unknown = JSON.parse(Buffer.from(parsed.body).toString());
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
    const response = await httpClient.get<unknown>(resolved);
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
  const port = parentPort;

  parentPort.on('message', (requests: FetchRequest[]) => {
    void Promise.all(requests.map(fetchSingle))
      .then((results) => {
        port.postMessage(results);
      })
      .catch((err: unknown) => {
        port.postMessage({
          type: 'LOG',
          level: 'error',
          attrs: {
            step: 'HANDLE',
            component: 'worker',
            error: err instanceof Error ? err.message : 'Unknown error',
            ...(err instanceof Error && err.stack ? { errorStack: err.stack } : {}),
          },
          message: 'Fatal error processing requests',
        } satisfies WorkerLogMessage);
        // Re-throw so the worker crashes — parent pool detects this via 'error' event
        throw err;
      });
  });
} else {
  // parentPort is null — cannot relay, console.error is the only option
  console.error(
    '[MetadataWorker] ERROR: parentPort is null - worker cannot communicate with parent',
  );
}
