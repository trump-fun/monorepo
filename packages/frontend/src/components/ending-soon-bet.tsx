import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import CountdownTimer from './Timer';

interface EndingSoonBetProps {
  avatar: string;
  question: string;
  volume: string;
  timeLeft: string;
  poolId: string;
}

export function EndingSoonBet({ avatar, question, volume, timeLeft, poolId }: EndingSoonBetProps) {
  const { data: poolData } = useQuery({
    queryKey: ['ending-soon-bet', poolId],
    queryFn: async () => {
      const res = await fetch(`/api/post?poolId=${poolId}`);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      return res.json();
    },
    staleTime: 60000, // Consider data stale after 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return (
    <Link
      href={`/pools/${poolId}`}
      className='-m-2 block rounded-md p-2 transition-colors hover:bg-gray-900'
    >
      <div className='flex gap-3'>
        <Avatar className='h-8 w-8 overflow-hidden rounded-full'>
          <AvatarImage src={poolData ? poolData?.post?.image_url : avatar} alt='User' />
          <AvatarFallback>
            <Image src={'/trump.jpeg'} alt='User' width={32} height={32} />
          </AvatarFallback>
        </Avatar>
        <div className='flex-1'>
          <p className='mb-1 line-clamp-2 text-sm'>{question}</p>
          <div className='flex items-center justify-between gap-4 text-xs text-gray-400'>
            <div className='flex items-center gap-1'>
              <CountdownTimer
                closesAt={parseInt(timeLeft) * 1000}
                containerClassName='flex'
                wrapperClassName='flex'
                digitClassName='text-xs'
                colonClassName='text-xs px-[1px]'
                showClockIcon={true}
                clockIconClassName='mr-1 text-gray-400'
                clockIconSize={12}
              />
            </div>
            <div className='flex items-center gap-1'>
              <TrendingUp size={12} />
              <span>{volume}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
