import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import CountdownTimer from './Timer';
import { PoolImage } from './pool-image';

interface EndingSoonBetProps {
  imageUrl: string;
  question: string;
  volume: string;
  timeLeft: string;
  poolId: string;
}

export function EndingSoonBet({
  imageUrl,
  question,
  volume,
  timeLeft,
  poolId,
}: EndingSoonBetProps) {
  return (
    <Link
      href={`/pools/${poolId}`}
      className='-m-2 block rounded-md p-2 transition-colors hover:bg-gray-900'
    >
      <div className='flex gap-3'>
        <PoolImage imageUrl={imageUrl} width={32} height={32} />
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
