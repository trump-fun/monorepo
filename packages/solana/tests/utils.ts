import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

import { TrumpFun } from '../target/types/trump_fun';

// Constants
export const BETTING_POOLS_SEED = Buffer.from('betting_pools_v1');
export const POOL_SEED = Buffer.from('pool_v1');
export const BET_SEED = Buffer.from('bet_v1');
export const TOKEN_DECIMALS = 6;

// TokenType helpers for Anchor's enum representation
export const TokenType = {
  Usdc: { usdc: {} },
  Points: { points: {} },
} as const;

// Convert a token amount to lamports (internal representation)
export function tokensToLamports(tokens: number): number {
  return tokens * Math.pow(10, TOKEN_DECIMALS);
}

// Convert lamports to tokens (for display)
export function lamportsToTokens(lamports: number): number {
  return lamports / Math.pow(10, TOKEN_DECIMALS);
}

// Utility function to create a betting pool
export async function createBettingPool(
  program: Program<TrumpFun>,
  bettingPoolsAddress: anchor.web3.PublicKey,
  authority: anchor.web3.PublicKey,
  params: {
    question: string;
    options: string[];
    betsCloseAt?: anchor.BN;
    original_truth_social_post_id?: string;
    image_url?: string;
  }
): Promise<{
  poolAddress: anchor.web3.PublicKey;
  poolId: anchor.BN;
  tx: string;
}> {
  // Get the current state to get the next pool ID
  const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsAddress);
  const poolId = bettingPoolsState.nextPoolId;

  // Calculate the pool address
  const [poolAddress] = anchor.web3.PublicKey.findProgramAddressSync(
    [POOL_SEED, poolId.toBuffer('le', 8)],
    program.programId
  );

  // Default values
  const betsCloseAt = params.betsCloseAt || new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 24 hours from now
  const original_truth_social_post_id = params.original_truth_social_post_id || '';
  const image_url = params.image_url || 'https://example.com/image.jpg';

  // Create the pool
  const tx = await program.methods
    .createPool(
      params.question,
      params.options,
      betsCloseAt,
      original_truth_social_post_id,
      image_url
    )
    .accounts({
      bettingPools: bettingPoolsAddress,
      pool: poolAddress,
      authority: authority,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  return { poolAddress, poolId, tx };
}

// Helper function to create a user with funded tokens
export async function createFundedUser(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair,
  tokenMint: anchor.web3.PublicKey,
  tokenAmount: number // Amount in tokens (will be converted to lamports)
): Promise<{
  user: anchor.web3.Keypair;
  tokenAccount: anchor.web3.PublicKey;
  initialSolBalance: number;
}> {
  // Convert tokens to lamports
  const tokenLamports = tokensToLamports(tokenAmount);

  // Create a new keypair for the user
  const user = anchor.web3.Keypair.generate();

  // Fund the user with SOL
  const solAmount = 0.11 * anchor.web3.LAMPORTS_PER_SOL;

  // Transfer SOL from the payer/authority account to the user
  const transferIx = anchor.web3.SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: user.publicKey,
    lamports: solAmount,
  });

  const tx = new anchor.web3.Transaction().add(transferIx);
  const latestBlockhash = await connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction({
    signature: sig,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });
  console.log(
    `Transferred ${solAmount / anchor.web3.LAMPORTS_PER_SOL} SOL from authority to user ${user.publicKey.toString()}`
  );

  // Get the associated token account address for this user
  const associatedTokenAddress = await getAssociatedTokenAddress(tokenMint, user.publicKey);

  // Create the token account for the user
  try {
    const createAccountIx = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      associatedTokenAddress,
      user.publicKey,
      tokenMint
    );

    const tx = new anchor.web3.Transaction().add(createAccountIx);
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = payer.publicKey;
    tx.sign(payer);
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({
      signature: sig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    console.log(`Created token account for user: ${associatedTokenAddress.toString()}`);
  } catch (e) {
    console.log('Token account may already exist:', e);
  }

  // Mint tokens to the user
  try {
    const mintIx = createMintToInstruction(
      tokenMint,
      associatedTokenAddress,
      payer.publicKey,
      tokenLamports
    );

    const tx = new anchor.web3.Transaction().add(mintIx);
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = payer.publicKey;
    tx.sign(payer);
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({
      signature: sig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    console.log(`Minted ${tokenAmount} tokens to user`);

    // Verify the balance
    const accountInfo = await getAccount(connection, associatedTokenAddress);
    console.log(`Token account balance verified: ${accountInfo.amount.toString()}`);
  } catch (e) {
    console.error('Error minting tokens:', e);
    throw e;
  }

  // Store the initial SOL balance to know how much was transferred
  const userSolBalance = await connection.getBalance(user.publicKey);

  return {
    user,
    tokenAccount: associatedTokenAddress,
    initialSolBalance: userSolBalance,
  };
}
