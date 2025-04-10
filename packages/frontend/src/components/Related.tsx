'use client';

import { Pool } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { type FC } from 'react';
import { PoolCard } from './pools/pool-card';

interface RelatedProps {
  question: string;
}

export const Related: FC<RelatedProps> = ({ question }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['related', question],
    queryFn: async () => {
      const response = await fetch(`/api/related?question=${question}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!question,
  });

  if (isLoading) {
    return (
      <div>
        <Loader2 className='text-primary h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const pools = data.relatedPools.pools;

  if (pools) {
    return (
      <div className='mt-6 space-y-4'>
        <h2 className='text-xl font-semibold'>Related Pools</h2>
        <div className='flex flex-col gap-2'>
          {pools.map((pool: Pool) => (
            <PoolCard key={pool.id} pool={pool as unknown as Pool} />
          ))}
        </div>
      </div>
    );
  }
  // Fallback if no related pools are found
  if (data && pools.length === 0) {
    return <div>No related pools found.</div>;
  }

  return <></>;
};
