import { BettingPost } from '@/components/betting-post';
import { GetPoolsQuery, TokenType } from '@/types/__generated__/graphql';
import { getBetTotals, getVolumeForTokenType } from '@/utils/betsInfo';
import Image from 'next/image';

interface PoolListProps {
  pools: GetPoolsQuery['pools'];
  isLoading: boolean;
  tokenType: TokenType;
}

export function PoolList({ pools, isLoading, tokenType }: PoolListProps) {
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
          />
        ))}

      {!isLoading && pools.length === 0 && (
        <div className='py-4 text-center text-gray-500 dark:text-gray-400'>No pools found</div>
      )}
    </div>
  );
}
