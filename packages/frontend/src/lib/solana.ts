'use client';

import { PublicKey } from '@solana/web3.js';
import { BETTING_POOLS_SEED, POOL_SEED } from '@trump-fun/common';

/**
 * Finds a token account by owner and mint
 * @param connection - Solana connection
 * @param owner - Public key of token owner
 * @param mint - Public key of token mint
 * @returns Promise with token account public key or null if not found
 */
export async function findTokenAccountByOwner(
  connection: any,
  owner: string | undefined,
  mint: string | undefined
) {
  if (!owner || !mint) {
    return null;
  }

  try {
    const { value } = await connection.getTokenAccountsByOwner(new PublicKey(owner), {
      mint: new PublicKey(mint),
    });

    return value.length > 0 ? value[0].pubkey : null;
  } catch (error) {
    console.error('Error finding token account:', error);
    return null;
  }
}

/**
 * Utility function to find the betting pools PDA address
 * @param programId - The program ID to derive the PDA from
 * @returns The PDA for the betting pools account
 */
export function findBettingPoolsPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([BETTING_POOLS_SEED], programId);
}

/**
 * Utility function to find a pool's PDA address
 * @param poolId - The numeric pool ID
 * @param programId - The program ID to derive the PDA from
 * @returns The PDA for the specific pool
 */
export function findPoolPDA(poolId: number, programId: PublicKey): [PublicKey, number] {
  const poolIdBuffer = Buffer.alloc(8);
  poolIdBuffer.writeBigUInt64LE(BigInt(poolId));

  return PublicKey.findProgramAddressSync([POOL_SEED, poolIdBuffer], programId);
}
