/** @see createUseDetail */
import { tokenIdDataChangedEventKeys } from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  UseLatestTokenIdDataChangedEventParams,
} from '@lsp-indexer/types';
import type { UseLatestTokenIdDataChangedEventReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

type LatestTokenIdDataChangedEventParams = UseLatestTokenIdDataChangedEventParams & {
  include?: TokenIdDataChangedEventInclude;
};

export function createUseLatestTokenIdDataChangedEvent(
  queryFn: (
    params: LatestTokenIdDataChangedEventParams,
  ) => Promise<PartialTokenIdDataChangedEvent | null>,
) {
  const impl = createUseDetail<LatestTokenIdDataChangedEventParams, PartialTokenIdDataChangedEvent>(
    {
      queryKey: (p) => tokenIdDataChangedEventKeys.latest(p.filter, p.include),
      queryFn,
      enabled: () => true,
    },
  );

  function useLatestTokenIdDataChangedEvent<const I extends TokenIdDataChangedEventInclude>(
    params: UseLatestTokenIdDataChangedEventParams & { include: I },
  ): UseLatestTokenIdDataChangedEventReturn<TokenIdDataChangedEventResult<I>>;
  function useLatestTokenIdDataChangedEvent(
    params?: Omit<UseLatestTokenIdDataChangedEventParams, 'include'> & { include?: never },
  ): UseLatestTokenIdDataChangedEventReturn<TokenIdDataChangedEvent>;
  function useLatestTokenIdDataChangedEvent(
    params: UseLatestTokenIdDataChangedEventParams & {
      include?: TokenIdDataChangedEventInclude;
    },
  ): UseLatestTokenIdDataChangedEventReturn<PartialTokenIdDataChangedEvent>;
  function useLatestTokenIdDataChangedEvent(
    params: UseLatestTokenIdDataChangedEventParams & {
      include?: TokenIdDataChangedEventInclude;
    } = {},
  ): UseLatestTokenIdDataChangedEventReturn<PartialTokenIdDataChangedEvent> {
    const { data, ...rest } = impl(params);
    return { tokenIdDataChangedEvent: data, ...rest };
  }

  return useLatestTokenIdDataChangedEvent;
}
