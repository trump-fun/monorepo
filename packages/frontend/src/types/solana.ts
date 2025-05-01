import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

/**
 * Enum for media types in Solana program representation
 */
export enum MediaType {
  None = 'none',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Gif = 'gif',
  Article = 'article',
  Pdf = 'pdf',
}

/**
 * Pool status in Solana program representation
 */
export enum SolanaPoolStatus {
  Open = 'open',
  Closed = 'closed',
  Resolved = 'resolved',
  Cancelled = 'cancelled',
}

/**
 * Interface for Solana bet data
 */
export interface SolanaBetData {
  user: PublicKey;
  amount: BN;
  option: number;
  timestamp: BN;
  tokenType: { freedom: {} } | { usdc: {} };
}

/**
 * Interface for Solana pool data
 */
export interface SolanaPoolData {
  id: BN;
  creator: PublicKey;
  authority: PublicKey;
  question: string;
  options: string[];
  betsCloseAt: BN;
  createdAt: BN;
  resolvedAt: BN | null;
  winningOption: number | null;
  status: SolanaPoolStatus;
  mediaUrl: string;
  mediaType: MediaType;
  category: string;
  creatorName: string;
  creatorId: string;
  closureCriteria: string;
  closureInstructions: string;
}

/**
 * Interface for Solana token accounts
 */
export interface SolanaTokenAccount {
  mint: PublicKey;
  owner: PublicKey;
  amount: BN;
  delegate: PublicKey | null;
  delegatedAmount: BN;
}

/**
 * Interface for Solana token balance
 */
export interface SolanaTokenBalance {
  raw: BN;
  decimals: number;
  ui: number;
  uiFormatted: string;
}

/**
 * Interface for a user's data in the Solana program
 */
export interface SolanaUserData {
  wallet: PublicKey;
  freedomBalance: BN;
  usdcBalance: BN;
  bets: Array<{
    poolId: BN;
    option: number;
    amount: BN;
    tokenType: { freedom: {} } | { usdc: {} };
  }>;
}

/**
 * Solana connection configuration
 */
export interface SolanaConnectionConfig {
  endpoint: string;
  cluster: 'devnet' | 'testnet' | 'mainnet-beta';
  commitment: 'processed' | 'confirmed' | 'finalized';
}
