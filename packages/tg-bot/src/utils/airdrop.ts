import { ethers } from 'ethers';
import { supabase } from '../lib/supabase';
import config from '../config';
import { TokenType } from '@trump-fun/common';
import { checkTokenBalance } from './wallet';

// Constants for token airdrop
const RATE_LIMIT_HOURS = 6;
const RATE_LIMIT_MS = RATE_LIMIT_HOURS * 60 * 60 * 1000;
const NEW_USER_POINTS = 10000; // 10k tokens for new users
const RETURNING_USER_POINTS = 1000; // 1k tokens for returning users

interface AirdropResult {
  success: boolean;
  transactionHash?: string;
  amountMinted: number;
  rateLimitReset?: string;
  error?: string;
  message?: string;
}

/**
 * Check if user has hit rate limit for token airdrop
 * @param walletAddress The user's wallet address
 * @returns boolean indicating if user can receive tokens (true = can receive)
 */
export async function checkRateLimit(walletAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('trump_users')
      .select('id, last_login_bonus')
      .eq('id', walletAddress.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error);
      return true;
    }

    if (!data || !data.last_login_bonus) {
      return true;
    }

    const lastBonus = new Date(data.last_login_bonus);
    const timeSinceLastBonus = Date.now() - lastBonus.getTime();
    return timeSinceLastBonus > RATE_LIMIT_MS;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return true;
  }
}

/**
 * Set rate limit timestamp for user
 * @param walletAddress The user's wallet address
 */
export async function setRateLimit(walletAddress: string): Promise<void> {
  try {
    const { error } = await supabase.from('trump_users').upsert([
      {
        id: walletAddress.toLowerCase(),
        name: '',
        last_login_bonus: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Supabase error when setting rate limit:', error);
    }
  } catch (error) {
    console.error('Error setting rate limit:', error);
  }
}

/**
 * Check if user is new (never received tokens before)
 * @param walletAddress The user's wallet address 
 * @returns boolean indicating if user is new
 */
export async function isNewUser(walletAddress: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trump_users')
      .select('id')
      .eq('id', walletAddress.toLowerCase())
      .single();

    return error?.code === 'PGRST116';
  } catch (error) {
    console.error('Error checking if user is new:', error);
    return false;
  }
}

/**
 * Airdrop Freedom tokens to a user
 * @param walletAddress The user's wallet address
 * @returns Result of the airdrop operation
 */
export async function airdropTokens(walletAddress: string): Promise<AirdropResult> {
  try {
    // Check rate limit
    const isAllowed = await checkRateLimit(walletAddress);
    if (!isAllowed) {
      const resetTime = new Date(Date.now() + RATE_LIMIT_MS).toLocaleString();
      return {
        success: false,
        amountMinted: 0,
        rateLimitReset: resetTime,
        error: `You can only request FREEDOM once every ${RATE_LIMIT_HOURS} hours`,
      };
    }

    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(config.chain.rpcUrl);
    const privateKey = process.env.MINTER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Minter private key not configured');
    }

    // Get the token address from config
    const freedomAddress = config.chain.freedomAddress;

    // Create wallet and contract instance
    const wallet = new ethers.Wallet(privateKey, provider);
    // Define a proper interface for the contract to ensure TypeScript knows the methods
    const abiFragment = [
      'function mint(address to, uint256 amount) external',
      'function balanceOf(address account) external view returns (uint256)'
    ];
    const freedomContract = new ethers.Contract(freedomAddress, abiFragment, wallet);

    // Check user's current balance
    const currentBalance = await checkTokenBalance(walletAddress, TokenType.Freedom);

    // Determine amount to mint
    const userIsNew = await isNewUser(walletAddress);
    const targetAmount = userIsNew ? NEW_USER_POINTS : RETURNING_USER_POINTS;
    const amountToAdd = currentBalance < targetAmount ? targetAmount - currentBalance : 0;

    if (amountToAdd > 0) {
      // Convert to token units (with 6 decimals)
      const amountInWei = ethers.parseUnits(amountToAdd.toString(), 6);
      
      // Mint tokens - ensure the method exists before calling it
      if (!freedomContract.mint) {
        throw new Error('Contract mint function not available');
      }
      
      const tx = await freedomContract.mint(walletAddress, amountInWei);
      await setRateLimit(walletAddress);

      const resetTime = new Date(Date.now() + RATE_LIMIT_MS).toLocaleString();
      return {
        success: true,
        transactionHash: tx.hash,
        amountMinted: amountToAdd,
        rateLimitReset: resetTime,
      };
    } else {
      return {
        success: true,
        amountMinted: 0,
        message: 'No additional FREEDOM needed',
      };
    }
  } catch (error) {
    console.error('Error in airdropping tokens:', error);

    // Handle the case of transaction already known
    if (
      error instanceof Object &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('already known')
    ) {
      return {
        success: true,
        message: 'Transaction already submitted to the network',
        amountMinted: 0,
      };
    }

    return {
      success: false,
      amountMinted: 0,
      error: `Failed to mint Freedom tokens: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
