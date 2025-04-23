'use client';

import { useApolloClient, useQuery as useApolloQuery } from '@apollo/client';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { calculateOptionPercentages, getVolumeForTokenType } from '@/utils/betsInfo';
import { showSuccessToast } from '@/utils/toast';
import { gql as apolloGql } from '@apollo/client';
import { POLLING_INTERVALS } from '@trump-fun/common';
import {
  GET_BET_PLACED_STRING,
  GET_BETS_STRING,
  GET_POOL,
} from '@trump-fun/common/src/graphql/queries';

import { useBettingForm } from '@/hooks/useBettingForm';
import { usePlaceBet } from '@/hooks/usePlaceBet';
import { usePoolFacts } from '@/hooks/usePoolFacts';

import { BettingForm } from '@/components/pools/BettingForm';
import { BettingProgress } from '@/components/pools/BettingProgress';
import { FactsButton } from '@/components/pools/FactsButton';
import { PoolHeader } from '@/components/pools/PoolHeader';
import { PoolStats } from '@/components/pools/PoolStats';
import { TabSwitcher } from '@/components/pools/TabSwitcher';
import { UserBets } from '@/components/pools/UserBets';
import {
  Bet,
  Bet_OrderBy,
  BetPlaced,
  BetPlaced_OrderBy,
  OrderDirection,
  PoolStatus,
} from '@trump-fun/common';

import { CommentWithReplies } from '@/types/comments';

type PoolDetailClientProps = {
  id: string;
  initialComments: {
    comments: CommentWithReplies[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    };
  } | null;
};

