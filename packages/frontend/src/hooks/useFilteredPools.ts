import { Bet, PayoutClaimed } from '@/types';
import { useMemo } from 'react';
export function useFilteredPools(
  activeFilter: string,
  searchQuery: string,
  bets?: Bet[],
  payoutClaimeds?: PayoutClaimed[]
) {
  return useMemo(() => {
    if (activeFilter === 'won' && payoutClaimeds?.length) {
      if (!searchQuery.trim()) return payoutClaimeds;
      const query = searchQuery.toLowerCase().trim();
      return payoutClaimeds.filter(
        (payout) =>
          payout.bet?.pool?.question.toLowerCase().includes(query) ||
          payout.pool?.question.toLowerCase().includes(query)
      );
    }

    if (!bets?.length) return [];
    if (!searchQuery.trim()) return bets;

    const query = searchQuery.toLowerCase().trim();
    return bets.filter((bet) => bet.pool.question.toLowerCase().includes(query));
  }, [bets, payoutClaimeds, searchQuery, activeFilter]);
}
