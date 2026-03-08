import { fetchDigitalAsset, getClientUrl } from '@lsp-indexer/node';
import { createUseDigitalAsset } from '../factories';

/** Single digital asset by address. Returns { digitalAsset } instead of data. Disabled when address is falsy. */
export const useDigitalAsset = createUseDigitalAsset((params) =>
  fetchDigitalAsset(getClientUrl(), params),
);
