import {
  GET_BET_WITHDRAWALS,
  GET_BET_WITHDRAWALS_SUBSCRIPTION,
  GET_BETS,
  GET_BETS_SUBSCRIPTION,
  GET_PAYOUT_CLAIMED,
  GET_PAYOUT_CLAIMED_SUBSCRIPTION,
} from '@/app/queries';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { useQuery, useSubscription } from '@apollo/client';
import { BetWithdrawal_OrderBy, OrderDirection } from '@trump-fun/common';
import { useEffect, useState } from 'react';
import { useFilterConfig } from './useFilterConfig';

export function useUserBetsData(activeFilter: string) {
  const { address } = useWalletAddress();
  const { orderBy, orderDirection, filter } = useFilterConfig(address, activeFilter);

  // State for subscription data
  const [bets, setBets] = useState<any[]>([]);
  const [payoutClaimeds, setPayoutClaimeds] = useState<any[]>([]);
  const [betWithdrawals, setBetWithdrawals] = useState<any[]>([]);

  // Initial Query for user bets
  const {
    data: initialBets,
    loading: betsLoading,
    error: betsError,
  } = useQuery(GET_BETS, {
    variables: {
      filter: filter,
      orderBy,
      orderDirection,
    },
    context: { name: 'userBets' },
    skip: !address || activeFilter === 'won',
    fetchPolicy: 'network-only',
  });

  // Subscription for user bets
  useSubscription(GET_BETS_SUBSCRIPTION, {
    variables: {
      filter: filter,
      orderBy,
      orderDirection,
    },
    skip: !address || activeFilter === 'won',
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.bets) {
        setBets(data.data.bets);
      }
    },
  });

  // Initial Query for won bets
  const {
    data: initialPayoutClaimeds,
    loading: payoutsLoading,
    error: payoutsError,
  } = useQuery(GET_PAYOUT_CLAIMED, {
    variables: {
      where: filter,
      orderBy,
      orderDirection,
    },
    context: { name: 'payoutClaimeds' },
    skip: !address || activeFilter !== 'won',
    fetchPolicy: 'network-only',
  });

  // Subscription for won bets
  useSubscription(GET_PAYOUT_CLAIMED_SUBSCRIPTION, {
    variables: {
      where: filter,
      orderBy,
      orderDirection,
    },
    skip: !address || activeFilter !== 'won',
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.payoutClaimeds) {
        setPayoutClaimeds(data.data.payoutClaimeds);
      }
    },
  });

  // Initial Query for withdrawals
  const {
    data: initialBetWithdrawals,
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
    skip: !address,
    fetchPolicy: 'network-only',
  });

  // Subscription for withdrawals
  useSubscription(GET_BET_WITHDRAWALS_SUBSCRIPTION, {
    variables: {
      where: { user: address?.toLowerCase() },
      orderBy: BetWithdrawal_OrderBy.BlockTimestamp,
      orderDirection: OrderDirection.Desc,
      first: 100,
    },
    skip: !address,
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.betWithdrawals) {
        setBetWithdrawals(data.data.betWithdrawals);
      }
    },
  });

  // Initialize state with query data
  useEffect(() => {
    if (initialBets?.bets) setBets(initialBets.bets);
  }, [initialBets?.bets]);

  useEffect(() => {
    if (initialPayoutClaimeds?.payoutClaimeds)
      setPayoutClaimeds(initialPayoutClaimeds.payoutClaimeds);
  }, [initialPayoutClaimeds?.payoutClaimeds]);

  useEffect(() => {
    if (initialBetWithdrawals?.betWithdrawals)
      setBetWithdrawals(initialBetWithdrawals.betWithdrawals);
  }, [initialBetWithdrawals?.betWithdrawals]);

  return {
    betsData: {
      bets: bets,
      payoutClaimeds: payoutClaimeds,
      betWithdrawals: betWithdrawals,
    },
    isLoading: betsLoading || payoutsLoading || withdrawalsLoading,
    isError: !!(betsError || payoutsError || withdrawalsError),
    error: betsError || payoutsError || withdrawalsError,
  };
}
