import { Context as GrammyContext, type SessionFlavor } from 'grammy';
import { type ConversationFlavor } from '@grammyjs/conversations';

export interface SessionData {
  currentPool?: string;
  betOption?: number;
  betAmount?: number;
  walletAddress?: string;
  userStats?: {
    totalBets: number;
    activeBets: number;
    wonBets: number;
    lostBets: number;
    totalVolume: number;
  };
  lastAction?: number; // Timestamp for tracking user activity
}

export type BotContext = GrammyContext & SessionFlavor<SessionData> & ConversationFlavor;

export enum PoolFilterType {
  ACTIVE = 'active',
  TRENDING = 'trending',
  NEWEST = 'newest',
  HIGHEST_VOLUME = 'highest_volume',
  ENDING_SOON = 'ending_soon',
}

export enum BetFilterType {
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  ALL = 'all',
}

export interface PaginationState {
  offset: number;
  limit: number;
}

export interface UserWallet {
  address: string;
  chainType: string;
  wallet: any;
  isNewWallet: boolean;
}
