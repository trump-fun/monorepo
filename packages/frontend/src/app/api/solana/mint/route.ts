import * as anchor from '@coral-xyz/anchor';
import {
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { NextRequest, NextResponse } from 'next/server';

// Environment variables for Solana configuration
const FREEDOM_TOKEN_MINT =
  process.env.NEXT_PUBLIC_SOLANA_FREEDOM_MINT || 'F1dQHEE2ZDnXzYb6znLY8TwHLdxgkgcUSwCuJmo8Fcp5';
const FAUCET_PRIVATE_KEY = process.env.SOLANA_FAUCET_PRIVATE_KEY || '';

// Define the response type
export interface SolanaMintResponse {
  success: boolean;
  amountMinted: string;
  signature?: string;
  error?: string;
  message?: string;
}

// Define the request parameters type
export interface SolanaMintParams {
  walletAddress: string;
  cluster?: string;
}

// Get the connection for a given cluster
function getConnection(cluster: string = 'devnet') {
  const endpoint =
    cluster === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : cluster === 'testnet'
        ? 'https://api.testnet.solana.com'
        : 'https://api.devnet.solana.com';

  return new Connection(endpoint, 'confirmed');
}

export async function POST(request: NextRequest): Promise<NextResponse<SolanaMintResponse>> {
  try {
    // Parse request body
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
    } catch (error) {
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

    // Parse the Freedom token mint address
    const freedomMint = new PublicKey(FREEDOM_TOKEN_MINT);

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
    } catch (error) {
      // ATA doesn't exist
      ataExists = false;
    }

    // Build the transaction
    const transaction = new anchor.web3.Transaction();

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

    // Sign and send the transaction
    const signature = await anchor.web3.sendAndConfirmTransaction(connection, transaction, [
      faucetKeyPair,
    ]);

    // Return success response
    return NextResponse.json({
      success: true,
      amountMinted: mintAmount.toString(),
      signature,
    });
  } catch (error: any) {
    console.error('Error minting tokens:', error);

    return NextResponse.json(
      {
        success: false,
        amountMinted: '0',
        error: error.message || 'Failed to mint tokens',
      },
      { status: 500 }
    );
  }
}
