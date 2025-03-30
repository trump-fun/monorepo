import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TokenBalance } from '@/types/pool';
import { Pool } from '@/types';
import { ReactNode } from 'react';

interface BettingFormProps {
  pool: Pool; // Replace with proper typing
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
  tokenLogo: ReactNode;
  balance: TokenBalance | null | undefined;
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

    // Only update if valid number or empty
    if (value === '' || !isNaN(Number(value))) {
      setBetAmount(value);

      // Update slider if balance exists
      if (balance) {
        const maxAmount = Number(balance.value) / Math.pow(10, balance.decimals);
        if (maxAmount > 0 && value !== '') {
          const percentage = Math.min(100, (Number(value) / maxAmount) * 100);
          setSliderValue([percentage]);
        } else {
          setSliderValue([0]);
        }
      }
    }
  };

  return (
    <div className='rounded-lg border p-4 shadow-sm'>
      <h3 className='mb-4 text-lg font-semibold'>Place Your Bet</h3>

      {/* Options Selector */}
      <div className='mb-4'>
        <p className='text-muted-foreground mb-2 text-sm'>Select an outcome:</p>
        <div className='flex flex-wrap gap-2'>
          {pool.options.map((option: string, index: number) => (
            <Button
              key={index}
              variant={selectedOption === index ? 'default' : 'outline'}
              onClick={() => setSelectedOption(index)}
              className={
                selectedOption === index
                  ? index === 0
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div className='mb-4'>
        <div className='mb-2 flex items-center justify-between'>
          <p className='text-muted-foreground text-sm'>Bet amount:</p>
          <div className='text-muted-foreground flex items-center text-xs'>
            <span>Balance: </span>
            <span className='ml-1 font-medium'>{formattedBalance}</span>
            {tokenLogo}
          </div>
        </div>

        <div className='mb-2 flex items-center gap-2'>
          <div className='relative flex-1'>
            <input
              type='text'
              value={userEnteredValue || betAmount}
              onChange={handleAmountChange}
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
              placeholder='Enter amount'
            />
            <div className='absolute top-1/2 right-3 -translate-y-1/2 transform'>{tokenLogo}</div>
          </div>

          <Button onClick={() => handlePercentageClick(100)} variant='outline' size='sm'>
            Max
          </Button>
        </div>

        {/* Percentage Buttons */}
        <div className='mb-4 flex justify-between gap-2'>
          {[0, 25, 50, 75, 100].map(percentage => (
            <Button
              key={percentage}
              variant='outline'
              size='sm'
              onClick={() => handlePercentageClick(percentage)}
              className={sliderValue[0] === percentage ? 'bg-muted' : ''}
            >
              {percentage}%
            </Button>
          ))}
        </div>

        {/* Slider */}
        <Slider
          value={sliderValue}
          onValueChange={setSliderValue}
          max={100}
          step={1}
          className='my-4'
        />
      </div>

      {/* Place Bet Button */}
      {authenticated ? (
        <Button
          className='w-full'
          disabled={
            !betAmount ||
            betAmount === '0' ||
            selectedOption === null ||
            isPending ||
            !balance ||
            Number(betAmount) > Number(balance.formatted)
          }
          onClick={handleBet}
        >
          {isPending
            ? `Approving...`
            : !betAmount || betAmount === '0'
              ? 'Enter an amount'
              : selectedOption === null
                ? 'Select an outcome'
                : Number(betAmount) > Number(balance?.formatted)
                  ? 'Insufficient balance'
                  : `Bet ${betAmount} ${symbol} on "${
                      selectedOption !== null ? pool.options[selectedOption] : ''
                    }"`}
        </Button>
      ) : (
        <Button className='w-full' onClick={() => (window.location.href = '/login')}>
          Login to Bet
        </Button>
      )}
    </div>
  );
};
