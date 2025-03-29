import { TokenDisplay } from '@/components/shared/TokenDisplay';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { TokenType } from '@trump-fun/common';
import { ArrowUpFromLine } from 'lucide-react';
import { BettingStats } from './BettingStats';
import { Dispatch, SetStateAction } from 'react';

export function MobileProfileSection({
  address,
  userStats,
  withdrawalProps,
  tokenType,
}: {
  address: string;
  userStats: any;
  withdrawalProps: {
    formattedWithdrawableBalance: number;
    withdrawAmount: number;
    setWithdrawAmount: Dispatch<SetStateAction<number>>;
    handleWithdraw: () => Promise<void>;
    isPending: boolean;
  };
  tokenType: TokenType;
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
    <div className='mb-6 flex flex-col items-center gap-3 md:hidden'>
      <UserAvatar address={address} />
      <div className='text-center'>
        <div className='text-xl font-bold'>
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
        </div>
      </div>
      <TokenDisplay tokenLogo={tokenLogo} tokenType={tokenType} value={formattedBalance} />

      {/* Mobile betting stats */}
      <BettingStats userStats={userStats} tokenLogo={tokenLogo} tokenType={tokenType} />

      {/* Mobile withdrawal panel */}
      <div className='w-full space-y-3'>
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
  );
}
