'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Pool, PoolStatus } from '@trump-fun/common';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { calculateOptionPercentages, getVolumeForTokenType } from '@/utils/betsInfo';
import { showSuccessToast } from '@/utils/toast';
import { USDC_DECIMALS, bettingContractAbi } from '@trump-fun/common';

// Import custom hooks
import { useBettingForm } from '@/hooks/useBettingForm';
import { useNetwork } from '@/hooks/useNetwork';
import { usePlaceBet } from '@/hooks/usePlaceBet';
import { usePoolFacts } from '@/hooks/usePoolFacts';

// Import components
import { BettingForm } from '@/components/pools/BettingForm';
import { BettingProgress } from '@/components/pools/BettingProgress';
import { FactsButton } from '@/components/pools/FactsButton';
import { PoolHeader } from '@/components/pools/PoolHeader';
import { PoolStats } from '@/components/pools/PoolStats';
import { TabSwitcher } from '@/components/pools/TabSwitcher';
import { UserBets } from '@/components/pools/UserBets';
import { useApprovalAmount } from '@/hooks/useApprovalAmount';
import { Comment } from '@/types/pool';

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
  // Router and authentication
  const { tokenType, tokenAddress } = useTokenContext();
  const { isConnected, authenticated } = useWalletAddress();
  const { login } = usePrivy();
  const publicClient = usePublicClient();
  const account = useAccount();
  const { ready } = usePrivy();
  const [selectedTab, setSelectedTab] = useState<string>('comments');
  const { appAddress } = useNetwork();

  // State management
  const [pool, setPool] = useState<Pool | null>(initialPool);
  const [placedBetsData, setPlacedBetsData] = useState<any>(null);

  // Contract interaction
  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Custom hooks
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
  } = usePoolFacts(id as string, authenticated);

  const approvedAmount = useApprovalAmount(tokenAddress, hash);

  // Post data fetching with initialData
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

  // Comments data fetching with initialData
  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    error: commentsError,
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

  // Safely extract comments from the response
  const comments = commentsData?.comments || [];

  // Check URL parameters for bet information
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const amountParam = urlParams.get('amount');
      const optionParam = urlParams.get('option');

      if (amountParam && !isNaN(Number(amountParam))) {
        const amount = Number(amountParam);
        setBetAmount(amount.toString());

        // Set slider value based on balance
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

      // Clear the URL parameters
      if (amountParam || optionParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [balance, setBetAmount, setSelectedOption, setSliderValue]);

  // Show success toasts
  useEffect(() => {
    if (isConfirmed) {
      showSuccessToast('Transaction confirmed!');
    }
  }, [isConfirmed]);

  // Watch BetPlaced events for the current pool
  useEffect(() => {
    if (!publicClient || !appAddress || !pool) return;

    const unwatch = publicClient.watchContractEvent({
      address: appAddress,
      abi: bettingContractAbi,
      eventName: 'BetPlaced',
      args: {
        poolId: BigInt(id),
      },
      onLogs: logs => {
        logs.forEach(log => {
          const { args } = log;

          if (!args || !pool) return;

          const { betId, poolId, user, optionIndex, amount, tokenType: betTokenType } = args;

          // Update pool volumes in the local state
          setPool(currentPool => {
            if (!currentPool) return currentPool;

            // Deep clone the current pool to avoid mutation
            const updatedPool = JSON.parse(JSON.stringify(currentPool));

            // Update the appropriate bet total based on token type
            if (betTokenType === 0) {
              // USDC
              if (!updatedPool.usdcVolume) {
                updatedPool.usdcVolume = ['0', '0'];
              }
              // Ensure optionIndex is a valid number that can be used as an array index
              const index = Number(optionIndex) < 2 ? Number(optionIndex) : 0;
              const currentAmount = updatedPool.usdcVolume[index] || '0';
              updatedPool.usdcVolume[index] = (
                BigInt(currentAmount) + BigInt(amount || 0)
              ).toString();
            } else {
              // POINTS
              if (!updatedPool.pointsVolume) {
                updatedPool.pointsVolume = ['0', '0'];
              }
              // Ensure optionIndex is a valid number that can be used as an array index
              const index = Number(optionIndex) < 2 ? Number(optionIndex) : 0;
              const currentAmount = updatedPool.pointsVolume[index] || '0';
              updatedPool.pointsVolume[index] = (
                BigInt(currentAmount) + BigInt(amount || 0)
              ).toString();
            }

            return updatedPool;
          });

          // If the bet was placed by the current user, check if we need to update the user's bets
          if (user?.toLowerCase() === account.address?.toLowerCase()) {
            // This will refresh user's bets through the subscription
            // But we could optionally update it directly here as well

            // Make sure all required fields are present
            if (!betId || !poolId || !amount) return;

            // Create a new bet object based on the event data
            const newBet = {
              id: betId.toString(),
              user: {
                id: user,
              },
              pool: {
                id: poolId.toString(),
              },
              option: Number(optionIndex),
              amount: amount.toString(),
              createdAt: Math.floor(Date.now() / 1000).toString(),
              tokenType: Number(betTokenType),
            };

            // Update the placedBetsData state to include the new bet
            setPlacedBetsData(
              (currentData: { bets: Array<{ id: string; [key: string]: any }> } | null) => {
                if (!currentData) {
                  return { bets: [newBet] };
                }

                // Check if this bet already exists in the data (by ID)
                const existingBetIndex = currentData.bets.findIndex(
                  (bet: { id: string }) => bet.id === betId.toString()
                );

                if (existingBetIndex >= 0) {
                  // Update existing bet
                  const updatedBets = [...currentData.bets];
                  updatedBets[existingBetIndex] = newBet;
                  return { ...currentData, bets: updatedBets };
                } else {
                  // Add new bet to the beginning of the array (newest first)
                  return {
                    ...currentData,
                    bets: [newBet, ...currentData.bets],
                  };
                }
              }
            );
          }
        });
      },
    });

    // Clean up the subscription when component unmounts
    return () => {
      unwatch();
    };
  }, [publicClient, appAddress, id, account.address, pool]);

  // Handle FACTS button click
  const handleFacts = () => {
    handleFactsAction(isConnected, login);
  };

  // Use the placeBet hook
  const placeBet = usePlaceBet({
    writeContract,
    ready,
    publicClient,
    accountAddress: account.address,
    tokenAddress,
    tokenType,
    approvedAmount,
    isConfirmed,
    resetBettingForm,
    symbol,
  });

  // Update the handleBet function to use the hook
  const handleBet = async () => {
    await placeBet({
      poolId: pool?.id,
      betAmount,
      selectedOption,
      options: pool?.options,
    });
  };

  // Loading state
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

  // Error state
  if (!pool) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-8'>
        <Link href='/explore' className='text-muted-foreground mb-6 flex items-center'>
          <ArrowLeft className='mr-2' size={16} />
          Back to Predictions
        </Link>
        <Card>
          <CardContent className='pt-6'>
            <div className='py-12 text-center'>
              <h2 className='mb-2 text-2xl font-bold'>Pool Not Found</h2>
              <p className='text-muted-foreground'>
                The prediction you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Button className='mt-6' asChild>
                <Link href='/explore'>View All Predictions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = pool.status === PoolStatus.Pending || pool.status === PoolStatus.None;
  const totalVolume = getVolumeForTokenType(pool, tokenType);

  // Calculate percentages
  const percentages = calculateOptionPercentages(pool);

  // Use the data from subscriptions or initial values
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

          {/* Progress Bar */}
          <BettingProgress percentages={percentages} pool={pool} totalVolume={totalVolume} />

          {/* Stats */}
          <PoolStats pool={pool} totalVolume={totalVolume} />

          {/* Betting form and FACTS button */}
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
                approvedAmount={approvedAmount}
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

          {/* User's bets */}
          <UserBets
            placedBets={placedBets}
            pool={pool}
            USDC_DECIMALS={USDC_DECIMALS}
            tokenLogo={tokenLogo}
            symbol={symbol}
          />

          {/* Tabs */}
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
