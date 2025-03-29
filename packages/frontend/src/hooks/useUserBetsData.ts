import { GET_BET_WITHDRAWALS, GET_BETS, GET_PAYOUT_CLAIMED } from '@/app/queries';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { useQuery } from '@apollo/client';
import { BetWithdrawal_OrderBy, OrderDirection, POLLING_INTERVALS } from '@trump-fun/common';
import { useFilterConfig } from './useFilterConfig';

export function useUserBetsData(activeFilter: string) {
  const { address } = useWalletAddress();
  const { orderBy, orderDirection, filter } = useFilterConfig(address, activeFilter);

  // Query for user bets
  const {
    data: userBets,
    loading: betsLoading,
    error: betsError,
  } = useQuery(GET_BETS, {
    variables: {
      filter: filter,
      orderBy,
      orderDirection,
    },
    context: { name: 'userBets' },
    notifyOnNetworkStatusChange: true,
    skip: !address || activeFilter === 'won',
    pollInterval: POLLING_INTERVALS['user-profile'],
  });

  // Query for won bets
  const {
    data: payoutClaimeds,
    loading: payoutsLoading,
    error: payoutsError,
  } = useQuery(GET_PAYOUT_CLAIMED, {
    variables: {
      where: filter,
      orderBy,
      orderDirection,
    },
    context: { name: 'payoutClaimeds' },
    notifyOnNetworkStatusChange: true,
    skip: !address || activeFilter !== 'won',
    pollInterval: POLLING_INTERVALS['user-profile'],
  });

  // Query for withdrawals
  const {
    data: betWithdrawals,
    loading: withdrawalsLoading,
    error: withdrawalsError,
  } = useQuery(GET_BET_WITHDRAWALS, {
    variables: {
      where: { user: address?.toLowerCase() },
      orderBy: BetWithdrawal_OrderBy.BlockTimestamp,
      orderDirection: OrderDirection.Desc,
      first: 100,
    },
    context: { name: 'betWithdrawals' },
    notifyOnNetworkStatusChange: true,
    skip: !address,
    pollInterval: POLLING_INTERVALS['user-profile'],
  });

  return {
    betsData: {
      bets: userBets?.bets || [],
      payoutClaimeds: payoutClaimeds?.payoutClaimeds || [],
      betWithdrawals: betWithdrawals?.betWithdrawals || [],
    },
    isLoading: betsLoading || payoutsLoading || withdrawalsLoading,
    isError: !!(betsError || payoutsError || withdrawalsError),
    error: betsError || payoutsError || withdrawalsError,
  };
}
