'use client';

import { GetPayoutClaimedQuery, PoolStatus } from '@/types';
import { BetsQueryResultTypeMulti } from '@/types/bet';
import { calculateVolume } from '@/utils/betsCalculations';
import { useMemo } from 'react';
import { useUserBetsData } from './useUserBetsData';

export function useUserStats(
  bets?: BetsQueryResultTypeMulti,
  _payoutClaimeds?: GetPayoutClaimedQuery['payoutClaimeds']
) {
  const { betsData } = useUserBetsData('won');

  return useMemo(() => {
    const allBets = bets || [];
    const totalBets = allBets.length;

    const wonBets =
      betsData.payoutClaimeds.length +
      betsData.bets.filter((bet) => bet.pool.status === PoolStatus.Graded && bet.isWithdrawn)
        .length;

    const lostBets = allBets.filter(
      (bet) => bet.pool.status === PoolStatus.Graded && !bet.isWithdrawn
    ).length;
    const pendingBets = allBets.filter((bet) => bet.pool.status === PoolStatus.Pending).length;

    // Calculate volumes
    const { totalVolume, activeVolume } = calculateVolume(allBets);

    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
    const avgBetSize = totalBets > 0 ? totalVolume / totalBets : 0;

    return {
      totalBets,
      wonBets,
      lostBets,
      pendingBets,
      totalVolume,
      activeVolume,
      winRate: winRate.toFixed(1),
      avgBetSize: avgBetSize.toFixed(0),
    };
  }, [bets, betsData.bets, betsData.payoutClaimeds.length]);
}
