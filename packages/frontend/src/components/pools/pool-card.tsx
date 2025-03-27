'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTokenContext } from '@/hooks/useTokenContext';
import { calculateOptionPercentages, calculateVolume } from '@/utils/betsInfo';
import { useQuery } from '@tanstack/react-query';
import { GetPoolsQuery } from '@trump-fun/common';
import { formatDistance } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import TruthSocial from '../common/truth-social';
import CountdownTimer from '../Timer';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function PoolCard({ pool }: { pool: GetPoolsQuery['pools'][number] }) {
  const { tokenType } = useTokenContext();

  const { data: postData } = useQuery({
    queryKey: ['user-bet', pool.id],
    queryFn: async () => {
      const res = await fetch(`/api/post?poolId=${pool.id}`);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      return res.json();
    },
    staleTime: 60000, // Consider data stale after 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const percentages = calculateOptionPercentages(pool, tokenType);

  const isClosed = new Date(Number(pool.betsCloseAt) * 1000) < new Date();

  const imageUrl = postData?.post?.image_url;
  return (
    <div>
      <Card className='h-full transition-shadow hover:shadow-md'>
        <CardHeader>
          <div className='flex items-center gap-x-3'>
            <Avatar className='size-8'>
              <AvatarImage
                src={imageUrl && !imageUrl.includes('bfl.ai') ? imageUrl : '/trump.jpeg'}
                alt='Donald Trump'
              />
              <AvatarFallback>
                <Image src={'/trump.jpeg'} alt='User' width={32} height={32} />
              </AvatarFallback>
            </Avatar>
            <div className='flex w-full items-center justify-between'>
              <div className='flex items-center gap-x-1'>
                <span className='font-bold'>realDonaldTrump</span>
              </div>
              {pool.originalTruthSocialPostId && (
                <div className='flex items-center gap-x-2'>
                  <span className='text-muted-foreground text-xs'>
                    {formatDistance(new Date(pool.createdAt * 1000), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                  <TruthSocial postId={pool.originalTruthSocialPostId} />
                </div>
              )}
            </div>
          </div>
          <CardTitle className=''>
            <Link href={`/pools/${pool.id}`} className='block'>
              <p className='line-clamp-3 text-base font-medium transition-colors hover:text-orange-500'>
                {pool.question}
              </p>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className='flex h-full flex-col'>
          {pool.options.length > 0 ? (
            <div className='mb-4'>
              <div className='mb-2 flex justify-between text-sm font-medium'>
                {pool.options.map((option, index) => {
                  return (
                    <span key={index} className={index === 0 ? 'text-green-500' : 'text-red-500'}>
                      {option} {percentages[index]}%
                    </span>
                  );
                })}
              </div>
              <ProgressBar percentages={percentages} />
            </div>
          ) : null}
          <div className='flex items-center justify-between'>
            <div className='text-muted-foreground text-sm'>
              {isClosed ? 'Bets are closed' : <CountdownTimer closesAt={pool.betsCloseAt * 1000} />}
            </div>
            <div className='text-muted-foreground text-sm'>
              <span className='text-muted-foreground'>Vol: </span>
              {calculateVolume(pool, tokenType)}
            </div>
          </div>
          <Link href={`/pools/${pool.id}`} className='mt-auto pt-4'>
            <Button className='w-full bg-orange-500 text-white hover:bg-orange-600'>
              View Details
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
