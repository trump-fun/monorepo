import { useWalletAddress } from '@/hooks/useWalletAddress';
import {
  Bet_Filter,
  Bet_OrderBy,
  OrderDirection,
  PayoutClaimed_Filter,
  PayoutClaimed_OrderBy,
  useGetBetsQuery,
  useGetPayoutClaimedQuery,
} from '@/types';
import { useFilterConfig } from './useFilterConfig';

export function useUserBetsData(activeFilter: string) {
  const { address } = useWalletAddress();
  const config = useFilterConfig(address!, activeFilter);

  // Query for user bets using generated hook
  const {
    data: betsData,
    loading: betsLoading,
    error: betsError,
    refetch: refetchBets,
  } = useGetBetsQuery({
    variables: {
      filter: config.where as Bet_Filter,
      orderBy: config.orderBy as Bet_OrderBy,
      orderDirection: config.orderDirection as OrderDirection,
      first: 100,
    },
    context: { name: 'userBets' },
    skip: !address || activeFilter === 'won',
    fetchPolicy: 'network-only',
  });

  // Query for payout claims using generated hook
  const {
    data: payoutsData,
    loading: payoutsLoading,
    error: payoutsError,
    refetch: refetchPayouts,
  } = useGetPayoutClaimedQuery({
    variables: {
      where: config.where as PayoutClaimed_Filter,
      orderBy: config.orderBy as PayoutClaimed_OrderBy,
      orderDirection: config.orderDirection as OrderDirection,
      first: 100,
    },
    context: { name: 'payoutClaimeds' },
    skip: !address || activeFilter !== 'won',
    fetchPolicy: 'network-only',
  });

  const refreshData = () => {
    if (address) {
      if (activeFilter !== 'won') refetchBets();
      if (activeFilter === 'won') refetchPayouts();
    }
  };

  return {
    betsData: {
      bets: betsData?.bets || [],
      payoutClaimeds: payoutsData?.payoutClaimeds || [],
      betWithdrawals: [],
    },
    isLoading: betsLoading || payoutsLoading,
    isError: !!(betsError || payoutsError),
    error: betsError || payoutsError,
    refreshData,
  };
}
