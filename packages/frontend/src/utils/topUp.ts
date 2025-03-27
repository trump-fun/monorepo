import { USDC_DECIMALS } from '@/consts';
import { showSuccessToast } from './toast';
import { TopUpBalanceParams, TopUpBalanceResponse } from '@/app/api/mint/route';

export const topUpBalance = async (params: TopUpBalanceParams): Promise<TopUpBalanceResponse> => {
  const response = await fetch('/api/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = (await response.json()) as TopUpBalanceResponse;
  if (data.success && parseFloat(data.amountMinted) > 0) {
    const formattedAmount = (parseFloat(data.amountMinted) / 10 ** USDC_DECIMALS).toLocaleString();
    showSuccessToast(
      `Thanks for dropping by! We've topped up your wallet with ${formattedAmount} POINTS, game on!`
    );
  } else if (data.success && parseFloat(data.amountMinted) === 0) {
  } else if (!data.success) {
    if (response.status === 429) {
    } else {
      console.error('failed to top up USDC with non-429 error', response.status, data);
    }
  }
  return data;
};
