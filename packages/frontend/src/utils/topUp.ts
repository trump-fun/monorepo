/*
Locally stores if we've topped up already to avoid spamming the api/mint endpoint.
api/mint itself won't mint more than one per day per user, but this route will spam unless there's a rate limit in it.
*/
import { showSuccessToast } from './toast';

// For Solana, we need to specify the cluster in the top-up params
interface SolanaTopUpBalanceParams {
  walletAddress: string;
  cluster?: string; // 'devnet', 'testnet', or 'mainnet-beta'
}

interface SolanaTopUpBalanceResponse {
  success: boolean;
  signature?: string;
  amountMinted: string; // Amount as string to handle large numbers
  error?: string;
  message?: string;
}

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

export const topUpBalance = async (
  params: SolanaTopUpBalanceParams
): Promise<SolanaTopUpBalanceResponse> => {
  // Check if user is eligible for daily top-up
  console.log('Checking if user can top up...');
  console.log(canTopUp());
  if (!canTopUp()) {
    return {
      success: false,
      amountMinted: '0',
      message: 'You can only top up once per day (UTC). Try again tomorrow!',
    };
  }

  try {
    // Use the Solana-specific mint endpoint
    const response = await fetch('/api/solana/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        cluster: params.cluster || 'devnet', // Default to devnet if not specified
      }),
    });

    const data = (await response.json()) as SolanaTopUpBalanceResponse;

    if (data.success && parseFloat(data.amountMinted) > 0) {
      // Record successful top-up
      recordTopUp();

      const formattedAmount = parseFloat(data.amountMinted).toLocaleString();

      showSuccessToast(
        `Thanks for dropping by! We've topped up your wallet with ${formattedAmount} FREEDOM, game on!`,
        data.signature ? `Transaction: ${data.signature.slice(0, 8)}...` : undefined
      );
    } else if (data.success && parseFloat(data.amountMinted) === 0) {
      // Still count as a successful top-up attempt for today
      recordTopUp();
    } else if (!data.success) {
      if (response.status === 429) {
        // Rate limit hit from server side
      } else {
        console.error('failed to top up FREEDOM token with error', response.status, data);
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
