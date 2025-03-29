'use client';

import { calculateVolume } from '@/utils/betsCalculations';
import { Bet, PayoutClaimed } from '@trump-fun/common';
import { useMemo } from 'react';

export function useUserStats(bets?: Bet[], payoutClaimeds?: PayoutClaimed[]) {
  return useMemo(() => {
    const allBets = bets || [];
    const totalBets = allBets.length;
    const wonBets = payoutClaimeds?.length || 0;
    const lostBets = allBets.filter(bet => bet.pool.status === 'GRADED' && !bet.isWithdrawn).length;
    const pendingBets = allBets.filter(bet => bet.pool.status === 'PENDING').length;

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
  }, [bets, payoutClaimeds]);
}
