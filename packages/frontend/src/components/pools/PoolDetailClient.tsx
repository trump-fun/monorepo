'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Pool, PoolStatus } from '@trump-fun/common';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { GET_BETS, GET_POOL } from '@/app/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { calculateOptionPercentages, getVolumeForTokenType } from '@/utils/betsInfo';
import { showSuccessToast } from '@/utils/toast';
import { USDC_DECIMALS } from '@trump-fun/common';

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
import { Comment } from '@/types/pool';
import { useApolloClient } from '@apollo/client';

type PoolDetailClientProps = {
  id: string;
  initialPool: Pool | null;
  initialPostData: any | null;
  initialComments: Comment[] | null;
};

export function PoolDetailClient({
  id,
  initialPool,
  initialPostData,
  initialComments,
}: PoolDetailClientProps) {
  const { tokenType, tokenAddress } = useTokenContext();
  const { isConnected, authenticated } = useWalletAddress();
  const { login } = usePrivy();
  const publicClient = usePublicClient();
  const account = useAccount();
  const { ready } = usePrivy();
  const [selectedTab, setSelectedTab] = useState<string>('comments');
  const apolloClient = useApolloClient();

  const [pool, setPool] = useState<Pool | null>(initialPool);
  const [placedBetsData, setPlacedBetsData] = useState<any>(null);

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { balance, formattedBalance, symbol, tokenLogo } = useTokenBalance();
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

  const fetchPoolData = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_POOL,
        variables: { poolId: id },
        fetchPolicy: 'network-only',
      });
      if (data?.pool) {
        setPool(data.pool);
      }
    } catch (error) {
      console.error('Error fetching pool data:', error);
    }
  }, [apolloClient, id]);

  const fetchUserBets = useCallback(async () => {
    if (!account.address) return;

    try {
      const { data } = await apolloClient.query({
        query: GET_BETS,
        variables: {
          filter: {
            user: account.address.toLowerCase(),
            poolId: id,
          },
        },
        fetchPolicy: 'network-only',
      });
      if (data) {
        setPlacedBetsData(data);
      }
    } catch (error) {
      console.error('Error fetching user bets:', error);
    }
  }, [apolloClient, account.address, id]);

  useEffect(() => {
    fetchPoolData();
    fetchUserBets();

    const refreshInterval = setInterval(() => {
      fetchPoolData();
      fetchUserBets();
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, [fetchPoolData, fetchUserBets]);

  const { data: postData } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await fetch(`/api/post?poolId=${id}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    initialData: initialPostData,
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

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

  const comments = commentsData?.comments || [];

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
        const optionValue = Number(optionParam);
        setSelectedOption(optionValue);
      }

      if (amountParam || optionParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [balance, setBetAmount, setSelectedOption, setSliderValue]);

  useEffect(() => {
    if (isConfirmed) {
      showSuccessToast('Transaction confirmed!');
      fetchPoolData();
      fetchUserBets();
      refetchComments();
    }
  }, [fetchPoolData, fetchUserBets, isConfirmed, refetchComments]);

  const handleFacts = () => {
    handleFactsAction(isConnected, login);
  };

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

  const handleBet = async () => {
    await placeBet({
      poolId: pool?.id,
      betAmount,
      selectedOption,
      options: pool?.options,
    });
  };

  const refreshData = () => {
    fetchPoolData();
    fetchUserBets();
    refetchComments();
  };

  if (!pool) {
    return (
      <div className='container mx-auto flex h-screen max-w-4xl flex-col items-center justify-center px-4 py-8'>
        <Image
          src='/loader.gif'
          alt='Loading'
          width={100}
          height={100}
          className='z-50 size-40 animate-spin rounded-full'
        />
      </div>
    );
  }

  const isActive = pool.status === PoolStatus.Pending || pool.status === PoolStatus.None;
  const totalVolume = getVolumeForTokenType(pool, tokenType);
  const percentages = calculateOptionPercentages(pool);
  const placedBets = placedBetsData || { bets: [] };

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <Link href='/explore' className='text-muted-foreground mb-6 flex items-center'>
        <ArrowLeft className='mr-2' size={16} />
        Back to Predictions
      </Link>

      <Card className='mb-6'>
        <PoolHeader pool={pool} postData={postData} />

        <CardContent>
          {postData && postData.post && (
            <Image
              src={postData.post.image_url}
              alt='Post Image'
              width={500}
              height={300}
              className='mb-4 w-full rounded-lg'
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

          <UserBets
            placedBets={placedBets}
            pool={pool}
            USDC_DECIMALS={USDC_DECIMALS}
            tokenLogo={tokenLogo}
            symbol={symbol}
          />

          <TabSwitcher
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            pool={pool}
            comments={comments}
            isCommentsLoading={isCommentsLoading}
            commentsError={commentsError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
