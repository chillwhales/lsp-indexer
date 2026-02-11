/**
 * Structured logging module for the V2 indexer pipeline.
 *
 * Provides dual-output logging: Subsquid's context.log for stdout/stderr
 * and pino for rotating file output. All log lines include a `step` field
 * identifying the pipeline stage.
 *
 * Four severity levels: debug, info, warn, error.
 */

import type { Logger } from '@subsquid/logger';
import pino from 'pino';

// ---------------------------------------------------------------------------
// PipelineStep type — union of all V2 pipeline step identifiers
// ---------------------------------------------------------------------------

export type PipelineStep =
  | 'BOOTSTRAP'
  | 'EXTRACT'
  | 'PERSIST_RAW'
  | 'HANDLE'
  | 'CLEAR_SUB_ENTITIES'
  | 'DELETE_ENTITIES'
  | 'PERSIST_DERIVED'
  | 'VERIFY'
  | 'ENRICH';

// ---------------------------------------------------------------------------
// createStepLogger — child logger with persistent step field
// ---------------------------------------------------------------------------

/**
 * Creates a child logger via Subsquid's Logger.child() that injects the
 * `step` field (and optional `blockRange`) on every log call.
 *
 * @param baseLogger - Subsquid Logger instance (from context.log)
 * @param step       - Pipeline step identifier
 * @param blockRange - Optional block range for this batch
 * @returns A child Logger with step (and blockRange) fields injected
 */
export function createStepLogger(
  baseLogger: Logger,
  step: PipelineStep,
  blockRange?: { from: number; to: number },
): Logger {
  const attrs: Record<string, unknown> = { step };
  if (blockRange) {
    attrs.blockRange = `${blockRange.from}-${blockRange.to}`;
  }
  return baseLogger.child(attrs);
}

// ---------------------------------------------------------------------------
// createComponentLogger — child logger with persistent component field
// ---------------------------------------------------------------------------

/**
 * Creates a child logger that injects a `component` field on every log call.
 *
 * This enables component-specific tagging of log lines so they can be
 * selectively inspected or filtered during log analysis.
 *
 * For use with Subsquid Logger (from hctx.context.log) in handlers.
 * For pino file logger in worker pool, use getFileLogger()?.child({ component }) directly.
 *
 * Usage:
 * ```ts
 * if (hctx.context.log.isDebug()) {
 *   const logger = createComponentLogger(hctx.context.log, 'metadata_fetch');
 *   logger.debug({ ... }, 'Processing metadata');
 * }
 * ```
 *
 * The component field will appear in all log output and can be used for post-hoc
 * filtering with jq/grep:
 * ```bash
 * cat logs/indexer*.log | jq 'select(.component == "metadata_fetch")'
 * ```
 *
 * @param baseLogger - Subsquid Logger instance (from hctx.context.log)
 * @param component  - Component identifier (e.g., 'metadata_fetch')
 * @returns A child logger with component field injected
 */
export function createComponentLogger(baseLogger: Logger, component: string): Logger {
  return baseLogger.child({ component });
}

// ---------------------------------------------------------------------------
// File logger (pino) — singleton for rotating JSON file output
// ---------------------------------------------------------------------------

let fileLogger: pino.Logger | null = null;

/**
 * Resolves the effective log level from environment variables.
 * - `LOG_LEVEL` env var takes priority (explicit override)
 * - Falls back to 'debug' in non-production, 'info' in production
 */
function resolveLogLevel(): string {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Initializes the singleton pino file logger with rotating file output.
 * Should be called once at application startup.
 *
 * @param logDir - Directory for log files (e.g., './logs')
 */
export function initFileLogger(logDir: string): void {
  const level = resolveLogLevel();

  fileLogger = pino(
    { level },
    pino.transport({
      target: 'pino-roll',
      options: {
        file: `${logDir}/indexer`,
        frequency: 'daily',
        mkdir: true,
        extension: '.log',
      },
    }),
  );
}

/**
 * Returns the singleton pino file logger, or null if not initialized.
 */
export function getFileLogger(): pino.Logger | null {
  return fileLogger;
}

/**
 * Resets the file logger singleton. Used for testing only.
 * @internal
 */
export function _resetFileLogger(): void {
  fileLogger = null;
}

// ---------------------------------------------------------------------------
// DualLogger — convenience wrapper for dual-output logging
// ---------------------------------------------------------------------------

export interface DualLogger {
  debug(attrs: Record<string, unknown>, msg: string): void;
  info(attrs: Record<string, unknown>, msg: string): void;
  warn(attrs: Record<string, unknown>, msg: string): void;
  error(attrs: Record<string, unknown>, msg: string): void;
}

/**
 * Creates a dual logger that writes to both Subsquid's Logger (stdout/stderr)
 * and the pino file logger (if initialized).
 *
 * Each method:
 * - Calls the subsquid child logger's method with attributes directly
 *   (NOT JSON.stringify — attributes are passed as structured fields)
 * - Also calls the pino file logger with the same attributes + step field
 *
 * @param subsquidLogger - Subsquid Logger instance (from context.log)
 * @param step           - Pipeline step identifier
 * @param blockRange     - Optional block range for this batch
 * @returns DualLogger with info/warn/error/debug methods
 */
export function createDualLogger(
  subsquidLogger: Logger,
  step: PipelineStep,
  blockRange?: { from: number; to: number },
): DualLogger {
  const childLogger = createStepLogger(subsquidLogger, step, blockRange);

  const baseAttrs: Record<string, unknown> = { step };
  if (blockRange) {
    baseAttrs.blockRange = `${blockRange.from}-${blockRange.to}`;
  }

  function logToBoth(
    level: 'debug' | 'info' | 'warn' | 'error',
    attrs: Record<string, unknown>,
    msg: string,
  ): void {
    // Subsquid logger: pass attributes directly (native structured logging)
    childLogger[level](attrs, msg);

    // Pino file logger: merge base attrs + call attrs + message
    if (fileLogger) {
      fileLogger[level]({ ...baseAttrs, ...attrs }, msg);
    }
  }

  return {
    debug: (attrs, msg) => logToBoth('debug', attrs, msg),
    info: (attrs, msg) => logToBoth('info', attrs, msg),
    warn: (attrs, msg) => logToBoth('warn', attrs, msg),
    error: (attrs, msg) => logToBoth('error', attrs, msg),
  };
}
