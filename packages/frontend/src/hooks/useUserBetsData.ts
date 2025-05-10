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
  console.log('useUserBetsData', address, activeFilter);

  const config = useFilterConfig(address!, activeFilter);

  // Enhanced logging to debug the filter configuration
  console.log('useUserBetsData config', JSON.stringify(config.where, null, 2));

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
    onError: (error) => {
      console.error('Error fetching bets:', error.message, error.graphQLErrors);
    },
    onCompleted: (data) => {
      console.log(`Fetched ${data?.bets?.length || 0} bets for filter: ${activeFilter}`);
    },
  });

  const variables = {
    where: config.where as PayoutClaimed_Filter,
    orderBy: config.orderBy as PayoutClaimed_OrderBy,
    orderDirection: config.orderDirection as OrderDirection,
    first: 100,
  };

  console.log('useUserBetsData variables', JSON.stringify(variables, null, 2));

  // Query for payout claims using generated hook
  const {
    data: payoutsData,
    loading: payoutsLoading,
    error: payoutsError,
    refetch: refetchPayouts,
  } = useGetPayoutClaimedQuery({
    variables,
    context: { name: 'payoutClaimeds' },
    skip: !address || activeFilter !== 'won',
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Error fetching payouts:', error.message, error.graphQLErrors);
    },
    onCompleted: (data) => {
      console.log(
        `Fetched ${data?.payoutClaimeds?.length || 0} payouts for filter: ${activeFilter}`
      );
    },
  });

  const refreshData = () => {
    if (address) {
      if (activeFilter !== 'won') refetchBets();
      if (activeFilter === 'won') refetchPayouts();
    }
  };

  // Log any errors encountered during data fetching
  if (betsError) {
    console.error('Bets query error:', betsError.message, betsError.graphQLErrors);
  }
  if (payoutsError) {
    console.error('Payouts query error:', payoutsError.message, payoutsError.graphQLErrors);
  }

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
