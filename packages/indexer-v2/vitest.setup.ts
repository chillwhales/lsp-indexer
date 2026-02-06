/**
 * Vitest setup file.
 *
 * Registers the @/* path alias for CJS require() calls in compiled lib/ files.
 * This is needed because the compiled JS uses require("@/constants") etc.
 * and Node's CJS loader doesn't understand TypeScript path aliases.
 */
import Module from 'node:module';
import path from 'node:path';

const LIB_DIR = path.resolve(__dirname, 'lib');
const originalResolveFilename = (Module as any)._resolveFilename;

(Module as any)._resolveFilename = function (
  request: string,
  parent: any,
  isMain: boolean,
  options: any,
) {
  // Rewrite @/* to lib/*
  if (request.startsWith('@/')) {
    const resolved = path.join(LIB_DIR, request.slice(2));
    return originalResolveFilename.call(this, resolved, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
