'use client';

import { Loader2, Search } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { RawJsonToggle } from './shared';

/** Skeleton loading placeholder card matching the size of a typical domain card. */
export function CardSkeleton(): React.ReactNode {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

interface ResultsHeaderProps {
  isLoading: boolean;
  isFetching: boolean;
  /** For list mode: total matching count from aggregate */
  totalCount?: number;
  /** For infinite mode: currently loaded count */
  loadedCount?: number;
  label?: string;
}

/** Displays result count with loading indicator. Shows "X found" (list mode) or "X loaded" (infinite mode). */
export function ResultsHeader({
  isLoading,
  isFetching,
  totalCount,
  loadedCount,
  label = 'results',
}: ResultsHeaderProps): React.ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isLoading ? (
        <Skeleton className="h-4 w-32" />
      ) : (
        <>
          <span className="font-medium text-foreground">{totalCount ?? loadedCount ?? 0}</span>{' '}
          {totalCount !== undefined ? `${label} found` : `${label} loaded`}
          {isFetching && <Loader2 className="size-3.5 animate-spin" />}
        </>
      )}
    </div>
  );
}

interface ResultsListProps<T> {
  items: T[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  /** Render a single item card */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Unique key extractor */
  getKey: (item: T) => string;
  /** Label for empty/count display (e.g., 'profiles', 'assets') */
  label?: string;
  /** For list mode */
  totalCount?: number;
  /** Infinite scroll props — if provided, shows Load More */
  infinite?: {
    hasNextPage: boolean;
    fetchNextPage: () => void;
    isFetchingNextPage: boolean;
  };
  /** Whether any filter is active (for empty state message) */
  hasActiveFilter?: boolean;
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
}

/** Generic paginated results list with loading, error, empty, and infinite scroll states. */
export function ResultsList<T>({
  items,
  isLoading,
  isFetching,
  error,
  renderItem,
  getKey,
  label = 'results',
  totalCount,
  infinite,
  hasActiveFilter,
  skeletonCount = 3,
}: ResultsListProps<T>): React.ReactNode {
  return (
    <div className="space-y-4">
      <ResultsHeader
        isLoading={isLoading}
        isFetching={infinite ? isFetching && !infinite.isFetchingNextPage : isFetching}
        totalCount={totalCount}
        loadedCount={infinite ? items.length : undefined}
        label={label}
      />
      {error && (
        <Alert variant="destructive">
          <Search className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {!isLoading && items.length > 0 && (
        <div className="grid gap-3">
          {items.map((item, i) => (
            <React.Fragment key={getKey(item)}>{renderItem(item, i)}</React.Fragment>
          ))}
        </div>
      )}
      {infinite?.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => infinite.fetchNextPage()}
            disabled={infinite.isFetchingNextPage}
          >
            {infinite.isFetchingNextPage ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
      {infinite && !infinite.hasNextPage && items.length > 0 && !isLoading && (
        <p className="text-center text-sm text-muted-foreground pt-2">
          All {label} loaded ({items.length} total)
        </p>
      )}
      {!isLoading && !error && items.length === 0 && (
        <Alert>
          <Search className="h-4 w-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            {hasActiveFilter
              ? `No ${label} match the current filters. Try adjusting your search.`
              : `No ${label} found.`}
          </AlertDescription>
        </Alert>
      )}
      {items.length > 0 && <RawJsonToggle data={items} label={`${items.length} ${label}`} />}
    </div>
  );
}
