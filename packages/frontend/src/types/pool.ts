import { PoolStatus } from './__generated__/graphql';
// Using GraphQL generated types as the source of truth
export interface BetData {
  id: string;
  user: string;
  amount: string;
  option: string;
  updatedAt?: string;
  tokenType: string;
}

export interface TokenBalance {
  value: string | bigint;
  decimals: number;
  formatted?: string;
  symbol?: string;
}

export interface PoolData {
  id: string;
  question: string;
  options: string[];
  status: PoolStatus;
  createdAt: string;
  endDate?: string;
  uniqueUsers: number;
  originalTruthSocialPostId?: string;
  bets: BetData[];
  totalAmount: string;
  totalAmountPoints: string;
}
