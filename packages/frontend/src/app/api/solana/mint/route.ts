import * as anchor from '@coral-xyz/anchor';
import {
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { SOLANA_DEVNET_CONFIG } from '@trump-fun/common';
import bs58 from 'bs58';
import { NextRequest, NextResponse } from 'next/server';

const FAUCET_PRIVATE_KEY = process.env.SOLANA_FAUCET_PRIVATE_KEY || '';

export interface SolanaMintResponse {
  success: boolean;
  amountMinted: string;
  signature?: string;
  error?: string;
  message?: string;
}

export interface SolanaMintParams {
  walletAddress: string;
  cluster?: string;
}

function getConnection(cluster: string = 'devnet') {
  const endpoint =
    cluster === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : cluster === 'devnet'
        ? SOLANA_DEVNET_CONFIG.rpcUrl
        : 'http://localhost:8899';

  return new Connection(endpoint, 'confirmed');
}

export async function POST(request: NextRequest): Promise<NextResponse<SolanaMintResponse>> {
  try {
    const { walletAddress, cluster = 'devnet' } = (await request.json()) as SolanaMintParams;

    // Validation
    if (!walletAddress || !walletAddress.trim()) {
      return NextResponse.json(
        {
          success: false,
          amountMinted: '0',
          error: 'Wallet address is required',
        },
        { status: 400 }
      );
    }

    // Check if we have a faucet key
    if (!FAUCET_PRIVATE_KEY) {
      console.error('Missing SOLANA_FAUCET_PRIVATE_KEY environment variable');
      return NextResponse.json(
        {
          success: false,
          amountMinted: '0',
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    // Parse recipient wallet address
    let recipientPublicKey: PublicKey;
    try {
      recipientPublicKey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        {
          success: false,
          amountMinted: '0',
          error: 'Invalid wallet address',
        },
        { status: 400 }
      );
    }

    // Initialize connection and payer
    const connection = getConnection(cluster);

    // Create Keypair from private key
    const faucetKeyPair = Keypair.fromSecretKey(bs58.decode(FAUCET_PRIVATE_KEY));

    // Check recipient's SOL balance
    const recipientBalance = await connection.getBalance(recipientPublicKey);
    const minimumSolBalance = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL in lamports

    // Parse the Freedom token mint address
    const freedomMint = SOLANA_DEVNET_CONFIG.freedomMint;

    // Get mint info to determine decimals
    const mintInfo = await getMint(connection, freedomMint);
    const decimals = mintInfo.decimals;

    // Set the amount to mint (1000 tokens with proper decimal places)
    const mintAmount = 1000 * Math.pow(10, decimals);

    // Get the ATA for the recipient
    const recipientAta = getAssociatedTokenAddressSync(freedomMint, recipientPublicKey);

    // Check if the ATA exists
    let ataExists = false;
    try {
      const tokenAccount = await connection.getAccountInfo(recipientAta);
      ataExists = tokenAccount !== null;
    } catch {
      // ATA doesn't exist
      ataExists = false;
    }

    // Build the transaction
    const transaction = new anchor.web3.Transaction();

    // If recipient has less than minimum SOL, send them 0.001 SOL
    if (recipientBalance < minimumSolBalance) {
      console.log(
        `Recipient has low SOL balance (${recipientBalance / LAMPORTS_PER_SOL} SOL). Sending 0.001 SOL.`
      );
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: faucetKeyPair.publicKey,
          toPubkey: recipientPublicKey,
          lamports: minimumSolBalance,
        })
      );
    }

    // If ATA doesn't exist, add instruction to create it
    if (!ataExists) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          faucetKeyPair.publicKey,
          recipientAta,
          recipientPublicKey,
          freedomMint
        )
      );
    }

    // Add mint instruction
    transaction.add(
      createMintToCheckedInstruction(
        freedomMint,
        recipientAta,
        faucetKeyPair.publicKey,
        mintAmount,
        decimals
      )
    );

    // Recent blockhash for transaction
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = faucetKeyPair.publicKey;

    // @ts-expect-error connection type mismatch
    const signature = await anchor.web3.sendAndConfirmTransaction(connection, transaction, [
      faucetKeyPair,
    ]);

    // Return success response
    return NextResponse.json({
      success: true,
      amountMinted: mintAmount.toString(),
      signature,
    });
  } catch (error) {
    console.error('Error minting tokens:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to mint tokens';

    return NextResponse.json(
      {
        success: false,
        amountMinted: '0',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
