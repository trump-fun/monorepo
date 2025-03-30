import { Pool } from '@trump-fun/common';

export const calculateBettors = (pool: Pool) => {
  if (!pool) return 0;

  // If we have bet data, use real data from smart contract
  if (pool?.bets && pool?.bets?.length > 0) {
    // Create a Set to track unique addresses
    const uniqueAddresses = new Set();

    // Add each bettor's address to the Set
    pool?.bets?.forEach(bet => {
      if (bet.user) {
        uniqueAddresses.add(bet.user);
      }
    });

    // Return the size of the Set, which is the number of unique addresses
    return uniqueAddresses.size;
  }

  // If no bets data, show 0 bettors
  return 0;
};
