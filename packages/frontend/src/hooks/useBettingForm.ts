import { TokenBalance } from '@/types/pool';
import { useEffect, useState } from 'react';

export function useBettingForm(balance: TokenBalance | null | undefined) {
  const [betAmount, setBetAmount] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sliderValue, setSliderValue] = useState<number[]>([0]);
  const [userEnteredValue, setUserEnteredValue] = useState<string>('');

  // Update bet amount when slider changes
  useEffect(() => {
    // Skip if no balance or if user manually entered a value
    if (!balance || userEnteredValue) return;

    // Skip if this effect is running due to a percentage button click
    // (We now handle the bet amount update directly in handlePercentageClick)
    if (document.activeElement?.tagName === 'BUTTON') return;

    const rawBalanceValue = Number(balance.value) / Math.pow(10, balance.decimals);

    if (sliderValue[0] > 0) {
      const percentage = sliderValue[0] / 100;

      // Special case for 100%
      if (sliderValue[0] === 100) {
        const exactAmount = Math.floor(rawBalanceValue * 100) / 100;
        const amountStr = exactAmount.toString();
        if (amountStr !== betAmount) {
          setBetAmount(amountStr);
        }
        return;
      }

      // Calculate with 2 decimal precision for better accuracy
      const amount = Math.floor(rawBalanceValue * percentage * 100) / 100;

      // Only use minimum of 1 if balance is sufficient
      const finalAmount = rawBalanceValue >= 4 && amount < 1 ? 1 : amount;
      const amountStr = finalAmount.toString();

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
      amount = Math.floor(rawBalanceValue * 100) / 100; // Use full balance with 2 decimal precision
    } else if (percentage === 0) {
      amount = 0;
    } else {
      // Calculate percentage more precisely without excessive rounding
      amount = Math.floor(((rawBalanceValue * percentage) / 100) * 100) / 100;

      // Only enforce minimum of 1 if the balance is large enough
      if (rawBalanceValue >= 4 && amount < 1) {
        amount = 1;
      }
    }

    // First update the bet amount
    setBetAmount(amount.toString());

    // Then update the slider - do this in the next tick to avoid conflicts
    setTimeout(() => {
      setSliderValue([percentage]);
    }, 0);

    // Clear any user entered value
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
