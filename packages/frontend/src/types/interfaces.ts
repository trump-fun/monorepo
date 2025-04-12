import React from 'react';

export interface UserStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  totalVolume: number;
  activeVolume: number;
  winRate: string;
  avgBetSize: string;
}

export interface WithdrawalData {
  // UI form-related properties
  formattedWithdrawableBalance?: number;
  withdrawAmount?: number;
  setWithdrawAmount?: React.Dispatch<React.SetStateAction<number>>;
  handleWithdraw?: () => Promise<void>;
  isPending?: boolean;

  // GraphQL response properties
  id: string;
  blockTimestamp: string | number;
  bet?: {
    amount: string;
    tokenType: number;
    pool?: {
      question?: string;
    };
  };
}
