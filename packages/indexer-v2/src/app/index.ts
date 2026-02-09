/**
 * Main entry point for V2 indexer.
 *
 * Bootstraps the application by:
 * 1. Discovering all EventPlugins and EntityHandlers via PluginRegistry
 * 2. Configuring processor with log subscriptions from registry
 * 3. Running processBatch through the 6-step pipeline for each batch
 */

import { TypeormDatabase } from '@subsquid/typeorm-store';
import { processor } from './processor';

// TODO (Plan 02): Add registry discovery and log subscription wiring
// TODO (Plan 03): Add pipeline integration with processBatch

// eslint-disable-next-line @typescript-eslint/require-await -- Skeleton async handler; await will be added in Plan 03 when processBatch is wired
processor.run(new TypeormDatabase(), async (ctx) => {
  // TODO: Wire processBatch call here in Plan 03
  if (ctx.blocks.length > 0) {
    const from = ctx.blocks[0].header.height;
    const to = ctx.blocks[ctx.blocks.length - 1].header.height;
    ctx.log.info({ step: 'RUN', from, to }, `Processing blocks ${from} to ${to}`);
  }
});
