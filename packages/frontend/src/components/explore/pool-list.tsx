import { BettingPost } from '@/components/betting-post';
import { Pool, TokenType } from '@/types';

interface PoolListProps {
  pools: Pool[];
  isLoading: boolean;
  tokenType: TokenType;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function PoolList({
  pools,
  isLoading,
  tokenType,
  hasMore = false,
  onLoadMore: _onLoadMore, // Prefix with underscore to mark as unused
  isLoadingMore: _isLoadingMore = false, // Prefix with underscore to mark as unused
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

  // No results
  if (!isLoading && pools.length === 0) {
    return (
      <div className='py-12 text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6 text-gray-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            />
          </svg>
        </div>
        <p className='text-lg font-semibold text-gray-700 dark:text-gray-300'>
          No predictions found
        </p>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          Try changing your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4'>
      {/* Render the pool cards */}
      {pools.map((pool) => (
        <BettingPost key={pool.id} pool={pool} tokenType={tokenType} />
      ))}

      {/* End of list indicator */}
      {!hasMore && pools.length > 0 && (
        <div className='py-4 text-center text-gray-500 dark:text-gray-400'>
          You&apos;ve reached the end of the predictions!
        </div>
      )}
    </div>
  );
}
