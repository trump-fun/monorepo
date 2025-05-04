import { BettingPost } from '@/components/betting-post';
import { Pool, TokenType } from '@/types';
import Image from 'next/image';

interface PoolListProps {
  pools: Pool[];
  isLoading: boolean;
  tokenType: TokenType;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement> | ((node?: Element | null) => void);
}

export function PoolList({
  pools,
  isLoading,
  tokenType,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  loadMoreRef,
}: PoolListProps) {
  // Initial loading state (completely empty page)
  if (isLoading && pools.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-8'>
        <div className='size-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-300'></div>
        <p className='mt-4 text-sm text-gray-500 dark:text-gray-400'>Loading predictions...</p>
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4'>
      {pools.length > 0 &&
        pools.map((pool) => <BettingPost key={pool.id} pool={pool} tokenType={tokenType} />)}

      {/* Load more trigger - invisible element that triggers loading more when scrolled into view */}
      {hasMore && <div ref={loadMoreRef} className='h-1 w-full' aria-hidden='true' />}

      {/* Loading indicator for when more content is being fetched */}
      {hasMore && isLoadingMore && (
        <div className='my-2 flex justify-center py-2'>
          <div className='flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm dark:bg-gray-800'>
            <div className='size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-300'></div>
            <span>Loading more...</span>
          </div>
        </div>
      )}

      {/* No results */}
      {!isLoading && pools.length === 0 && (
        <div className='py-4 text-center text-gray-500 dark:text-gray-400'>
          No predictions found
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && pools.length > 0 && (
        <div className='py-4 text-center text-gray-500 dark:text-gray-400'>
          You've reached the end!
        </div>
      )}
    </div>
  );
}
