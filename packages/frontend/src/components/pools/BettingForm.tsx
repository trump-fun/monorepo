import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { PoolsQueryResultTypeSingle } from '@/types';
import { HandCoins } from 'lucide-react';

interface BettingFormProps {
  pool: PoolsQueryResultTypeSingle;
  handlePercentageClick: (percentage: number) => void;
  sliderValue: number[];
  setSliderValue: (value: number[]) => void;
  betAmount: string;
  setBetAmount: (value: string) => void;
  selectedOption: number | null;
  setSelectedOption: (value: number | null) => void;
  handleBet: () => void;
  authenticated: boolean;
  isPending: boolean;
  symbol: string;
  tokenLogo: string;
  balance?: { value: string; formatted: string; decimals: number };
  formattedBalance: string;
  setUserEnteredValue: (value: string) => void;
  userEnteredValue: string;
}

export const BettingForm = ({
  pool,
  handlePercentageClick,
  sliderValue,
  setSliderValue,
  betAmount,
  setBetAmount,
  selectedOption,
  setSelectedOption,
  handleBet,
  authenticated,
  isPending,
  symbol,
  tokenLogo,
  balance,
  formattedBalance,
  setUserEnteredValue,
  userEnteredValue,
}: BettingFormProps) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserEnteredValue(value);

    // Empty input handling
    if (value === '') {
      setBetAmount('');
      setSliderValue([0]);
      return;
    }

    // Only allow valid numbers
    if (/^[0-9]+$/.test(value)) {
      // Set input value immediately and preserve it
      setBetAmount(value);

      // Update slider if balance exists
      if (balance) {
        const inputNum = parseInt(value, 10);
        const balanceNum = Number(formattedBalance);

        if (inputNum > 0 && balanceNum > 0) {
          // Calculate percentage of balance
          const percentage = Math.min(100, Math.floor((inputNum / balanceNum) * 100));
          setSliderValue([percentage]);
        }
      } else {
        setSliderValue([0]);
      }
    }
  };

  if (!pool) {
    return null;
  }

  return (
    <div className='mt-6 border-t border-gray-800 pt-4'>
      <h4 className='mb-2 text-sm font-bold'>Place your bet</h4>

      {/* Option Buttons */}
      <div className='mb-4 grid grid-cols-2 gap-2'>
        {pool.options.map((option, i) => (
          <Button
            key={i}
            className={cn(
              'w-full',
              selectedOption === i
                ? i === 0
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-500 text-white hover:bg-red-600'
                : i === 0
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                  : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
            )}
            onClick={() => setSelectedOption(i)}
          >
            {option}
          </Button>
        ))}
      </div>

      {/* Percentage Buttons */}
      <div className='mb-2 grid grid-cols-4 gap-1'>
        {[25, 50, 75, 100].map((percent) => (
          <Button
            key={percent}
            variant={sliderValue[0] === percent ? 'default' : 'outline'}
            size='sm'
            className={cn(
              'w-full text-xs',
              sliderValue[0] === percent ? 'bg-orange-500 text-white hover:bg-orange-600' : ''
            )}
            onClick={() => handlePercentageClick(percent)}
          >
            {percent}%
          </Button>
        ))}
      </div>

      {/* Slider */}
      <div className='my-4'>
        <Slider
          max={100}
          step={1}
          value={sliderValue}
          onValueChange={(newValue) => {
            // When slider is directly manipulated, clear userEnteredValue
            setUserEnteredValue('');
            setSliderValue(newValue);
          }}
          className='mb-2'
        />
      </div>

      <div className='relative mb-4 flex flex-col gap-2 sm:flex-row'>
        <div className='relative flex-1'>
          <Input
            type='text'
            inputMode='numeric'
            placeholder='0'
            className='h-10 pr-16'
            value={userEnteredValue || betAmount}
            onChange={handleAmountChange}
          />
          <div className='absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400'>
            <span className='mr-1'>{tokenLogo}</span> {symbol}
          </div>
        </div>
        {balance && (
          <div className='-bottom-5 left-0 text-xs text-gray-400 md:absolute'>
            Balance: {formattedBalance}
          </div>
        )}

        <Button
          onClick={handleBet}
          disabled={
            !betAmount ||
            betAmount === '0' ||
            selectedOption === null ||
            isPending ||
            !balance ||
            Number(betAmount) > Number(balance.formatted)
          }
          className='h-10 w-full bg-orange-500 font-medium text-black hover:bg-orange-600 hover:text-black sm:w-auto dark:text-black'
          title={
            !betAmount || betAmount === '0'
              ? 'Please enter a bet amount'
              : selectedOption === null
                ? 'Please select an option'
                : !authenticated
                  ? 'Please connect your wallet'
                  : Number(betAmount) > Number(balance?.formatted)
                    ? 'Insufficient balance'
                    : ''
          }
        >
          {isPending ? (
            <span className='flex items-center'>
              <div className='mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              Processing...
            </span>
          ) : !betAmount || betAmount === '0' ? (
            'Enter an amount'
          ) : selectedOption === null ? (
            'Select an outcome'
          ) : Number(betAmount) > Number(balance?.formatted) ? (
            'Insufficient balance'
          ) : (
            'Place Bet'
          )}
        </Button>
      </div>

      {selectedOption !== null && betAmount && betAmount !== '0' && (
        <div className='mt-2 flex items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-900'>
          <HandCoins className='mr-2 h-5 w-5 text-orange-500' />
          <p className='text-sm'>
            You are betting{' '}
            <span className='font-medium text-orange-500'>
              {betAmount} <span className='mx-1'>{tokenLogo}</span> {symbol}
            </span>{' '}
            on
            <span className='font-medium'> &quot;{pool.options[selectedOption]}&quot;</span>
          </p>
        </div>
      )}
    </div>
  );
};