export function PoolDetailClient({ id, initialComments }: PoolDetailClientProps) {
  const { tokenType, tokenAddress } = useTokenContext();
  const { isConnected, authenticated } = useWalletAddress();
  const { login, ready } = usePrivy();
  const account = useAccount();
  const publicClient = usePublicClient();
  const apolloClient = useApolloClient();

  const [selectedTab, setSelectedTab] = useState<string>('comments');
  const [userBetsData, setUserBetsData] = useState<Bet[]>([]);
  const [betPlacedData, setBetPlacedData] = useState<BetPlaced[]>([]);

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { balance, formattedBalance, symbol, tokenLogo } = useTokenBalance();

  // Use Apollo's useQuery hook to fetch pool data
  const {
    data: poolData,
    loading,
    error: poolError,
    refetch,
  } = useApolloQuery(GET_POOL, {
    variables: { poolId: id },
    fetchPolicy: 'network-only',
  });

  const pool = poolData?.pool || null;

  const {
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    sliderValue,
    setSliderValue,
    userEnteredValue,
    setUserEnteredValue,
    handlePercentageClick,
    reset: resetBettingForm,
  } = useBettingForm(balance);

  const {
    poolFacts,
    hasFactsed,
    isFactsProcessing,
    handleFacts: handleFactsAction,
  } = usePoolFacts(id, authenticated);

  const fetchUserBets = useCallback(async () => {
    if (!account.address) return;

    try {
      const { data } = await apolloClient.query({
        query: apolloGql(GET_BETS_STRING),
        variables: {
          filter: {
            user: account.address.toLowerCase(),
            tokenType,
            poolId: id,
          },
          orderDirection: OrderDirection.Desc,
          orderBy: Bet_OrderBy.CreatedAt,
        },
        fetchPolicy: 'network-only',
      });
      if (data) {
        setUserBetsData(data.bets);
      }
    } catch (error) {
      console.error('Error fetching user bets:', error);
    }
  }, [account.address, apolloClient, tokenType, id]);

  const fetchBetPlaced = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: apolloGql(GET_BET_PLACED_STRING),
        variables: {
          filter: {
            poolId: id,
          },
          orderDirection: OrderDirection.Desc,
          orderBy: BetPlaced_OrderBy.BlockTimestamp,
        },
      });
      if (data) {
        setBetPlacedData(data.betPlaceds);
      }
    } catch (error) {
      console.error('Error fetching bet placed:', error);
    }
  }, [apolloClient, id]);

  const refreshData = useCallback(() => {
    refetch();
    fetchUserBets();
    fetchBetPlaced();
  }, [refetch, fetchUserBets, fetchBetPlaced]);

  useEffect(() => {
    fetchUserBets();
    fetchBetPlaced();

    const userBetsPollingInterval = setInterval(fetchUserBets, POLLING_INTERVALS['user-bets']);
    const betPlacedPollingInterval = setInterval(fetchBetPlaced, POLLING_INTERVALS['user-bets']);

    return () => {
      clearInterval(userBetsPollingInterval);
      clearInterval(betPlacedPollingInterval);
    };
  }, [fetchUserBets, fetchBetPlaced]);

  useEffect(() => {
    if (isConfirmed) {
      showSuccessToast('Transaction confirmed!');
      refreshData();
    }
  }, [isConfirmed, refreshData]);

  type CommentsResponse = {
    comments: CommentWithReplies[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    };
  };

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery<CommentsResponse, Error>({
    queryKey: ['comments', id],
    queryFn: async (): Promise<CommentsResponse> => {
      const page = commentsData?.pagination?.page || 1;
      const pageSize = commentsData?.pagination?.pageSize || 10;
      const res = await fetch(
        `/api/comments?poolId=${id}&includeReplies=true&page=${page}&pageSize=${pageSize}`
      );
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Network response was not ok: ${errorText}`);
      }
      const data = await res.json();
      return {
        comments: data.comments,
        pagination: data.pagination,
      };
    },
    initialData: initialComments ? initialComments : undefined,
    staleTime: 30000, // Reduced stale time to ensure fresher data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Poll every minute for new comments
  });

  const comments = useMemo(
    () => commentsData?.comments || initialComments?.comments || [],
    [commentsData, initialComments]
  );

  const commentsPagination = useMemo(
    () => commentsData?.pagination || initialComments?.pagination,
    [commentsData, initialComments]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const amountParam = urlParams.get('amount');
      const optionParam = urlParams.get('option');

      if (amountParam && !isNaN(Number(amountParam))) {
        const amount = Number(amountParam);
        setBetAmount(amount.toString());

        if (balance) {
          const maxAmount = Number(balance.value) / Math.pow(10, balance.decimals);
          const percentage = Math.min(100, (amount / maxAmount) * 100);
          setSliderValue([percentage]);
        }
      }

      if (optionParam && !isNaN(Number(optionParam))) {
        setSelectedOption(Number(optionParam));
      }

      if (amountParam || optionParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [balance, setBetAmount, setSelectedOption, setSliderValue]);

  const handleFacts = useCallback(() => {
    handleFactsAction(isConnected, login);
  }, [handleFactsAction, isConnected, login]);

  const placeBet = usePlaceBet({
    writeContract,
    ready,
    publicClient,
    accountAddress: account.address,
    tokenAddress,
    tokenType,
    isConfirmed,
    resetBettingForm,
    symbol,
  });

  const handleBet = useCallback(async () => {
    if (!pool?.id || !pool?.options) return;

    await placeBet({
      poolId: pool.id,
      betAmount,
      selectedOption,
      options: pool.options,
    });
  }, [placeBet, pool, betAmount, selectedOption]);

  if (loading) {
    return (
      <div className='container mx-auto flex h-screen max-w-4xl flex-col items-center justify-center px-4 py-8'>
        <Image
          src='/loader.gif'
          alt='Loading'
          width={100}
          height={100}
          className='z-50 size-40 h-auto w-auto animate-spin rounded-full'
          unoptimized
        />
      </div>
    );
  }

  if (poolError) {
    return (
      <div className='container mx-auto flex h-screen max-w-4xl flex-col items-center justify-center px-4 py-8'>
        <div className='text-red-500'>Error: {poolError.message}</div>
        <Button onClick={refreshData} className='mt-4'>
          Try Again
        </Button>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className='container mx-auto flex h-screen max-w-4xl flex-col items-center justify-center px-4 py-8'>
        <div className='text-red-500'>Pool not found</div>
        <Button onClick={refreshData} className='mt-4'>
          Try Again
        </Button>
      </div>
    );
  }

  const isActive = pool.status === PoolStatus.Pending || pool.status === PoolStatus.None;
  const totalVolume = getVolumeForTokenType(pool, tokenType);
  const percentages = calculateOptionPercentages(pool, tokenType);

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <Link href='/explore' className='text-muted-foreground mb-6 flex items-center'>
        <ArrowLeft className='mr-2' size={16} />
        Back to Predictions
      </Link>

      <Card className='mb-6'>
        <PoolHeader pool={pool} />

        <CardContent>
          {pool.imageUrl && (
            <Image
              src={pool.imageUrl}
              alt='Post Image'
              width={500}
              height={300}
              className='mb-4 h-auto w-full rounded-lg'
            />
          )}

          <div className='mb-4 flex justify-end'>
            <Button variant='outline' size='sm' onClick={refreshData} className='text-xs'>
              Refresh Data
            </Button>
          </div>

          <BettingProgress percentages={percentages} pool={pool} totalVolume={totalVolume} />
          <PoolStats pool={pool} totalVolume={totalVolume} />

          {isActive && (
            <div className='flex flex-col space-y-4'>
              <BettingForm
                pool={pool}
                handlePercentageClick={handlePercentageClick}
                sliderValue={sliderValue}
                setSliderValue={setSliderValue}
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                handleBet={handleBet}
                authenticated={authenticated}
                isPending={isPending}
                symbol={symbol}
                tokenLogo={tokenLogo}
                balance={balance}
                formattedBalance={formattedBalance}
                setUserEnteredValue={setUserEnteredValue}
                userEnteredValue={userEnteredValue}
              />

              <div className='flex justify-end'>
                <FactsButton
                  handleFacts={handleFacts}
                  hasFactsed={hasFactsed}
                  isFactsProcessing={isFactsProcessing}
                  poolFacts={poolFacts}
                />
              </div>
            </div>
          )}

          <UserBets placedBets={userBetsData} pool={pool} tokenLogo={tokenLogo} symbol={symbol} />

          <TabSwitcher
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            pool={pool}
            bets={betPlacedData}
            comments={comments}
            commentsPagination={commentsPagination}
            isCommentsLoading={isCommentsLoading}
            commentsError={commentsError}
            onCommentsUpdated={refetchComments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
