// Remove the module augmentations
// The augmentations at the top of the file should be removed entirely

import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  type TokenAmount,
  Transaction,
  VersionedTransaction,
  clusterApiUrl,
} from '@solana/web3.js';
import { BETTING_POOLS_SEED, type TrumpFun } from '@trump-fun/common';
import { default as solanaIdl } from '@trump-fun/common/src/types/__generated__/trump_fun.json';

import type { SolanaChainConfig } from './config';
// Import from the new location

/**
 * Get the balance of a token for a specific wallet
 */
export async function getSolanaTokenBalance(
  connection: Connection,
  walletPublicKey: PublicKey,
  tokenMintAddress: PublicKey
): Promise<TokenAmount | undefined> {
  try {
    // Find the associated token account address
    const associatedTokenAccountAddress = await getAssociatedTokenAddress(
      tokenMintAddress,
      walletPublicKey
    );

    // Fetch the balance
    const balanceResponse = await connection.getTokenAccountBalance(associatedTokenAccountAddress);

    return balanceResponse.value;
  } catch (error) {
    console.warn('Could not fetch token balance, likely ATA does not exist:', error);
    return undefined;
  }
}

/**
 * Create a Keypair from a private key string (Uint8Array JSON string)
 */
export function keypairFromUint8ArrayString(privateKeyString: string): Keypair {
  if (!privateKeyString) {
    throw new Error('Missing private key');
  }

  // Parse private key
  let privateKeyArray: number[];
  try {
    privateKeyArray = JSON.parse(privateKeyString);
    if (!Array.isArray(privateKeyArray) || !privateKeyArray.every(num => typeof num === 'number')) {
      throw new Error('Invalid private key format');
    }
  } catch (error) {
    throw new Error(
      `Failed to parse private key: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
}

export interface SolanaClientConfig {
  rpcUrl?: string;
  cluster?: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
  programId: PublicKey;
}

export interface SolanaClientResult {
  provider: AnchorProvider;
  program: Program<TrumpFun>;
  payer: Keypair;
  connection: Connection;
  bettingPoolsPDA: PublicKey;
}

/**
 * Get a Solana client from the chain configuration
 */
export function getSolanaClientFromConfig(chainConfig: SolanaChainConfig): SolanaClientResult {
  return getSolanaClient({
    privateKeyString: chainConfig.privateKey,
    config: {
      rpcUrl: chainConfig.rpcUrl,
      cluster: chainConfig.cluster,
      programId: chainConfig.programId,
    },
  });
}

/**
 * Initialize an Anchor client for Solana interaction
 */
export function getSolanaClient({
  privateKeyString,
  config,
}: {
  privateKeyString: string;
  config: SolanaClientConfig;
}): SolanaClientResult {
  // Create keypair from the private key
  const { cluster, rpcUrl, programId } = config;
  const payer = keypairFromUint8ArrayString(privateKeyString);

  // Setup connection based on cluster or custom RPC URL
  let connection: Connection;
  if (rpcUrl) {
    connection = new Connection(rpcUrl, 'confirmed');
  } else if (cluster) {
    let endpoint = '';
    if (cluster === 'localnet') {
      endpoint = 'http://localhost:8899';
    } else if (cluster === 'mainnet-beta') {
      endpoint = 'https://api.mainnet-beta.solana.com';
    } else {
      endpoint = clusterApiUrl(cluster);
    }
    connection = new Connection(endpoint, 'confirmed');
  } else {
    // Default to devnet
    connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  }

  // Create a wallet adapter that uses the provided keypair
  const wallet = {
    publicKey: payer.publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      if (tx instanceof Transaction) {
        tx.partialSign(payer);
      }
      return tx;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> => {
      return txs.map(tx => {
        if (tx instanceof Transaction) {
          tx.partialSign(payer);
        }
        return tx;
      });
    },
  };

  // Create the provider - using type assertion to resolve version conflicts
  // @ts-ignore - This ignores the type incompatibility between different versions of @solana/web3.js
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

  // @ts-ignore - This ignores the type incompatibility with the IDL
  const program = new Program<TrumpFun>(solanaIdl, provider);
  const [bettingPoolsPDA] = findBettingPoolsPDA(programId);

  return {
    provider,
    program,
    payer,
    connection,
    bettingPoolsPDA,
  };
}
/**
 * Find the betting pools PDA address
 */
export function findBettingPoolsPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([BETTING_POOLS_SEED], programId);
}
