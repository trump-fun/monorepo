// Export Subgraph schema types
export * from './subgraph/generated/schema';

// Types specific to the Solana substream
export type PoolStatus = 'None' | 'Pending' | 'Graded' | 'Regraded';
export type TokenType = 'USDC' | 'Freedom';
export type BetOutcome = 'None' | 'Won' | 'Lost' | 'Voided' | 'Draw';
export type MediaType =
  | 'X'
  | 'TikTok'
  | 'Instagram'
  | 'Facebook'
  | 'Image'
  | 'Video'
  | 'ExternalLink';
