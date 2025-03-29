'use client';

import { EndingSoon } from '@/components/ending-soon';
import { HighestVolume } from '@/components/highest-volume';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserBettingPost } from '@/components/user-betting-post';
import { useNetwork } from '@/hooks/useNetwork';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { getVolumeForTokenType } from '@/utils/betsInfo';
import { useQuery } from '@apollo/client';
import {
  Bet,
  Bet_Filter,
  Bet_OrderBy,
  bettingContractAbi,
  BetWithdrawal,
  BetWithdrawal_OrderBy,
  OrderDirection,
  PayoutClaimed,
  PayoutClaimed_OrderBy,
  POINTS_DECIMALS,
  POLLING_INTERVALS,
  TokenType,
  USDC_DECIMALS,
} from '@trump-fun/common';
import { ArrowUpFromLine, History, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RandomAvatar } from 'react-random-avatars';
import { usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { GET_BET_WITHDRAWALS, GET_BETS, GET_PAYOUT_CLAIMED } from '../queries';

export default function ProfilePage() {
  const { appAddress } = useNetwork();
  const [activeFilter, setActiveFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const { tokenType } = useTokenContext();
  const { address } = useWalletAddress();
  const { formattedBalance, tokenLogo } = useTokenBalance();
  const { networkInfo } = useNetwork();

  const tokenTypeC = tokenType === TokenType.Usdc ? 0 : 1;
  const { isPending, writeContract } = useWriteContract();
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  const { data: balance } = useReadContract({
    address: appAddress,
    abi: bettingContractAbi,
    functionName: 'userBalances',
    args: [address, tokenTypeC],
  });
  const publicClient = usePublicClient();

  const filterConfigs = useMemo(
    () => ({
      active: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address,
          pool_: {
            status: 'PENDING',
          },
        },
      },
      won: {
        orderBy: PayoutClaimed_OrderBy.BlockTimestamp,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address?.toLowerCase(),
          bet_: {
            user: address,
          },
        },
      },
      lost: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address,
          pool_: {
            status: 'GRADED',
          },
          isWithdrawn: false,
        },
      },
      all: {
        orderBy: Bet_OrderBy.UpdatedAt,
        orderDirection: OrderDirection.Desc,
        filter: {
          user: address,
        },
      },
    }),
    [address]
  );

  const { orderBy, orderDirection, filter } = useMemo(
    () => filterConfigs[activeFilter as keyof typeof filterConfigs],
    [activeFilter, filterConfigs]
  );

  const { data: userBets } = useQuery<{ bets: Bet[] }>(GET_BETS, {
    variables: {
      filter: filter as Bet_Filter,
      orderBy,
      orderDirection,
    },
    context: { name: 'userBets' },
    notifyOnNetworkStatusChange: true,
    skip: !address || activeFilter === 'won',
    pollInterval: POLLING_INTERVALS['user-profile'],
  });

  const { data: payoutClaimeds } = useQuery<{ payoutClaimeds: PayoutClaimed[] }>(
    GET_PAYOUT_CLAIMED,
    {
      variables: {
        where: filter,
        orderBy,
        orderDirection,
      },
      context: { name: 'payoutClaimeds' },
      notifyOnNetworkStatusChange: true,
      skip: !address || activeFilter !== 'won',
      pollInterval: POLLING_INTERVALS['user-profile'],
    }
  );

  const { data: betWithdrawals } = useQuery<{ betWithdrawals: BetWithdrawal[] }>(
    GET_BET_WITHDRAWALS,
    {
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
    }
  );

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredPools = useMemo(() => {
    if (activeFilter === 'won' && payoutClaimeds?.payoutClaimeds) {
      if (!searchQuery.trim()) return payoutClaimeds.payoutClaimeds;
      const query = searchQuery.toLowerCase().trim();
      return payoutClaimeds.payoutClaimeds.filter(
        payout =>
          payout.bet?.pool?.question.toLowerCase().includes(query) ||
          payout.pool?.question.toLowerCase().includes(query)
      );
    }

    if (!userBets?.bets) return [];
    if (!searchQuery.trim()) return userBets.bets;

    const query = searchQuery.toLowerCase().trim();
    return userBets.bets.filter(bet => bet.pool.question.toLowerCase().includes(query));
  }, [userBets?.bets, payoutClaimeds?.payoutClaimeds, searchQuery, activeFilter]);

  const renderFilterButton = (value: string, label: string, icon: React.ReactNode) => (
    <Button
      variant={activeFilter === value ? 'default' : 'ghost'}
      className='w-full justify-start gap-2 font-medium'
      onClick={() => handleFilterChange(value)}
    >
      {icon}
      {label}
    </Button>
  );

  // Memoize the sidebar components to prevent re-rendering when filter changes
  const memoizedHighestVolume = useMemo(() => <HighestVolume />, []);
  const memoizedEndingSoon = useMemo(() => <EndingSoon />, []);

  const formattedWithdrawableBalance = useMemo((): number => {
    if (!balance) return 0;
    return tokenType === TokenType.Usdc
      ? Number(balance) / 1000000
      : Number(balance) / 1000000000000000000;
  }, [balance, tokenType]);

  const handleWithdraw = async () => {
    if (!address || !publicClient) return;

    if (withdrawAmount <= formattedWithdrawableBalance && withdrawAmount > 0) {
      try {
        // Convert the withdrawal amount to the correct format based on token type
        const tokenAmount = BigInt(
          Math.floor(
            withdrawAmount * (tokenType === TokenType.Usdc ? 1000000 : 1000000000000000000)
          )
        );

        const { request } = await publicClient.simulateContract({
          abi: bettingContractAbi,
          address: appAddress,
          functionName: 'withdraw',
          account: address as `0x${string}`,
          args: [tokenTypeC, tokenAmount],
        });

        writeContract(request);
      } catch (error) {
        console.error('Error withdrawing tokens:', error);
      }
    } else {
      console.error('Invalid withdrawal amount or insufficient balance');
    }
  };

  // Calculate user statistics
  const userStats = useMemo(() => {
    const allBets = userBets?.bets || [];
    const totalBets = allBets.length;
    const wonBets = payoutClaimeds?.payoutClaimeds?.length || 0;
    const lostBets = allBets.filter(bet => bet.pool.status === 'GRADED' && !bet.isWithdrawn).length;
    const pendingBets = allBets.filter(bet => bet.pool.status === 'PENDING').length;

    // Improved volume calculation that includes all bets regardless of status
    let totalVolume = 0;
    allBets.forEach(bet => {
      try {
        const betAmount = parseFloat(bet.amount);
        if (!isNaN(betAmount)) {
          const decimals = Number(bet.tokenType) === 0 ? USDC_DECIMALS : POINTS_DECIMALS;
          totalVolume += betAmount / decimals;
        }
      } catch (error) {
        console.error('Error calculating bet volume:', error);
      }
    });

    // Calculate active volume as well (bets that are still pending)
    let activeVolume = 0;
    allBets
      .filter(bet => bet.pool.status === 'PENDING')
      .forEach(bet => {
        try {
          const betAmount = parseFloat(bet.amount);
          if (!isNaN(betAmount)) {
            const decimals = Number(bet.tokenType) === 0 ? USDC_DECIMALS : POINTS_DECIMALS;
            activeVolume += betAmount / decimals;
          }
        } catch (error) {
          console.error('Error calculating active bet volume:', error);
        }
      });

    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
    const avgBetSize = totalBets > 0 ? totalVolume / totalBets : 0;

    return {
      totalBets,
      wonBets,
      lostBets,
      pendingBets,
      totalVolume,
      activeVolume,
      winRate: winRate.toFixed(1),
      avgBetSize: avgBetSize.toFixed(0),
    };
  }, [userBets?.bets, payoutClaimeds?.payoutClaimeds]);

  return (
    <div className='flex h-[calc(100vh-4rem)] flex-col'>
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <div className='hidden w-60 flex-col border-r border-gray-200 p-4 md:flex dark:border-gray-800'>
          <div className='mb-6 flex flex-col items-center gap-3'>
            <Avatar className='h-20 w-20 overflow-hidden rounded-full'>
              <RandomAvatar size={48} name={address} />
            </Avatar>
            <div className='text-center'>
              <div className='text-xl font-bold'>
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
              </div>
            </div>
            <div className='dark:bg-background bor flex w-full items-center justify-between rounded-lg bg-gray-100 p-3'>
              <div className='text-center'>
                <div className='text-sm text-gray-500 dark:text-gray-400'>Balance</div>
                <div className='flex items-center gap-1 font-bold'>
                  {tokenLogo}
                  {formattedBalance}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-sm text-gray-500 dark:text-gray-400'>Network</div>
                <div className='font-semibold'>{networkInfo.name}</div>
              </div>
            </div>

            {/* Add betting statistics */}
            <div className='w-full space-y-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
              <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                Betting Stats
              </div>
              <div className='grid grid-cols-2 gap-4 text-xs'>
                <div className='flex flex-col gap-y-1'>
                  <div className='text-gray-500 dark:text-gray-400'>Total Bets</div>
                  <div className='animate-pulse font-semibold'>{userStats.totalBets}</div>
                </div>
                <div className='flex flex-col gap-y-1'>
                  <div className='text-gray-500 dark:text-gray-400'>Win Rate</div>
                  <div className='font-semibold text-green-500'>{userStats.winRate}%</div>
                </div>
                <div className='flex flex-col gap-y-2.5'>
                  <div className='text-gray-500 dark:text-gray-400'>Total Volume</div>
                  <div className='flex items-center gap-1 font-semibold'>
                    {tokenLogo}
                    <span className='relative mr-5'>
                      {tokenType === TokenType.Usdc
                        ? `${(userStats.totalVolume / Math.pow(10, USDC_DECIMALS)).toLocaleString()}`
                        : `${Math.floor(userStats.totalVolume / Math.pow(10, POINTS_DECIMALS)).toLocaleString()}`}
                    </span>
                  </div>
                </div>
                <div className='flex flex-col gap-y-2.5'>
                  <div className='text-gray-500 dark:text-gray-400'>Avg Bet Size</div>
                  <div className='flex items-center gap-1 font-semibold'>
                    {tokenLogo}
                    {tokenType === TokenType.Usdc
                      ? `${(Number(userStats.avgBetSize) / Math.pow(10, USDC_DECIMALS)).toLocaleString()}`
                      : `${Math.floor(Number(userStats.avgBetSize) / Math.pow(10, POINTS_DECIMALS)).toLocaleString()}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='space-y-3'>
            <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
              Token Actions
            </div>

            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Withdrawable Balance: {tokenLogo}
              {formattedWithdrawableBalance}
            </p>

            <div className='mb-2'>
              <Input
                type='number'
                placeholder='Enter amount'
                className='w-full border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800'
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(Number(e.target.value))}
              />
            </div>
            <div className='flex w-full'>
              <Button
                variant='outline'
                className='flex w-full items-center justify-center gap-1 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/20 dark:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                onClick={handleWithdraw}
                disabled={isPending}
              >
                <ArrowUpFromLine className='h-4 w-4' />
                <span>Withdraw</span>
              </Button>
            </div>
          </div>

          <Separator className='my-4' />

          <nav className='space-y-1'>
            {renderFilterButton('active', 'Active Bets', <History className='h-4 w-4' />)}
            {renderFilterButton('won', 'Won Bets', <History className='h-4 w-4' />)}
            {renderFilterButton('lost', 'Lost Bets', <History className='h-4 w-4' />)}
            {renderFilterButton('all', 'All Bets', <History className='h-4 w-4' />)}
            <Separator className='my-2' />
          </nav>

          {/* Recent Withdrawals Section */}
          {betWithdrawals?.betWithdrawals && betWithdrawals.betWithdrawals.length > 0 && (
            <>
              <Separator className='my-4' />
              <div className='space-y-3'>
                <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                  Recent Withdrawals
                </div>
                <div className='max-h-60 space-y-2 overflow-y-auto'>
                  {betWithdrawals.betWithdrawals.slice(0, 5).map((withdrawal: any) => {
                    const resolvedTokenType =
                      withdrawal.bet?.tokenType === 0 ? TokenType.Usdc : TokenType.Points;
                    const symbol = resolvedTokenType === TokenType.Usdc ? '💲' : '🦅';
                    const decimals =
                      resolvedTokenType === TokenType.Usdc ? USDC_DECIMALS : POINTS_DECIMALS;
                    const formattedAmount = (
                      parseFloat(withdrawal.bet?.amount) / Math.pow(10, decimals)
                    ).toFixed(0);
                    const date = new Date(withdrawal.blockTimestamp * 1000);

                    return (
                      <div
                        key={withdrawal.id}
                        className='rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-800'
                      >
                        <div className='flex justify-between'>
                          <span className='font-medium'>
                            {symbol} {formattedAmount}
                          </span>
                          <span className='text-gray-500'>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className='mt-1 truncate text-gray-500'>
                          {withdrawal.bet?.pool?.question?.substring(0, 40)}...
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <main className='flex flex-1 flex-col overflow-y-hidden md:flex-row'>
          {/* Feed */}
          <div className='scrollbar-hide flex flex-1 justify-center overflow-y-auto p-4'>
            <div className='w-full max-w-2xl'>
              {/* Mobile Profile Section */}
              <div className='mb-6 flex flex-col items-center gap-3 md:hidden'>
                <Avatar className='h-20 w-20 overflow-hidden rounded-full'>
                  <RandomAvatar size={48} name={address} />
                </Avatar>
                <div className='text-center'>
                  <div className='text-xl font-bold'>
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
                  </div>
                </div>
                <div className='flex w-full max-w-xs items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
                  <div className='text-center'>
                    <div className='text-sm text-gray-500 dark:text-gray-400'>Balance</div>
                    <div className='flex items-center gap-1 font-bold'>
                      {formattedBalance} {tokenLogo}
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-sm text-gray-500 dark:text-gray-400'>Network</div>
                    <div className='font-semibold'>{networkInfo.name}</div>
                  </div>
                </div>

                {/* Mobile Betting Stats */}
                <div className='w-full space-y-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
                  <div className='text-center text-sm font-medium text-gray-500 dark:text-gray-400'>
                    Betting Stats
                  </div>
                  <div className='grid grid-cols-2 gap-4 text-center text-xs'>
                    <div className='flex flex-col items-center gap-y-1'>
                      <div className='text-gray-500 dark:text-gray-400'>Total Bets</div>
                      <div className='animate-pulse font-semibold'>{userStats.totalBets}</div>
                    </div>
                    <div className='flex flex-col items-center gap-y-1'>
                      <div className='text-gray-500 dark:text-gray-400'>Win Rate</div>
                      <div className='font-semibold text-green-500'>{userStats.winRate}%</div>
                    </div>
                    <div className='flex flex-col items-center gap-y-2.5'>
                      <div className='text-gray-500 dark:text-gray-400'>Total Volume</div>
                      <div className='flex items-center gap-1 font-semibold'>
                        {tokenLogo}
                        <span className='relative mr-5'>
                          {tokenType === TokenType.Usdc
                            ? `${(userStats.totalVolume / Math.pow(10, USDC_DECIMALS)).toLocaleString()}`
                            : `${Math.floor(userStats.totalVolume / Math.pow(10, POINTS_DECIMALS)).toLocaleString()}`}
                          {/* {userStats.activeVolume > 0 && (
                            <span className='absolute -top-3 -right-3 text-[10px] font-bold text-orange-500'>
                              +{userStats.activeVolume.tofixed(0)}
                            </span>
                          )} */}
                        </span>
                      </div>
                    </div>
                    <div className='flex flex-col items-center gap-y-2.5'>
                      <div className='text-gray-500 dark:text-gray-400'>Avg Bet Size</div>
                      <div className='flex items-center gap-1 font-semibold'>
                        {tokenLogo}
                        {tokenType === TokenType.Usdc
                          ? `${(Number(userStats.avgBetSize) / Math.pow(10, USDC_DECIMALS)).toLocaleString()}`
                          : `${Math.floor(Number(userStats.avgBetSize) / Math.pow(10, POINTS_DECIMALS)).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Token Actions */}
                <div className='mt-2 w-full space-y-3'>
                  <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                    Token Actions
                  </div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Withdrawable Balance:
                    <span className='flex items-center gap-1 font-bold'>
                      {tokenLogo}
                      {formattedWithdrawableBalance}
                    </span>
                  </p>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 md:mb-2'>
                      <Input
                        type='number'
                        placeholder='Enter amount'
                        className='w-full border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800'
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(Number(e.target.value))}
                      />
                    </div>
                    <div className='flex'>
                      <Button
                        variant='outline'
                        className='flex items-center justify-center gap-1 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/20 dark:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                        onClick={handleWithdraw}
                        disabled={isPending}
                      >
                        <ArrowUpFromLine className='h-4 w-4' />
                        <span>Withdraw</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Search */}
              <div className='mb-4 md:hidden'>
                <div className='relative'>
                  <Search
                    className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500 dark:text-gray-400'
                    size={18}
                  />
                  <Input
                    placeholder='Search your bets...'
                    className='border-gray-300 bg-white pl-10 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              {/* Mobile Tabs */}
              <div className='scrollbar-hide mb-4 overflow-x-auto md:hidden'>
                <Tabs
                  defaultValue='active'
                  value={activeFilter}
                  onValueChange={handleFilterChange}
                  className='w-full'
                >
                  <TabsList className='bg-gray-100 dark:bg-gray-900'>
                    <TabsTrigger
                      value='active'
                      className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
                    >
                      Active
                    </TabsTrigger>
                    <TabsTrigger
                      value='won'
                      className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
                    >
                      Won
                    </TabsTrigger>
                    <TabsTrigger
                      value='lost'
                      className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
                    >
                      Lost
                    </TabsTrigger>
                    <TabsTrigger
                      value='all'
                      className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
                    >
                      All
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Betting Posts */}
              <div className='flex-1 space-y-4'>
                {filteredPools.map(item => {
                  const bet = activeFilter === 'won' ? (item as PayoutClaimed).bet : (item as Bet);
                  const pool =
                    activeFilter === 'won'
                      ? (item as PayoutClaimed).pool || (item as PayoutClaimed).bet?.pool
                      : (item as Bet).pool;
                  const amount =
                    activeFilter === 'won' ? (item as PayoutClaimed).amount : (item as Bet).amount;

                  // Calculate net winnings if this is a won bet
                  const payout =
                    activeFilter === 'won'
                      ? item.amount // This is the total payout amount received
                      : undefined;

                  // Calculate net winnings (payout minus original bet amount)
                  let netWinnings: string | undefined = undefined;
                  try {
                    if (activeFilter === 'won' && payout && bet.amount) {
                      const payoutBigInt = BigInt(payout);
                      const betAmountBigInt = BigInt(bet.amount);
                      // Ensure we don't have negative profit (which shouldn't happen, but just in case)
                      netWinnings =
                        payoutBigInt > betAmountBigInt
                          ? (payoutBigInt - betAmountBigInt).toString()
                          : '0';
                    }
                  } catch (error) {
                    console.error('Error calculating net winnings:', error);
                    netWinnings = '0';
                  }

                  // For lost bets, add more information about what caused the loss
                  const winningOption =
                    activeFilter === 'lost' && pool.winningOption !== undefined
                      ? pool.options[pool.winningOption]
                      : undefined;

                  return (
                    <UserBettingPost
                      key={bet.id}
                      id={bet.pool.id}
                      username='realDonaldTrump'
                      time={pool.createdAt}
                      question={pool.question}
                      status={pool.status}
                      options={pool.options}
                      selectedOption={bet.option}
                      truthSocialId={pool.originalTruthSocialPostId}
                      volume={getVolumeForTokenType(pool, bet.tokenType)}
                      closesAt={pool.betsCloseAt}
                      userBet={{
                        amount: amount,
                        selectedOption: bet.option,
                        outcome:
                          activeFilter === 'won'
                            ? 'won'
                            : activeFilter === 'lost'
                              ? 'lost'
                              : pool.status === 'GRADED'
                                ? bet.isWithdrawn
                                  ? 'won'
                                  : 'lost'
                                : 'pending',
                        payout: payout,
                        netWinnings: netWinnings,
                        winningOption: winningOption,
                      }}
                      tokenType={bet.tokenType}
                    />
                  );
                })}
                {filteredPools.length === 0 && (
                  <div className='py-8 text-center text-gray-500 dark:text-gray-400'>
                    No bets found for this filter
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <div className='hidden w-80 overflow-y-auto border-l border-gray-200 p-4 md:block dark:border-gray-800'>
          {/* Search */}
          <div className='mb-6'>
            <div className='relative'>
              <Search
                className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500 dark:text-gray-400'
                size={18}
              />
              <Input
                placeholder='Search your bets...'
                className='dark:bg-background border-gray-300 bg-white pl-10 text-gray-900 dark:border-gray-700 dark:text-white'
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* Highest Vol */}
          {memoizedHighestVolume}

          {/* Ending Soon */}
          {memoizedEndingSoon}
        </div>
      </div>
    </div>
  );
}
