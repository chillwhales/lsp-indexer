/**
 * Local Zod 4 schemas for registry names (data keys and type IDs).
 *
 * @chillwhales/erc725 and @chillwhales/lsp1 export `DataKeyNameSchema` and
 * `TypeIdNameSchema` respectively, but those are Zod 3 schema instances
 * (zod@^3.24.1). This package uses Zod 4 (zod@^4.3.6), so importing the
 * upstream schemas directly would create incompatible schema instances that
 * cannot compose with other Zod 4 schemas.
 *
 * Instead, we import only the `DATA_KEY_NAMES` and `TYPE_ID_NAMES` constant
 * tuples from upstream and create local Zod 4 enum schemas from them.
 */
import { DATA_KEY_NAMES } from '@chillwhales/erc725';
import { TYPE_ID_NAMES } from '@chillwhales/lsp1';
import { z } from 'zod';

/**
 * Zod 4 schema for known ERC725Y data key names.
 *
 * Created locally from the upstream `DATA_KEY_NAMES` constant tuple because
 * the upstream `DataKeyNameSchema` uses Zod 3 and is incompatible with Zod 4
 * schema composition.
 */
export const DataKeyNameSchema = z.enum(DATA_KEY_NAMES as readonly [string, ...string[]]);

/**
 * Zod 4 schema for known LSP1 type ID names.
 *
 * Created locally from the upstream `TYPE_ID_NAMES` constant tuple because
 * the upstream `TypeIdNameSchema` uses Zod 3 and is incompatible with Zod 4
 * schema composition.
 */
export const TypeIdNameSchema = z.enum(TYPE_ID_NAMES as readonly [string, ...string[]]);
