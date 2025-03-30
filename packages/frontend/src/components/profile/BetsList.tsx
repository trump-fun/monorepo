import { UserBettingPost } from '@/components/user-betting-post';
import { Bet, PayoutClaimed } from '@/types/__generated__/graphql';
import { getVolumeForTokenType } from '@/utils/betsInfo';
import { Loader } from 'lucide-react';

export function BetsList({
  pools,
  activeFilter,
  isLoading,
}: {
  pools: (Bet | PayoutClaimed)[];
  activeFilter: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <Loader className='h-6 w-6 animate-spin text-gray-500' />
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className='py-8 text-center text-gray-500 dark:text-gray-400'>
        No bets found for this filter
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4'>
      {pools.map((item) => {
        const bet = activeFilter === 'won' ? (item as PayoutClaimed).bet : (item as Bet);
        const pool =
          activeFilter === 'won'
            ? (item as PayoutClaimed).pool || (item as PayoutClaimed).bet?.pool
            : (item as Bet).pool;
        const amount =
          activeFilter === 'won' ? (item as PayoutClaimed).amount : (item as Bet).amount;

        // Calculate payout info
        const { payout, netWinnings } = calculatePayoutInfo(activeFilter, item, bet);

        // Get winning option for lost bets
        const winningOption = getWinningOption(activeFilter, pool);

        return (
          <UserBettingPost
            key={bet.id}
            id={bet.pool.id}
            username='realDonaldTrump'
            time={pool.createdAt}
            question={pool.question}
            status={pool.status}
            options={pool.options}
            selectedOption={bet.option}
            truthSocialId={pool.originalTruthSocialPostId}
            volume={getVolumeForTokenType(pool, bet.tokenType)}
            closesAt={pool.betsCloseAt}
            userBet={{
              amount: amount,
              selectedOption: bet.option,
              outcome: determineBetOutcome(activeFilter, pool, bet),
              payout: payout,
              netWinnings: netWinnings,
              winningOption: winningOption,
            }}
            tokenType={bet.tokenType}
          />
        );
      })}
    </div>
  );
}

function calculatePayoutInfo(activeFilter: string, item: Bet | PayoutClaimed, bet: Bet) {
  // Calculate net winnings if this is a won bet
  const payout = activeFilter === 'won' ? item.amount : undefined;

  // Calculate net winnings (payout minus original bet amount)
  let netWinnings;
  try {
    if (activeFilter === 'won' && payout && bet.amount) {
      const payoutBigInt = BigInt(payout);
      const betAmountBigInt = BigInt(bet.amount);
      // Ensure we don't have negative profit
      netWinnings =
        payoutBigInt > betAmountBigInt ? (payoutBigInt - betAmountBigInt).toString() : '0';
    }
  } catch (error) {
    console.error('Error calculating net winnings:', error);
    netWinnings = '0';
  }

  return { payout, netWinnings };
}

function getWinningOption(activeFilter: string, pool: Bet['pool']) {
  return activeFilter === 'lost' && pool.winningOption !== undefined
    ? pool.options[pool.winningOption]
    : undefined;
}

function determineBetOutcome(activeFilter: string, pool: Bet['pool'], bet: Bet) {
  if (activeFilter === 'won') return 'won';
  if (activeFilter === 'lost') return 'lost';

  return pool.status === 'GRADED' ? (bet.isWithdrawn ? 'won' : 'lost') : 'pending';
}
