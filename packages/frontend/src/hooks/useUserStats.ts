'use client';

import { Bet, PayoutClaimed } from '@trump-fun/common';
import { calculateVolume } from '@/utils/betsCalculations';
import { useMemo } from 'react';
import { useUserBetsData } from './useUserBetsData';

export function useUserStats(bets?: Bet[], _payoutClaimeds?: PayoutClaimed[]) {
  const { betsData } = useUserBetsData('won');

  return useMemo(() => {
    const allBets = bets || [];
    const totalBets = allBets.length;

    const wonBets =
      betsData.payoutClaimeds.length +
      betsData.bets.filter((bet: Bet) => bet.pool.status === 'GRADED' && bet.isWithdrawn).length;

    const lostBets = allBets.filter(
      (bet: Bet) => bet.pool.status === 'GRADED' && !bet.isWithdrawn
    ).length;
    const pendingBets = allBets.filter((bet: Bet) => bet.pool.status === 'PENDING').length;

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
