/** @see createUseDetail */
import { dataChangedEventKeys } from '@lsp-indexer/node';
import type {
  DataChangedEvent,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
  UseLatestDataChangedEventParams,
} from '@lsp-indexer/types';
import type { UseLatestDataChangedEventReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

type LatestDataChangedEventParams = UseLatestDataChangedEventParams & {
  include?: DataChangedEventInclude;
};

export function createUseLatestDataChangedEvent(
  queryFn: (params: LatestDataChangedEventParams) => Promise<PartialDataChangedEvent | null>,
) {
  const impl = createUseDetail<LatestDataChangedEventParams, PartialDataChangedEvent>({
    queryKey: (p) => dataChangedEventKeys.latest(p.filter, p.include),
    queryFn,
    enabled: () => true,
  });

  function useLatestDataChangedEvent<const I extends DataChangedEventInclude>(
    params: UseLatestDataChangedEventParams & { include: I },
  ): UseLatestDataChangedEventReturn<DataChangedEventResult<I>>;
  function useLatestDataChangedEvent(
    params?: Omit<UseLatestDataChangedEventParams, 'include'> & { include?: never },
  ): UseLatestDataChangedEventReturn<DataChangedEvent>;
  function useLatestDataChangedEvent(
    params: UseLatestDataChangedEventParams & { include?: DataChangedEventInclude },
  ): UseLatestDataChangedEventReturn<PartialDataChangedEvent>;
  function useLatestDataChangedEvent(
    params: UseLatestDataChangedEventParams & { include?: DataChangedEventInclude } = {},
  ): UseLatestDataChangedEventReturn<PartialDataChangedEvent> {
    const { data, ...rest } = impl(params);
    return { dataChangedEvent: data, ...rest };
  }

  return useLatestDataChangedEvent;
}
