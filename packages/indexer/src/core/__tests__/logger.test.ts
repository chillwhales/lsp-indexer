import { Logger } from '@subsquid/logger';
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
 * Creates a real Subsquid Logger with a mocked sink and spied methods.
 * This ensures we're testing against the actual Logger implementation
 * while still being able to verify method calls.
 */
function createMockLogger(): {
  logger: Logger;
  sink: ReturnType<typeof vi.fn>;
  childSpy: ReturnType<typeof vi.spyOn>;
  getChildLogger: () => Logger;
} {
  const sink = vi.fn();
  const logger = new Logger(sink, 'test');
  const childSpy = vi.spyOn(logger, 'child');

  // Get the actual child logger after child() is called
  const getChildLogger = () => childSpy.mock.results[0]?.value as Logger;

  return { logger, sink, childSpy, getChildLogger };
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
    const { logger, childSpy } = createMockLogger();

    createStepLogger(logger, 'HANDLE');

    expect(childSpy).toHaveBeenCalledWith({ step: 'HANDLE' });
    // Verify blockRange key is NOT present
    expect(childSpy.mock.calls[0][0]).not.toHaveProperty('blockRange');
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
    const { logger, childSpy, getChildLogger } = createMockLogger();

    const componentLogger = createComponentLogger(logger, 'worker_pool');

    // Verify child() was called
    expect(childSpy).toHaveBeenCalledTimes(1);

    // Verify returned logger is the child logger
    expect(componentLogger).toBe(getChildLogger());
  });
});

// ---------------------------------------------------------------------------
// createDualLogger tests
// ---------------------------------------------------------------------------

describe('createDualLogger', () => {
  it('calls subsquid child logger info with attributes directly', () => {
    const { logger, getChildLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger, 'HANDLE');
    const childLogger = getChildLogger();
    const infoSpy = vi.spyOn(childLogger, 'info');

    dualLogger.info({ entityType: 'Follow', count: 5 }, 'Processed');

    expect(infoSpy).toHaveBeenCalledWith({ entityType: 'Follow', count: 5 }, 'Processed');
  });

  it('calls subsquid child logger warn with attributes directly', () => {
    const { logger, getChildLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger, 'VERIFY');
    const childLogger = getChildLogger();
    const warnSpy = vi.spyOn(childLogger, 'warn');

    dualLogger.warn({ address: '0xabc' }, 'Verification failed');

    expect(warnSpy).toHaveBeenCalledWith({ address: '0xabc' }, 'Verification failed');
  });

  it('passes attributes as objects, not JSON.stringify', () => {
    const { logger, getChildLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger, 'PERSIST_RAW');
    const childLogger = getChildLogger();
    const infoSpy = vi.spyOn(childLogger, 'info');

    const attrs = { entityType: 'Follow', count: 5 };
    dualLogger.info(attrs, 'Processed entities');

    // Verify the first argument is an object, not a string
    const firstArg = infoSpy.mock.calls[0][0];
    expect(typeof firstArg).toBe('object');
    expect(firstArg).toEqual({ entityType: 'Follow', count: 5 });
  });

  it('supports all four severity levels', () => {
    const { logger, getChildLogger } = createMockLogger();

    const dualLogger = createDualLogger(logger, 'EXTRACT');
    const childLogger = getChildLogger();
    const debugSpy = vi.spyOn(childLogger, 'debug');
    const infoSpy = vi.spyOn(childLogger, 'info');
    const warnSpy = vi.spyOn(childLogger, 'warn');
    const errorSpy = vi.spyOn(childLogger, 'error');

    dualLogger.debug({ detail: 'trace' }, 'Debug message');
    dualLogger.info({ detail: 'progress' }, 'Info message');
    dualLogger.warn({ detail: 'caution' }, 'Warning message');
    dualLogger.error({ detail: 'failure' }, 'Error message');

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
