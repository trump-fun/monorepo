import { TokenBalance } from '@/types/pool';
import { useEffect, useState } from 'react';

export function useBettingForm(balance: TokenBalance | null | undefined) {
  const [betAmount, setBetAmount] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sliderValue, setSliderValue] = useState<number[]>([0]);
  const [userEnteredValue, setUserEnteredValue] = useState<string>('');

  // Update bet amount when slider changes
  useEffect(() => {
    if (!balance || userEnteredValue) return;

    const rawBalanceValue = Number(balance.value) / Math.pow(10, balance.decimals);

    if (sliderValue[0] > 0) {
      const percentage = sliderValue[0] / 100;

      // Special case for 100%
      if (sliderValue[0] === 100) {
        const exactAmount = Math.ceil(rawBalanceValue).toString();
        if (exactAmount !== betAmount) {
          setBetAmount(exactAmount);
        }
        return;
      }

      // Compensate for the 1-off error
      const amount = Math.max(Math.ceil(rawBalanceValue * percentage), 1);
      const amountStr = amount.toString();

      // Don't set the value if it's already the same (prevents cursor jumping)
      if (amountStr !== betAmount) {
        setBetAmount(amountStr);
      }
    } else if (sliderValue[0] === 0 && betAmount !== '') {
      setBetAmount('');
    }
  }, [sliderValue, balance, betAmount, userEnteredValue]);

  const handlePercentageClick = (percentage: number) => {
    if (!balance) return;

    const rawBalanceValue = Number(balance.value) / Math.pow(10, balance.decimals);

    let amount;
    if (percentage === 100) {
      amount = Math.ceil(rawBalanceValue);
    } else if (percentage === 0) {
      amount = 0;
    } else {
      amount = Math.max(Math.ceil((rawBalanceValue * percentage) / 100), 1);
    }

    setBetAmount(amount.toString());
    setSliderValue([percentage]);
    setUserEnteredValue('');
  };

  const reset = () => {
    setBetAmount('');
    setSelectedOption(null);
    setSliderValue([0]);
  };

  return {
    betAmount,
    setBetAmount,
    selectedOption,
    setSelectedOption,
    sliderValue,
    setSliderValue,
    userEnteredValue,
    setUserEnteredValue,
    handlePercentageClick,
    reset,
  };
}
