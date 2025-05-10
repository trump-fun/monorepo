import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { showErrorToast } from '@/utils/toast';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';

import { useDynamicSolana } from '@/hooks/useDynamicSolana';
import { usePlaceBet } from '@/hooks/usePlaceBet';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { HandCoins, Loader2 } from 'lucide-react';

interface BetModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  poolId: string;
  options: string[];
  placeBetWithHook?: (args: {
    poolId: string;
    betAmount: string;
    selectedOption: number;
    options: string[];
  }) => Promise<void>;
}

export const BetModal: FC<BetModalProps> = ({
  isOpen,
  setIsOpen,
  poolId,
  options,
  placeBetWithHook,
}) => {
  const [betAmount, setBetAmount] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [userEnteredValue, setUserEnteredValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contract and wallet states
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const { publicKey } = useDynamicSolana();

  const { formattedBalance, symbol, tokenDecimals, tokenAddress, rawBalance } = useTokenBalance();

  // Update bet amount when slider changes
  useEffect(() => {
    // Skip if user is actively typing or if a manual value is entered
    if (isUserTyping) return;
    if (userEnteredValue) return;
    if (!formattedBalance) return;

    const balanceValue = Number(formattedBalance);

    if (sliderValue[0] > 0) {
      // Calculate amount based on percentage of balance
      let amount;

      // Special case for 100%
      if (sliderValue[0] === 100) {
        amount = balanceValue;
      } else {
        amount = Math.max((balanceValue * sliderValue[0]) / 100, 1);
      }

      const amountStr = amount.toString();
      if (amountStr !== betAmount) {
        setBetAmount(amountStr);
      }
    } else if (sliderValue[0] === 0 && betAmount !== '') {
      setBetAmount('');
    }
  }, [sliderValue, betAmount, isUserTyping, userEnteredValue, formattedBalance]);

  const balance =
    rawBalance && tokenDecimals
      ? {
          value: rawBalance,
          decimals: tokenDecimals,
          formatted: formattedBalance,
        }
      : undefined;

  const handlePercentageClick = (percentage: number) => {
    if (!balance || !formattedBalance) return;

    // Convert formattedBalance to a number for calculations
    const rawBalanceValue = Number(formattedBalance);

    let amount;
    if (percentage === 100) {
      amount = rawBalanceValue;
    } else if (percentage === 0) {
      amount = 0;
    } else {
      amount = Math.max((rawBalanceValue * percentage) / 100, 1);
    }

    const amountStr = amount.toString();
    setBetAmount(amountStr);
    setSliderValue([percentage]);
    setUserEnteredValue('');
  };

  // Initialize the placeBet hook with reset function
  const placeBetHook = usePlaceBet({
    resetBettingForm: () => {
      setBetAmount('');
      setSelectedOption(null);
      setSliderValue([0]);
      setUserEnteredValue('');
    },
  });

  const placeBet = async () => {
    if (!primaryWallet) {
      setShowAuthFlow(true);
      return;
    }

    if (!publicKey) {
      showErrorToast('Wallet not connected');
      return;
    }

    if (!betAmount || betAmount === '0' || selectedOption === null) {
      showErrorToast('Please enter a bet amount and select an option');
      return;
    }

    // Check for insufficient balance
    if (balance && Number(betAmount) > Number(balance.formatted)) {
      showErrorToast('Insufficient balance', 'Your bet amount exceeds your available balance');
      return;
    }

    // Use placeBetWithHook if provided (for backward compatibility), otherwise use the hook
    setIsSubmitting(true);
    try {
      if (placeBetWithHook) {
        await placeBetWithHook({
          poolId,
          betAmount,
          selectedOption,
          options,
        });
      } else {
        await placeBetHook({
          poolId,
          betAmount,
          selectedOption: selectedOption,
        });
      }

      // Close the modal after successful bet
      setIsOpen(false);
      // Note: The form will be reset by the resetBettingForm callback
    } catch (error) {
      showErrorToast('Error placing bet');
      console.error('Bet error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionColors = (index: number) => {
    const optionColors = [
      { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' },
      { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' },
      { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' },
      { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500' },
      { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500' },
    ];

    const colorIndex = index % optionColors.length;
    return optionColors[colorIndex];
  };

  const isButtonDisabled =
    !betAmount ||
    betAmount === '0' ||
    selectedOption === null ||
    !primaryWallet ||
    isSubmitting ||
    (balance && Number(betAmount) > Number(balance.formatted));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='overflow-hidden p-0 sm:max-w-[500px]'>
        <div className='bg-gradient-to-r from-orange-500 to-rose-500 p-6 text-white'>
          <DialogHeader className='pb-2'>
            <DialogTitle className='text-2xl font-bold'>Place Your Bet</DialogTitle>
            <DialogDescription className='text-white/90'>
              Select an option and enter your bet amount.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className='space-y-6 p-6'>
          <div className='space-y-3'>
            <h4 className='text-sm font-medium'>Select an option:</h4>
            <div className='grid gap-2'>
              {options.map((option, i) => {
                const { text: textColor, bg: bgColor } = getOptionColors(i);

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-md p-3 transition-all ${
                      selectedOption === i
                        ? `ring-2 ring-${bgColor.replace('bg-', '')} bg-gray-100/70 dark:bg-gray-800/70`
                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800'
                    } cursor-pointer`}
                    onClick={() => setSelectedOption(i)}
                  >
                    <div className='flex items-center gap-2'>
                      <div className={`h-3 w-3 rounded-full ${bgColor}`}></div>
                      <span className={`font-medium ${textColor}`}>{option}</span>
                    </div>

                    {selectedOption === i && <div className={`text-sm ${textColor}`}>Selected</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className='space-y-3 border-t border-gray-200 pt-2 dark:border-gray-800'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-medium'>Bet amount</h4>
              {balance && (
                <div className='text-xs text-gray-500 dark:text-gray-400'>
                  Balance: {formattedBalance} {symbol}
                </div>
              )}
            </div>

            <div className='flex gap-1.5'>
              {[25, 50, 75, 100].map((percent) => (
                <Button
                  key={percent}
                  variant={sliderValue[0] === percent ? 'default' : 'outline'}
                  size='sm'
                  className={`flex-1 text-xs ${
                    sliderValue[0] === percent ? 'bg-orange-500 text-white hover:bg-orange-600' : ''
                  }`}
                  onClick={() => handlePercentageClick(percent)}
                >
                  {percent}%
                </Button>
              ))}
            </div>

            <Slider
              defaultValue={[0]}
              max={100}
              step={1}
              value={sliderValue}
              onValueChange={(newValue) => {
                setUserEnteredValue('');
                setSliderValue(newValue);
              }}
              className='my-6'
            />

            <div className='relative flex-1'>
              <Input
                type='text'
                inputMode='numeric'
                placeholder='0'
                className='h-12 pr-16 text-lg font-medium'
                value={userEnteredValue || betAmount}
                onChange={(e) => {
                  const value = e.target.value;

                  setIsUserTyping(true);
                  setUserEnteredValue(value);

                  if (value === '') {
                    setBetAmount('');
                    setSliderValue([0]);
                    setTimeout(() => setIsUserTyping(false), 1000);
                    return;
                  }

                  if (/^[0-9]+$/.test(value)) {
                    setBetAmount(value);

                    if (formattedBalance) {
                      const inputNum = parseFloat(value);
                      const balanceNum = parseFloat(formattedBalance);

                      if (inputNum > 0 && balanceNum > 0) {
                        // Calculate percentage of balance (inputNum / balanceNum) * 100
                        const percentage = Math.min(100, Math.floor((inputNum / balanceNum) * 100));
                        setSliderValue([percentage]);
                      }
                    } else {
                      setSliderValue([0]);
                    }
                  }

                  setTimeout(() => {
                    setIsUserTyping(false);
                  }, 2000);
                }}
              />
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500'>
                {symbol}
              </div>
            </div>

            {selectedOption !== null && betAmount && (
              <div className='mt-2 flex items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-900'>
                <HandCoins className='mr-2 h-5 w-5 text-orange-500' />
                <p className='text-sm'>
                  You are betting{' '}
                  <span className='font-medium text-orange-500'>
                    {betAmount} {symbol}
                  </span>{' '}
                  on
                  <span className='font-medium'> &quot;{options[selectedOption]}&quot;</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2 border-t border-gray-200 p-6 dark:border-gray-800'>
          <DialogClose asChild>
            <Button type='button' variant='outline' className='flex-1'>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            variant='default'
            className='flex-1 bg-orange-500 hover:bg-orange-600'
            onClick={placeBet}
            disabled={isButtonDisabled}
            title={
              !betAmount || betAmount === '0'
                ? 'Please enter a bet amount'
                : selectedOption === null
                  ? 'Please select an option'
                  : !primaryWallet
                    ? 'Please connect your wallet'
                    : balance && Number(betAmount) > Number(balance.formatted)
                      ? 'Insufficient balance'
                      : ''
            }
          >
            {isSubmitting ? (
              <span className='flex items-center'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing...
              </span>
            ) : !betAmount || betAmount === '0' ? (
              'Enter an amount'
            ) : selectedOption === null ? (
              'Select an outcome'
            ) : balance && Number(betAmount) > Number(balance.formatted) ? (
              'Insufficient balance'
            ) : (
              'Place Bet'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
