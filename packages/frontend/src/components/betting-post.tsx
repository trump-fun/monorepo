'use client';

import { isPoolFactsd, savePoolFacts } from '@/app/pool-actions';
import { Button } from '@/components/ui/button';
import { PoolStatus } from '@/types/__generated__/graphql';
import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth';
import { formatDistanceToNow } from 'date-fns';
import { HandCoins, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FaFlagUsa } from 'react-icons/fa';
import TruthSocial from './common/truth-social';
import { BetModal } from './dialogs/bet';
import { CommentModal } from './dialogs/comment';
import { PoolImage } from './pool-image';
import CountdownTimer from './Timer';
import { Badge } from './ui/badge';

interface Bet {
  amount: string;
  tokenType: string;
  betId: string;
  option: string;
  user: string;
  updatedAt: string;
  createdAt: string;
}

interface BettingPostProps {
  id: string;
  imageUrl: string;
  username: string;
  time: number;
  question: string;
  options: string[];
  truthSocialId: string;
  status: PoolStatus;
  commentCount?: number;
  volume?: number;
  optionBets?: string[];
  closesAt?: number;
  gradedBlockTimestamp?: number;
  bets?: Bet[];
}

export function BettingPost({
  id,
  imageUrl,
  username,
  time,
  question,
  options,
  truthSocialId,
  status,
  commentCount = 0,
  volume = 0,
  optionBets = [],
  gradedBlockTimestamp,
  closesAt,
  bets,
}: BettingPostProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [factsCount, setFactsCount] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem(`pool_facts_${id}`) || '0', 10);
    }
    return 5;
  });

  const [hasFactsed, setHasFactsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`pool_facts_liked_${id}`) === 'true';
    }
    return false;
  });
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { signMessage } = useSignMessage();

  const isActive = status === PoolStatus.Pending || status === PoolStatus.None;
  const isWalletConnected = authenticated && wallets && wallets.length > 0 && wallets[0]?.address;

  const betData = useMemo(() => {
    const betAmounts = optionBets.map(
      (bet) => parseFloat(bet.replace(/[$£€]/g, '').replace(/\s+pts/g, '')) || 0
    );

    const totalVolume = betAmounts.reduce((sum, amount) => sum + amount, 0);

    const percentages = betAmounts.map((amount) =>
      totalVolume > 0 ? (amount / totalVolume) * 100 : 0
    );

    const displayPercentages = [...percentages];
    if (totalVolume > 0) {
      let total = 0;
      for (let i = 0; i < displayPercentages.length - 1; i++) {
        displayPercentages[i] = Math.round(displayPercentages[i]);
        total += displayPercentages[i];
      }
      displayPercentages[displayPercentages.length - 1] = 100 - total;
    }

    return {
      betAmounts,
      totalVolume,
      exactPercentages: percentages,
      displayPercentages,
    };
  }, [optionBets]);

  const currentUserAddress = '0x6bF08768995E7430184a48e96940B83C15c1653f';

  const userBetsByOption = useMemo(() => {
    if (!bets || !currentUserAddress)
      return {} as Record<string, { amount: string; tokenType: string }[]>;

    const userBets = bets.filter(
      (bet: Bet) => bet.user.toLowerCase() === currentUserAddress.toLowerCase()
    );

    const optionMapping: Record<string, string> = {};
    options.forEach((opt, index) => {
      optionMapping[opt] = index.toString();
    });

    const betsByOption: Record<string, { amount: string; tokenType: string }[]> = {};

    userBets.forEach((bet: Bet) => {
      const optionKey = optionMapping[bet.option] || bet.option;

      if (!betsByOption[optionKey]) {
        betsByOption[optionKey] = [];
      }

      betsByOption[optionKey].push({
        amount: bet.amount,
        tokenType: bet.tokenType,
      });
    });

    return betsByOption;
  }, [bets, currentUserAddress, options]);

  // Format bet amount for display
  const formatBetAmount = (amount: string) => {
    const value = parseInt(amount, 10);
    return value >= 1000000
      ? `${(value / 1000000).toFixed(1)}M`
      : value >= 1000
        ? `${(value / 1000).toFixed(1)}K`
        : value.toString();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasFactsd = isPoolFactsd(id);
      setHasFactsed(wasFactsd);
    }
  }, [id]);

  const handleFacts = async () => {
    if (!isWalletConnected) {
      login();
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const wallet = wallets?.[0];

      if (!wallet || !wallet.address) {
        setIsSubmitting(false);
        return;
      }

      const isAdding = !hasFactsed;
      const messageObj = {
        action: 'toggle_facts',
        poolId: id,
        operation: isAdding ? 'add_facts' : 'remove_facts',
        timestamp: new Date().toISOString(),
        account: wallet.address.toLowerCase(),
      };

      const messageStr = JSON.stringify(messageObj);
      await signMessage(
        { message: messageStr },
        {
          uiOptions: {
            title: isAdding ? 'Sign to FACTS' : 'Sign to remove FACTS',
            description: 'Sign this message to verify your action',
            buttonText: 'Sign',
          },
          address: wallet.address,
        }
      );

      const newFactsCount = isAdding ? factsCount + 1 : factsCount - 1;

      setHasFactsed(isAdding);
      setFactsCount(newFactsCount);

      savePoolFacts(id, isAdding);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`pool_facts_${id}`, newFactsCount.toString());
        localStorage.setItem(`pool_facts_liked_${id}`, isAdding.toString());
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      if (
        error instanceof Error &&
        !error.message.includes('rejected') &&
        !error.message.includes('cancel') &&
        !error.message.includes('user rejected')
      ) {
        console.error('Failed to sign message:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVolumeBar = () => {
    if (volume === 0) {
      return (
        <div className='relative'>
          <div className='flex-1 rounded-full bg-gray-200 dark:bg-gray-800'>
            <div className='flex overflow-hidden rounded-full'>
              <div className='h-2 w-full bg-gray-300 dark:bg-gray-700'></div>
            </div>
          </div>

          <div className='mt-1 flex justify-end'>
            <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
              {volume} vol.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='relative'>
        <div className='flex-1 rounded-full bg-gray-200 dark:bg-gray-800'>
          <div className='flex overflow-hidden rounded-full'>
            {betData.exactPercentages.map((percent, index) => {
              const colors = [
                'bg-green-500',
                'bg-red-500 dark:bg-red-700',
                'bg-blue-500',
                'bg-yellow-500',
                'bg-purple-500',
              ];

              const colorClass = colors[index % colors.length];
              const roundedClass =
                index === 0
                  ? 'rounded-l-full'
                  : index === betData.exactPercentages.length - 1
                    ? 'rounded-r-full'
                    : '';

              return (
                <div
                  key={index}
                  className={`h-2 ${colorClass} ${roundedClass}`}
                  style={{ width: `${percent.toFixed(2)}%` }}
                ></div>
              );
            })}
          </div>
        </div>

        <div className='mt-1 flex justify-end'>
          <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>{volume} vol.</div>
        </div>
      </div>
    );
  };

  return (
    <div className='bg-background overflow-hidden rounded-lg border border-gray-200 transition-colors hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-700'>
      <CommentModal
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        poolId={id}
        username={username}
        avatar={imageUrl}
      />
      <BetModal isOpen={betModalOpen} setIsOpen={setBetModalOpen} poolId={id} options={options} />
      <div className='p-4'>
        <div className='mb-2 flex items-center gap-2'>
          <PoolImage imageUrl={imageUrl} width={32} height={32} />
          <div className='flex-1'>
            <div className='font-bold'>{username}</div>
          </div>
          <div className='flex items-center gap-2'>
            {isActive ? (
              <div className='flex items-center'>
                <span className='relative flex h-3 w-3'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75'></span>
                  <span className='relative inline-flex h-3 w-3 rounded-full bg-green-500'></span>
                </span>
              </div>
            ) : (
              <Badge variant='secondary' className='bg-red-500'>
                CLOSED
              </Badge>
            )}
            <span className='text-muted-foreground text-xs'>
              {formatDistanceToNow(
                new Date(
                  status === PoolStatus.Graded &&
                  gradedBlockTimestamp &&
                  !isNaN(new Date(gradedBlockTimestamp * 1000).getTime())
                    ? gradedBlockTimestamp * 1000
                    : time && !isNaN(new Date(time * 1000).getTime())
                      ? time * 1000
                      : Date.now()
                ),
                { addSuffix: true }
              )}
            </span>
            <TruthSocial postId={truthSocialId} />
          </div>
        </div>

        <Link href={`/pools/${id}`} className='block'>
          <p className='mb-4 text-lg font-medium transition-colors hover:text-orange-500'>
            {question}
          </p>
        </Link>

        <div className='mb-3 rounded-md'>{renderVolumeBar()}</div>

        <div className='mb-4 space-y-2'>
          {options.map((option, i) => {
            const optionColors = [
              { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' },
              { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' },
              { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' },
              { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500' },
              { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500' },
            ];

            const colorIndex = i % optionColors.length;
            const { text: textColor, bg: bgColor } = optionColors[colorIndex];
            const percent = betData.displayPercentages[i] || 0;

            const optionKey = i.toString();
            const userBetsOnOption = userBetsByOption[optionKey] || [];
            const hasUserBet = userBetsOnOption.length > 0;

            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-md p-2 transition-colors ${
                  selectedOption === i
                    ? `border border-${bgColor.replace('bg-', '')} bg-gray-100 dark:bg-gray-800`
                    : hasUserBet
                      ? `border border-${bgColor.replace('bg-', '')} bg-opacity-10 dark:bg-opacity-30 bg-gray-50 dark:bg-gray-900`
                      : 'bg-gray-50 opacity-90 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800'
                } relative cursor-pointer`}
                onClick={() => setSelectedOption(i)}
              >
                <div className='flex flex-col'>
                  <span className={`font-medium ${textColor}`}>
                    {option} {percent}%
                  </span>

                  {hasUserBet && (
                    <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                      You bet{' '}
                      {userBetsOnOption.reduce((total, bet, idx) => {
                        const amount = formatBetAmount(bet.amount);
                        return `${total}${idx > 0 ? ' + ' : ''}${amount} ${bet.tokenType}`;
                      }, '')}{' '}
                      on {option}
                    </div>
                  )}
                </div>

                <div
                  className={`flex items-center justify-center rounded-full ${bgColor} px-3 py-1 text-sm font-medium text-white`}
                >
                  {optionBets[i] || '0'}
                </div>

                {hasUserBet && (
                  <div
                    className='absolute -top-1 -right-1 z-10 h-3 w-3 rounded-full border border-white bg-blue-500 dark:border-gray-800'
                    style={{
                      boxShadow: '0 0 0 1px white',
                      pointerEvents: 'none',
                    }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex w-full items-center gap-2 md:w-auto'>
            {closesAt && !isNaN(new Date(closesAt * 1000).getTime()) && (
              <div className='flex items-center gap-1'>
                <CountdownTimer
                  closesAt={closesAt * 1000}
                  containerClassName='flex'
                  wrapperClassName='flex'
                  digitClassName='text-xs text-gray-500 dark:text-gray-400'
                  colonClassName='text-xs text-gray-500 dark:text-gray-400'
                  showClockIcon={true}
                  clockIconClassName='mr-3 text-gray-500 dark:text-gray-400'
                  clockIconSize={16}
                />
              </div>
            )}
          </div>

          <div className='flex w-full items-center justify-between gap-2 md:w-auto md:justify-end'>
            <Button
              variant='ghost'
              size='sm'
              className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              onClick={() => setModalOpen(true)}
            >
              <MessageCircle size={18} className='mr-1' />
              {commentCount > 0 ? commentCount : 'Comment'}
            </Button>

            <Button
              variant='ghost'
              size='sm'
              className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              onClick={() => setBetModalOpen(true)}
            >
              <HandCoins size={18} className='mr-1' />
              Bet
            </Button>

            <Button
              variant='ghost'
              size='sm'
              className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              onClick={handleFacts}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent'></span>
              ) : (
                <>
                  <FaFlagUsa
                    size={18}
                    className={`mr-1 ${hasFactsed ? 'text-rose-400' : ''}`}
                    style={hasFactsed ? { filter: 'drop-shadow(0 0 1px #f472b6)' } : {}}
                  />
                  <span className={`${hasFactsed ? 'font-medium text-rose-400' : ''}`}>FACTS</span>
                </>
              )}
              <span className={`ml-1 ${hasFactsed ? 'font-medium text-red-400' : ''}`}>
                {factsCount}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
