import { PoolStatus } from '@trump-fun/common';
// Using GraphQL generated types as the source of truth
export interface BetData {
  id: string;
  user: string;
  amount: string;
  option: string;
  updatedAt?: string;
  tokenType: string;
}

export interface PostData {
  post?: {
    image_url: string;
  };
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

export interface Comment {
  id: string;
  content: string;
  author: {
    address: string;
    name?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}
