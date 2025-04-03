import { BettingPost } from '@/components/betting-post';
import { GetPoolsQuery, TokenType } from '@/types/__generated__/graphql';
import { getBetTotals, getVolumeForTokenType } from '@/utils/betsInfo';
import Image from 'next/image';

interface PoolListProps {
  pools: GetPoolsQuery['pools'];
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
  onLoadMore,
  isLoadingMore = false,
}: PoolListProps) {
  if (isLoading && pools.length === 0) {
    return (
      <div className='container mx-auto flex h-screen max-w-4xl flex-col items-center justify-center px-4 py-8'>
        <Image
          src='/loader.gif'
          alt='Loading'
          width={100}
          height={100}
          className='z-50 size-40 animate-spin rounded-full'
        />
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4'>
      {isLoading && pools.length > 0 && (
        <div className='fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md bg-black/70 px-3 py-2 text-sm text-white dark:bg-white/10'>
          <div className='size-4 animate-spin rounded-full border-2 border-gray-300 border-t-white'></div>
          <span>Updating...</span>
        </div>
      )}

      {pools.length > 0 &&
        pools.map((pool) => (
          <BettingPost
            key={pool.id}
            id={pool.id}
            avatar='/trump.jpeg'
            username='realDonaldTrump'
            time={pool.createdAt}
            question={pool.question}
            options={pool.options}
            commentCount={0}
            truthSocialId={pool.originalTruthSocialPostId}
            volume={getVolumeForTokenType(pool, tokenType)}
            optionBets={pool.options.map((_, index) => getBetTotals(pool, tokenType, index))}
            closesAt={pool.betsCloseAt}
            gradedBlockTimestamp={pool.gradedBlockTimestamp}
            status={pool.status}
            bets={pool.bets.map((bet) => ({ ...bet, createdAt: bet.updatedAt }))}
          />
        ))}

      {hasMore && (
        <div className='flex justify-center py-4'>
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore || isLoading}
            className='bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
          >
            {isLoadingMore ? (
              <>
                <div className='size-4 animate-spin rounded-full border-2 border-white/30 border-t-white'></div>
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </button>
        </div>
      )}

      {!isLoading && pools.length === 0 && (
        <div className='py-4 text-center text-gray-500 dark:text-gray-400'>No pools found</div>
      )}
    </div>
  );
}
