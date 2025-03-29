import { TokenDisplay } from '@/components/shared/TokenDisplay';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { ArrowUpFromLine, History } from 'lucide-react';
import { BettingStats } from './BettingStats';
import { RecentWithdrawals } from './RecentWithdrawals';
import { TokenType } from '@trump-fun/common';

export function ProfileSidebar({
  address,
  activeFilter,
  handleFilterChange,
  userStats,
  withdrawalProps,
  tokenType,
  betWithdrawals,
}: {
  address?: string;
  activeFilter: string;
  handleFilterChange: (filter: string) => void;
  userStats: any; // Replace with actual type
  withdrawalProps: any; // Replace with actual type
  tokenType: TokenType;
  betWithdrawals?: any[]; // Replace with actual type
}) {
  const { formattedBalance, tokenLogo } = useTokenBalance();

  const {
    formattedWithdrawableBalance,
    withdrawAmount,
    setWithdrawAmount,
    handleWithdraw,
    isPending,
  } = withdrawalProps;

  return (
    <div className='hidden w-60 flex-col border-r border-gray-200 p-4 md:flex dark:border-gray-800'>
      <div className='mb-6 flex flex-col items-center gap-3'>
        <UserAvatar address={address} />
        <div className='text-center'>
          <div className='text-xl font-bold'>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
          </div>
        </div>
        <TokenDisplay tokenType={tokenType} tokenLogo={tokenLogo} value={formattedBalance} />

        {/* Betting Statistics */}
        <BettingStats userStats={userStats} tokenLogo={tokenLogo} tokenType={tokenType} />
      </div>

      {/* Token Actions */}
      <div className='space-y-3'>
        <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>Token Actions</div>

        <p className='text-sm text-gray-500 dark:text-gray-400'>
          Withdrawable Balance: {tokenLogo}
          {formattedWithdrawableBalance}
        </p>

        <div className='mb-2'>
          <Input
            type='number'
            placeholder='Enter amount'
            className='w-full border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800'
            value={withdrawAmount}
            onChange={e => setWithdrawAmount(Number(e.target.value))}
          />
        </div>
        <div className='flex w-full'>
          <Button
            variant='outline'
            className='flex w-full items-center justify-center gap-1 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/20 dark:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400'
            onClick={handleWithdraw}
            disabled={isPending}
          >
            <ArrowUpFromLine className='h-4 w-4' />
            <span>Withdraw</span>
          </Button>
        </div>
      </div>

      <Separator className='my-4' />

      {/* Filter Buttons */}
      <nav className='space-y-1'>
        {renderFilterButton('active', 'Active Bets', activeFilter, handleFilterChange)}
        {renderFilterButton('won', 'Won Bets', activeFilter, handleFilterChange)}
        {renderFilterButton('lost', 'Lost Bets', activeFilter, handleFilterChange)}
        {renderFilterButton('all', 'All Bets', activeFilter, handleFilterChange)}
        <Separator className='my-2' />
      </nav>

      {/* Recent Withdrawals if available */}
      {betWithdrawals && betWithdrawals.length > 0 && (
        <RecentWithdrawals withdrawals={betWithdrawals} />
      )}
    </div>
  );
}

function renderFilterButton(
  value: string,
  label: string,
  activeFilter: string,
  handleFilterChange: (filter: string) => void
) {
  return (
    <Button
      variant={activeFilter === value ? 'default' : 'ghost'}
      className='w-full justify-start gap-2 font-medium'
      onClick={() => handleFilterChange(value)}
    >
      <History className='h-4 w-4' />
      {label}
    </Button>
  );
}
