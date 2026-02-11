import type { Logger } from '@subsquid/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetFileLogger,
  createComponentLogger,
  createDualLogger,
  createStepLogger,
  getFileLogger,
  initFileLogger,
} from '../logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock Subsquid Logger with vi.fn() methods that satisfies the Logger interface.
 * The `child` method returns a new mock logger (simulating Logger.child()).
 */
function createMockLogger(): { logger: Logger; childLogger: Logger } {
  const childLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
    isLevelEnabled: vi.fn(() => false),
  } as unknown as Logger;

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnValue(childLogger),
    isLevelEnabled: vi.fn(() => false),
  } as unknown as Logger;

  return { logger, childLogger };
}

// ---------------------------------------------------------------------------
// createStepLogger tests
// ---------------------------------------------------------------------------

describe('createStepLogger', () => {
  it('injects step field via child()', () => {
    const { logger } = createMockLogger();

    createStepLogger(logger, 'EXTRACT');

    expect(logger.child).toHaveBeenCalledWith({ step: 'EXTRACT' });
  });

  it('includes blockRange when provided', () => {
    const { logger } = createMockLogger();

    createStepLogger(logger, 'PERSIST_RAW', { from: 100, to: 200 });

    expect(logger.child).toHaveBeenCalledWith({
      step: 'PERSIST_RAW',
      blockRange: '100-200',
    });
  });

  it('omits blockRange when undefined', () => {
    const { logger } = createMockLogger();

    createStepLogger(logger, 'HANDLE');

    expect(logger.child).toHaveBeenCalledWith({ step: 'HANDLE' });
    // Verify blockRange key is NOT present
    const callArgs = logger.child.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty('blockRange');
  });
});

// ---------------------------------------------------------------------------
// initFileLogger / getFileLogger tests
// ---------------------------------------------------------------------------

describe('initFileLogger', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    _resetFileLogger();
  });

  afterEach(() => {
    // Restore environment variables
    process.env = { ...originalEnv };
    _resetFileLogger();
  });

  it('respects LOG_LEVEL env var override', () => {
    process.env.LOG_LEVEL = 'warn';

    initFileLogger('/tmp/test-logs-level');

    const logger = getFileLogger();
    expect(logger).not.toBeNull();
    expect(logger.level).toBe('warn');
  });

  it('defaults to debug level in development', () => {
    delete process.env.LOG_LEVEL;
    process.env.NODE_ENV = 'development';

    initFileLogger('/tmp/test-logs-dev');

    const logger = getFileLogger();
    expect(logger).not.toBeNull();
    expect(logger.level).toBe('debug');
  });

  it('defaults to info level in production', () => {
    delete process.env.LOG_LEVEL;
    process.env.NODE_ENV = 'production';

    initFileLogger('/tmp/test-logs-prod');

    const logger = getFileLogger();
    expect(logger).not.toBeNull();
    expect(logger.level).toBe('info');
  });
});

describe('getFileLogger', () => {
  beforeEach(() => {
    _resetFileLogger();
  });

  afterEach(() => {
    _resetFileLogger();
  });

  it('returns null when not initialized', () => {
    expect(getFileLogger()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createComponentLogger tests
// ---------------------------------------------------------------------------

describe('createComponentLogger', () => {
  it('injects component field via child()', () => {
    const { logger } = createMockLogger();

    createComponentLogger(logger, 'worker_pool');

    expect(logger.child).toHaveBeenCalledWith({ component: 'worker_pool' });
  });

  it('works with different component names', () => {
    const { logger } = createMockLogger();

    createComponentLogger(logger, 'metadata_fetch');

    expect(logger.child).toHaveBeenCalledWith({ component: 'metadata_fetch' });
  });

  it('returns child logger with component field', () => {
    const { logger, childLogger } = createMockLogger();

    const componentLogger = createComponentLogger(logger, 'worker_pool');

    // Verify child() was called
    expect(logger.child).toHaveBeenCalledTimes(1);

    // Verify returned logger is the child logger
    expect(componentLogger).toBe(childLogger);
  });
});

// ---------------------------------------------------------------------------
// createDualLogger tests
// ---------------------------------------------------------------------------

describe('createDualLogger', () => {
  it('calls subsquid child logger info with attributes directly', () => {
    const { logger, childLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger, 'HANDLE');

    dualLogger.info({ entityType: 'Follow', count: 5 }, 'Processed');

    expect(childLogger.info).toHaveBeenCalledWith({ entityType: 'Follow', count: 5 }, 'Processed');
  });

  it('calls subsquid child logger warn with attributes directly', () => {
    const { logger, childLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger, 'VERIFY');

    dualLogger.warn({ address: '0xabc' }, 'Verification failed');

    expect(childLogger.warn).toHaveBeenCalledWith({ address: '0xabc' }, 'Verification failed');
  });

  it('passes attributes as objects, not JSON.stringify', () => {
    const { logger, childLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger, 'PERSIST_RAW');

    const attrs = { entityType: 'Follow', count: 5 };
    dualLogger.info(attrs, 'Processed entities');

    // Verify the first argument is an object, not a string
    const firstArg = childLogger.info.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof firstArg).toBe('object');
    expect(firstArg).toEqual({ entityType: 'Follow', count: 5 });
  });

  it('supports all four severity levels', () => {
    const { logger, childLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger, 'EXTRACT');

    dualLogger.debug({ detail: 'trace' }, 'Debug message');
    dualLogger.info({ detail: 'progress' }, 'Info message');
    dualLogger.warn({ detail: 'caution' }, 'Warning message');
    dualLogger.error({ detail: 'failure' }, 'Error message');

    expect(childLogger.debug).toHaveBeenCalledTimes(1);
    expect(childLogger.info).toHaveBeenCalledTimes(1);
    expect(childLogger.warn).toHaveBeenCalledTimes(1);
    expect(childLogger.error).toHaveBeenCalledTimes(1);
  });
});
