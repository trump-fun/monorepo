'use client';

import { GET_BETS, GET_BETS_SUBSCRIPTION } from '@/app/queries';
import { useQuery, useSubscription } from '@apollo/client';
import { Bet, Bet_OrderBy, POINTS_DECIMALS, Pool } from '@trump-fun/common';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, Clock, Loader2 } from 'lucide-react';
import { type FC, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { RandomAvatar } from 'react-random-avatars';

interface ActivityProps {
  pool: Pool;
}

export const Activity: FC<ActivityProps> = ({ pool }) => {
  const { id: poolId } = pool;
  const [page, setPage] = useState(1);
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const pageSize = 10;

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const { data, loading, error, fetchMore } = useQuery<{ bets: Bet[] }>(GET_BETS, {
    variables: {
      filter: {
        poolId,
      },
      first: pageSize,
      skip: 0,
      orderBy: Bet_OrderBy.CreatedAt,
      orderDirection: 'desc',
    },
    context: { name: 'userBets' },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
  });

  useSubscription(GET_BETS_SUBSCRIPTION, {
    variables: {
      filter: {
        poolId,
      },
      first: pageSize,
      skip: 0,
      orderBy: Bet_OrderBy.CreatedAt,
      orderDirection: 'desc',
    },
    shouldResubscribe: true,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.bets) {
        setAllBets(prevBets => {
          const newBets = subscriptionData.data.bets;
          const existingIds = new Set(prevBets.map(bet => bet.id));
          const uniqueNewBets = newBets.filter((bet: Bet) => !existingIds.has(bet.id));

          if (uniqueNewBets.length === 0) return prevBets;

          return [...uniqueNewBets, ...prevBets]
            .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
            .slice(0, page * pageSize);
        });
      }
    },
  });

  useEffect(() => {
    if (data?.bets) {
      setAllBets(data.bets);
    }
  }, [data]);

  useEffect(() => {
    if (inView && !loading && data?.bets.length === page * pageSize) {
      const loadMore = () => {
        fetchMore({
          variables: {
            skip: page * pageSize,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;

            setPage(prevPage => prevPage + 1);

            return {
              bets: [...prev.bets, ...fetchMoreResult.bets],
            };
          },
        });
      };

      loadMore();
    }
  }, [inView, loading, data?.bets?.length, page, pageSize, fetchMore]);

  const formatTimestamp = (timestamp: string | bigint): string => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'unknown time';
    }
  };

  const truncateAddress = (address: string | Uint8Array): string => {
    if (!address) return 'Anonymous';
    const addr = address.toString();
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getOptionLabel = (optionIndex: string | bigint): string => {
    const index = Number(optionIndex);
    if (pool.options && pool.options[index]) {
      return pool.options[index];
    }
    return `Option ${index}`;
  };

  if (loading && allBets.length === 0) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20'>
        <p className='font-medium'>Error loading activity</p>
        <p className='text-sm'>{error.message}</p>
      </div>
    );
  }

  return (
    <div className='mt-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>Recent Activity</h2>
        <span className='text-sm text-gray-500'>{allBets.length} bets found</span>
      </div>

      {allBets.length > 0 ? (
        <div className='space-y-4'>
          {allBets.map(bet => (
            <div
              key={bet.id}
              className='group hover:border-primary/30 rounded-xl border bg-white/50 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-lg dark:border-gray-800 dark:bg-white/10 dark:hover:bg-white/20 dark:hover:shadow-lg'
            >
              <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='overflow-hidden rounded-full ring-2 ring-gray-100 dark:ring-gray-700'>
                    <RandomAvatar size={48} name={bet.id} />
                  </div>

                  <div>
                    <div className='flex items-center gap-2'>
                      <p className='font-semibold tracking-tight'>{truncateAddress(bet.user)}</p>
                    </div>
                    <div className='mt-1.5 flex items-center gap-2 text-gray-500 dark:text-gray-400'>
                      <Clock className='h-3.5 w-3.5' />
                      <p className='text-sm'>{formatTimestamp(bet.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-4'>
                  <div className='flex flex-col items-end'>
                    <span className='text-primary group-hover:text-primary/90 text-xl font-bold transition-colors'>
                      {parseFloat(bet.amount) / 10 ** POINTS_DECIMALS} {bet.tokenType}
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>placed on</span>
                  </div>

                  <div className='rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium shadow-sm dark:bg-gray-800 dark:text-gray-200'>
                    {getOptionLabel(bet.option)}
                  </div>

                  <div
                    className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm ${
                      bet.isWithdrawn
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}
                  >
                    {bet.isWithdrawn ? 'Withdrawn' : 'Active'}
                  </div>
                </div>
              </div>

              {bet.transactionHash && (
                <div className='mt-4 border-t pt-4 dark:border-gray-800'>
                  <a
                    href={`https://sepolia.basescan.org/tx/${bet.transactionHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:text-primary dark:hover:text-primary flex items-center gap-2 text-xs text-gray-500 transition-colors dark:text-gray-400'
                  >
                    <span className='rounded bg-gray-100 px-2 py-1 font-medium uppercase dark:bg-gray-800'>
                      {bet.chainName}
                    </span>
                    <ArrowUpRight className='h-3.5 w-3.5' />
                    <span className='max-w-[220px] truncate'>{bet.transactionHash}</span>
                  </a>
                </div>
              )}
            </div>
          ))}

          <div
            ref={ref}
            className={`flex justify-center py-4 ${loading && allBets.length > 0 ? 'visible' : 'invisible'}`}
          >
            <Loader2 className='text-primary h-6 w-6 animate-spin' />
          </div>
        </div>
      ) : (
        <div className='rounded-lg border bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800'>
          <p className='text-gray-500 dark:text-gray-400'>No activity found for this pool.</p>
        </div>
      )}
    </div>
  );
};
