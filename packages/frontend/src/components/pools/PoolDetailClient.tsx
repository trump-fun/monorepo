'use client';

import { useDynamicSolana } from '@/hooks/useDynamicSolana';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { calculateOptionPercentages, getVolumeForTokenType } from '@/utils/betsInfo';
import { showSuccessToast } from '@/utils/toast';
import { POLLING_INTERVALS, Tables, USDC_DECIMALS } from '@trump-fun/common';

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
  PoolsQueryResultTypeSingle,
  PoolStatus,
  useGetBetPlacedQuery,
  useGetBetsQuery,
  useGetPoolQuery,
} from '@/types';
import { Transaction } from '@solana/web3.js';

type PoolDetailClientProps = {
  id: string;
  initialComments: Tables<'comments'>[] | null;
};

export function PoolDetailClient({ id, initialComments }: PoolDetailClientProps) {
  const { tokenType } = useTokenContext();
  const { isConnected, publicKey, authenticated } = useWalletAddress();
  const { signAndSendTransaction } = useDynamicSolana();

  const [selectedTab, setSelectedTab] = useState<string>('comments');
  const [userBetsData, setUserBetsData] = useState<Bet[]>([]);
  const [betPlacedData, setBetPlacedData] = useState<BetPlaced[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_error, _setError] = useState<string | null>(null);

  const {
    formattedBalance,
    symbol,
    tokenLogo: rawTokenLogo,
    rawBalance,
    tokenAddress,
  } = useTokenBalance();

  // Provide a default value for tokenLogo to avoid undefined errors
  const tokenLogo = rawTokenLogo || '🪙'; // Default emoji as fallback

  // Create a balance object that matches what BettingForm expects
  const balance = {
    value: rawBalance?.toString() || '0',
    formatted: formattedBalance,
    decimals: 6, // USDC typically has 6 decimals
  };

  // Use Apollo's useQuery hook to fetch pool data
  const {
    data: poolData,
    loading,
    error: poolError,
    refetch,
  } = useGetPoolQuery({
    variables: { poolId: id },
    fetchPolicy: 'network-only',
  });

  const pool = poolData?.pool as PoolsQueryResultTypeSingle;

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
  } = useBettingForm({
    value: formattedBalance,
    decimals: USDC_DECIMALS,
    formatted: formattedBalance,
    symbol,
  });

  const {
    poolFacts,
    hasFactsed,
    isFactsProcessing,
    handleFacts: handleFactsAction,
  } = usePoolFacts(id, authenticated);

  // Use generated query hooks instead of manual Apollo queries
  const { refetch: refetchUserBets } = useGetBetsQuery({
    variables: {
      filter: {
        userAddress: publicKey ? publicKey.toBase58().toLowerCase() : '',
        tokenType,
        poolIntId: id, // Changed poolId to poolIntId which is the correct field name
      },
      orderDirection: OrderDirection.Desc,
      orderBy: Bet_OrderBy.CreatedAt,
      first: 100,
    },
    skip: !publicKey,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data && data.bets) {
        // Cast the data to match Bet[] type
        setUserBetsData(data.bets as Bet[]);
      }
    },
  });

  const { refetch: refetchBetPlaced } = useGetBetPlacedQuery({
    variables: {
      filter: {
        poolId: id, // Using poolId which is the correct field name in BetPlaced_Filter
      },
      orderDirection: OrderDirection.Desc,
      orderBy: BetPlaced_OrderBy.CreatedAt,
      first: 100,
    },
    onCompleted: (data) => {
      if (data && data.betPlaceds) {
        // Cast the data to the correct BetPlaced[] type
        setBetPlacedData(data.betPlaceds as BetPlaced[]);
      }
    },
  });

  const refreshData = useCallback(() => {
    refetch();
    refetchUserBets();
    refetchBetPlaced();
  }, [refetch, refetchUserBets, refetchBetPlaced]);

  useEffect(() => {
    // Initial load of bets data
    refetchUserBets();
    refetchBetPlaced();

    // Set up polling intervals for automatic updates
    const userBetsPollingInterval = setInterval(() => {
      refetchUserBets();
    }, POLLING_INTERVALS['user-bets']);

    const betPlacedPollingInterval = setInterval(() => {
      refetchBetPlaced();
    }, POLLING_INTERVALS['user-bets']);

    return () => {
      clearInterval(userBetsPollingInterval);
      clearInterval(betPlacedPollingInterval);
    };
  }, [refetchUserBets, refetchBetPlaced]);

  useEffect(() => {
    if (isSubmitting) {
      showSuccessToast('Transaction confirmed!');
      refreshData();
    }
  }, [isSubmitting, refreshData]);

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const res = await fetch(`/api/comments?poolId=${id}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    initialData: initialComments,
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const comments = useMemo(
    () => commentsData?.comments || initialComments || [],
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

        if (formattedBalance) {
          const maxAmount = Number(formattedBalance) / Math.pow(10, USDC_DECIMALS);
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
  }, [formattedBalance, setBetAmount, setSelectedOption, setSliderValue]);

  const handleFacts = useCallback(() => {
    handleFactsAction(isConnected, handleLogin);
  }, [handleFactsAction, isConnected]);

  // Create a transaction sender that uses Dynamic's signAndSendTransaction
  const solanaTransactionSender = useCallback(
    async (transaction: Transaction) => {
      if (!signAndSendTransaction) {
        throw new Error('Transaction sender not available');
      }

      // Use Dynamic's signAndSendTransaction to send the Solana transaction
      const signature = await signAndSendTransaction(transaction);

      // Return signature as string
      return signature;
    },
    [signAndSendTransaction]
  );

  const placeBet = usePlaceBet({
    sendTransaction: solanaTransactionSender,
    resetBettingForm,
  });

  const handleBet = useCallback(async () => {
    if (!pool?.id || !pool?.options) return;

    setIsSubmitting(true);
    try {
      await placeBet({
        poolId: pool.id,
        betAmount,
        selectedOption,
        options: pool.options,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [placeBet, pool, betAmount, selectedOption, setIsSubmitting]);

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
                authenticated={isAuthenticated}
                isPending={isSubmitting}
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
            isCommentsLoading={isCommentsLoading}
            commentsError={commentsError}
            onCommentsUpdated={refetchComments} // Pass this function to refresh comments
          />
        </CardContent>
      </Card>
    </div>
  );
}
