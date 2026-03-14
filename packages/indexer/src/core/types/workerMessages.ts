/**
 * Shared type definitions for messages between worker threads and the main thread.
 *
 * This file contains only type definitions that need to be shared between
 * metadataWorker.ts (worker thread) and metadataWorkerPool.ts (main thread).
 *
 * Worker threads cannot import runtime code from src/, but they can import
 * type-only definitions.
 */

/** Log message relayed from worker thread to parent for structured output. */
export interface WorkerLogMessage {
  type: 'LOG';
  level: 'error' | 'warn' | 'info' | 'debug';
  attrs: Record<string, unknown>;
  message: string;
}
