/*
Locally stores if we've topped up already to avoid spamming the api/mint endpoint.
api/mint itself won't mint more than one per day per user, but this route will spam unless there's a rate limit in it.
*/
import { TopUpBalanceParams, TopUpBalanceResponse } from '@/app/api/mint/route';
import { USDC_DECIMALS } from '@trump-fun/common';
import { showSuccessToast } from './toast';

// localStorage key for tracking when user last topped up
const LAST_TOPUP_KEY = 'trump_fun_last_topup';

// Check if user is eligible for a daily top-up
const canTopUp = (): boolean => {
  try {
    const lastTopUpStr = localStorage.getItem(LAST_TOPUP_KEY);

    if (!lastTopUpStr) {
      return true; // No record found, user can top up
    }

    const lastTopUp = new Date(lastTopUpStr);
    const now = new Date();

    // Check if it's a different UTC day
    return (
      lastTopUp.getUTCFullYear() !== now.getUTCFullYear() ||
      lastTopUp.getUTCMonth() !== now.getUTCMonth() ||
      lastTopUp.getUTCDate() !== now.getUTCDate()
    );
  } catch (e) {
    console.error('Error checking top-up eligibility:', e);
    return true; // Default to allowing top-up if there's an error checking
  }
};

// Record successful top-up time
const recordTopUp = (): void => {
  try {
    localStorage.setItem(LAST_TOPUP_KEY, new Date().toISOString());
  } catch (e) {
    console.error('Error recording top-up time:', e);
  }
};

export const topUpBalance = async (params: TopUpBalanceParams): Promise<TopUpBalanceResponse> => {
  // Check if user is eligible for daily top-up
  if (!canTopUp()) {
    return {
      success: false,
      amountMinted: '0',
      message: 'You can only top up once per day (UTC). Try again tomorrow!',
    };
  }

  try {
    const response = await fetch('/api/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = (await response.json()) as TopUpBalanceResponse;

    if (data.success && parseFloat(data.amountMinted) > 0) {
      // Record successful top-up
      recordTopUp();

      const formattedAmount = (
        parseFloat(data.amountMinted) /
        10 ** USDC_DECIMALS
      ).toLocaleString();
      showSuccessToast(
        `Thanks for dropping by! We've topped up your wallet with ${formattedAmount} FREEDOM, game on!`
      );
    } else if (data.success && parseFloat(data.amountMinted) === 0) {
      // Still count as a successful top-up attempt for today
      recordTopUp();
    } else if (!data.success) {
      if (response.status === 429) {
        // Rate limit hit from server side, but no need to record locally
        // as server already tracks this
      } else {
        console.error('failed to top up USDC with non-429 error', response.status, data);
      }
    }

    return data;
  } catch (error) {
    console.error('Error topping up balance:', error);
    return {
      success: false,
      amountMinted: '0',
      error: 'Failed to top up balance. Please try again later.',
    };
  }
};
