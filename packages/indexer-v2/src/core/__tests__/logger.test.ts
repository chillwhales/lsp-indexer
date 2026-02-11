import type { Logger } from '@subsquid/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetFileLogger,
  createDualLogger,
  createStepLogger,
  getFileLogger,
  initFileLogger,
} from '../logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mock logger shape that satisfies the Subsquid Logger interface
 * for testing purposes (info/warn/error/debug/child methods).
 */
interface MockLogger {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  child: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Subsquid Logger with vi.fn() methods.
 * The `child` method returns a new mock logger (simulating Logger.child()).
 */
function createMockLogger(): { logger: MockLogger; childLogger: MockLogger } {
  const childLogger: MockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  };

  const logger: MockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnValue(childLogger),
  };

  return { logger, childLogger };
}

// ---------------------------------------------------------------------------
// createStepLogger tests
// ---------------------------------------------------------------------------

describe('createStepLogger', () => {
  it('injects step field via child()', () => {
    const { logger } = createMockLogger();

    createStepLogger(logger as unknown as Logger, 'EXTRACT');

    expect(logger.child).toHaveBeenCalledWith({ step: 'EXTRACT' });
  });

  it('includes blockRange when provided', () => {
    const { logger } = createMockLogger();

    createStepLogger(logger as unknown as Logger, 'PERSIST_RAW', { from: 100, to: 200 });

    expect(logger.child).toHaveBeenCalledWith({
      step: 'PERSIST_RAW',
      blockRange: '100-200',
    });
  });

  it('omits blockRange when undefined', () => {
    const { logger } = createMockLogger();

    createStepLogger(logger as unknown as Logger, 'HANDLE');

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

    createComponentLogger(logger as unknown as Logger, 'worker_pool');

    expect(logger.child).toHaveBeenCalledWith({ component: 'worker_pool' });
  });

  it('works with different component names', () => {
    const { logger } = createMockLogger();

    createComponentLogger(logger as unknown as Logger, 'metadata_fetch');

    expect(logger.child).toHaveBeenCalledWith({ component: 'metadata_fetch' });
  });

  it('returns child logger with component field', () => {
    const { logger, childLogger } = createMockLogger();

    const componentLogger = createComponentLogger(logger as unknown as Logger, 'worker_pool');

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

    const dualLogger = createDualLogger(logger as unknown as Logger, 'HANDLE');

    dualLogger.info({ entityType: 'Follow', count: 5 }, 'Processed');

    expect(childLogger.info).toHaveBeenCalledWith({ entityType: 'Follow', count: 5 }, 'Processed');
  });

  it('calls subsquid child logger warn with attributes directly', () => {
    const { logger, childLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger as unknown as Logger, 'VERIFY');

    dualLogger.warn({ address: '0xabc' }, 'Verification failed');

    expect(childLogger.warn).toHaveBeenCalledWith({ address: '0xabc' }, 'Verification failed');
  });

  it('passes attributes as objects, not JSON.stringify', () => {
    const { logger, childLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger as unknown as Logger, 'PERSIST_RAW');

    const attrs = { entityType: 'Follow', count: 5 };
    dualLogger.info(attrs, 'Processed entities');

    // Verify the first argument is an object, not a string
    const firstArg = childLogger.info.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof firstArg).toBe('object');
    expect(firstArg).toEqual({ entityType: 'Follow', count: 5 });
  });

  it('supports all four severity levels', () => {
    const { logger, childLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger as unknown as Logger, 'EXTRACT');

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
