/**
 * Metadata fetching types for the worker pool system.
 *
 * The metadata worker pool handles async IPFS/HTTP fetching in parallel
 * worker threads, decoupled from the main pipeline execution.
 */

/**
 * Request to fetch metadata from a URL (IPFS gateway, HTTP, or data: URL).
 */
export interface FetchRequest {
  /** Unique identifier for this fetch (entity id) */
  id: string;
  /** URL to fetch (IPFS gateway URL, HTTP URL, or data: URL) */
  url: string;
  /** Entity type this fetch belongs to (e.g. 'LSP3Profile', 'LSP4Metadata') */
  entityType: string;
  /** Number of retries remaining */
  retries: number;
}

/**
 * Result of a metadata fetch operation.
 */
export interface FetchResult {
  /** Matches FetchRequest.id */
  id: string;
  /** The entity type from the request */
  entityType: string;
  /** Whether the fetch succeeded */
  success: boolean;
  /** Parsed JSON data (if success) */
  data?: unknown;
  /** Error message (if failure) */
  error?: string;
  /** Network error code (e.g. 'ETIMEDOUT', 'EPROTO') — for cross-batch retry prioritization */
  errorCode?: string;
  /** HTTP status code (e.g. 408, 429, 500) — for cross-batch retry prioritization */
  errorStatus?: number;
}

/**
 * Metadata worker pool interface for parallel fetching.
 *
 * Implemented with worker threads to prevent blocking the main pipeline
 * during slow IPFS/HTTP operations.
 */
export interface IMetadataWorkerPool {
  fetchBatch(requests: FetchRequest[]): Promise<FetchResult[]>;
  shutdown(): Promise<void>;
}
