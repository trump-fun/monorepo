import { useWalletAddress } from '@/hooks/useWalletAddress';
import { useQuery } from '@apollo/client';
import {
  Bet_Filter,
  Bet_OrderBy,
  BetWithdrawal_OrderBy,
  GET_BET_WITHDRAWALS,
  GET_BETS,
  GET_PAYOUT_CLAIMED,
  OrderDirection,
  PayoutClaimed_Filter,
  PayoutClaimed_OrderBy,
} from '@trump-fun/common';
import { useFilterConfig } from './useFilterConfig';

export function useUserBetsData(activeFilter: string) {
  const { address } = useWalletAddress();
  const config = useFilterConfig(address, activeFilter);

  // Query for user bets
  const {
    data: betsData,
    loading: betsLoading,
    error: betsError,
    refetch: refetchBets,
  } = useQuery(GET_BETS, {
    variables: {
      filter: ('filter' in config ? config.filter : {}) satisfies Bet_Filter,
      orderBy: config.orderBy as Bet_OrderBy,
      orderDirection: config.orderDirection as OrderDirection,
    },
    context: { name: 'userBets' },
    skip: !address || activeFilter === 'won',
    fetchPolicy: 'network-only',
  });

  const {
    data: payoutsData,
    loading: payoutsLoading,
    error: payoutsError,
    refetch: refetchPayouts,
  } = useQuery(GET_PAYOUT_CLAIMED, {
    variables: {
      where: ('where' in config ? config.where : {}) as PayoutClaimed_Filter,
      orderBy: config.orderBy as PayoutClaimed_OrderBy,
      orderDirection: config.orderDirection as OrderDirection,
    },
    context: { name: 'payoutClaimeds' },
    skip: !address || activeFilter !== 'won',
    fetchPolicy: 'network-only',
  });

  const {
    data: withdrawalsData,
    loading: withdrawalsLoading,
    error: withdrawalsError,
    refetch: refetchWithdrawals,
  } = useQuery(GET_BET_WITHDRAWALS, {
    variables: {
      where: { user: address?.toLowerCase() },
      orderBy: BetWithdrawal_OrderBy.BlockTimestamp,
      orderDirection: OrderDirection.Desc,
      first: 100,
    },
    context: { name: 'betWithdrawals' },
    skip: !address,
    fetchPolicy: 'network-only',
  });

  const refreshData = () => {
    if (address) {
      if (activeFilter !== 'won') refetchBets();
      if (activeFilter === 'won') refetchPayouts();
      refetchWithdrawals();
    }
  };

  return {
    betsData: {
      bets: betsData?.bets || [],
      payoutClaimeds: payoutsData?.payoutClaimeds || [],
      betWithdrawals: withdrawalsData?.betWithdrawals || [],
    },
    isLoading: betsLoading || payoutsLoading || withdrawalsLoading,
    isError: !!(betsError || payoutsError || withdrawalsError),
    error: betsError || payoutsError || withdrawalsError,
    refreshData,
  };
}
