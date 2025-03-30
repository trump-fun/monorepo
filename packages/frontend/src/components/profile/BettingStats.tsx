import { POINTS_DECIMALS, USDC_DECIMALS } from '@trump-fun/common';
import { TokenType } from '@/types';
export function BettingStats({
  userStats,
  tokenLogo,
  tokenType,
}: {
  userStats: any; // Replace with actual type
  tokenLogo: React.ReactNode;
  tokenType: TokenType;
}) {
  return (
    <div className='w-full space-y-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
      <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>Betting Stats</div>
      <div className='grid grid-cols-2 gap-4 text-xs'>
        <StatItem label='Total Bets' value={userStats.totalBets} isAnimated={true} />
        <StatItem label='Win Rate' value={`${userStats.winRate}%`} className='text-green-500' />
        <div className='flex flex-col gap-y-2.5'>
          <div className='text-gray-500 dark:text-gray-400'>Total Volume</div>
          <div className='flex items-center gap-1 font-semibold'>
            {tokenLogo}
            <span className='relative mr-5'>{formatAmount(userStats.totalVolume, tokenType)}</span>
          </div>
        </div>
        <div className='flex flex-col gap-y-2.5'>
          <div className='text-gray-500 dark:text-gray-400'>Avg Bet Size</div>
          <div className='flex items-center gap-1 font-semibold'>
            {tokenLogo}
            {formatAmount(userStats.avgBetSize, tokenType)}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  className = '',
  isAnimated = false,
}: {
  label: string;
  value: string | number;
  className?: string;
  isAnimated?: boolean;
}) {
  return (
    <div className='flex flex-col gap-y-1'>
      <div className='text-gray-500 dark:text-gray-400'>{label}</div>
      <div className={`font-semibold ${isAnimated ? 'animate-pulse' : ''} ${className}`}>
        {value}
      </div>
    </div>
  );
}

function formatAmount(amount: string | number, tokenType: TokenType) {
  return tokenType === TokenType.Usdc
    ? `${(Number(amount) / Math.pow(10, USDC_DECIMALS)).toLocaleString()}`
    : `${Math.floor(Number(amount) / Math.pow(10, POINTS_DECIMALS)).toLocaleString()}`;
}
