import { ethers } from 'ethers';
import { privy, createPrivyWallet } from '../lib/privy';
import { supabase } from '../lib/supabase';
import config from '../config';
import type { Context } from 'grammy';
import { TokenType } from '@/types';

/**
 * Representation of a user's wallet
 */
export interface WalletResult {
  address: string;
  chainType: string;
  wallet: any;
  isNewWallet: boolean;
}

/**
 * Gets a user's wallet, creating one if it doesn't exist
 * @param telegramId The user's Telegram ID
 * @param ctx Bot context for replying with status
 * @returns Wallet information or null if error
 */
export async function getWallet(telegramId: number, ctx?: Context): Promise<WalletResult | null> {
  try {
    // Check if user already has a wallet in the database
    const { data: walletData, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('tg_id', telegramId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching wallet:', error);
      return null;
    }

    let wallet: any;
    let address: string = '';
    let isNewWallet = false;

    if (walletData && walletData.wallet_id) {
      try {
        wallet = await privy.walletApi.getWallet({
          id: walletData.wallet_id,
        });

        if (wallet) {
          return {
            address: wallet.address,
            chainType: 'base sepolia',
            wallet,
            isNewWallet: false,
          };
        }
      } catch (privyError) {
        console.error('Error retrieving wallet from Privy:', privyError);
        // If wallet retrieval fails, we'll create a new one below
      }
    }

    // Create a new wallet if none exists or retrieval failed
    if (ctx) await ctx.reply('Creating a new wallet for you. This may take a moment...');

    try {
      // Create user ID for Privy
      const userId = `telegram-${telegramId}`;

      // Create wallet in Privy
      const result = await createPrivyWallet(userId);

      if (!result) {
        throw new Error('Failed to create wallet');
      }

      wallet = result;
      address = result.address;
      isNewWallet = true;

      // Store the new wallet in Supabase
      await supabase.from('wallets').insert([
        {
          tg_id: telegramId,
          eth_address: address.toLowerCase(),
          wallet_id: wallet.id,
          created_at: new Date().toISOString(),
        },
      ]);

      return {
        address,
        chainType: 'base sepolia',
        wallet,
        isNewWallet,
      };
    } catch (createError) {
      console.error('Error creating wallet:', createError);
      if (ctx) await ctx.reply('❌ Failed to create wallet. Please try again later.');
      return null;
    }
  } catch (error) {
    console.error('Error in getWallet:', error);
    return null;
  }
}

/**
 * Check the balance of a token for a wallet address
 * @param address The wallet address
 * @param tokenType Optional token type - defaults to FREEDOM token
 * @returns The token balance as a number
 */
export async function checkTokenBalance(
  address: string,
  tokenType: TokenType = TokenType.Freedom
): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(config.chain.rpcUrl);
    const tokenAddress =
      tokenType === TokenType.Usdc ? config.chain.usdcAddress : config.chain.freedomAddress;

    const tokenInterface = new ethers.Interface([
      'function balanceOf(address account) external view returns (uint256)',
    ]);

    const contract = new ethers.Contract(tokenAddress, tokenInterface, provider);

    if (!contract || !contract.balanceOf) {
      throw new Error('Invalid contract interface');
    }

    const balanceWei = await contract.balanceOf(address);

    // Use formatUnits to get a correctly formatted balance
    // This is safer than using toDecimal which might have different assumptions
    const decimals = tokenType === TokenType.Usdc ? 6 : 6; // Both tokens use 6 decimals in our case
    const balance = parseFloat(ethers.formatUnits(balanceWei, decimals));
    return balance;
  } catch (error) {
    console.error('Error checking token balance:', error);
    return 0;
  }
}

/**
 * Check the balance of a token for a wallet address using the token address
 * @param address The wallet address
 * @param tokenAddress The token contract address
 * @returns The token balance as a number
 */
export async function checkTokenBalanceByAddress(
  address: string,
  tokenAddress: string
): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(config.chain.rpcUrl);

    // Determine decimals based on token address
    const decimals = tokenAddress.toLowerCase() === config.chain.usdcAddress.toLowerCase() ? 6 : 6;

    const tokenInterface = new ethers.Interface([
      'function balanceOf(address account) external view returns (uint256)',
    ]);

    const contract = new ethers.Contract(tokenAddress, tokenInterface, provider);

    if (!contract || !contract.balanceOf) {
      throw new Error('Invalid contract interface');
    }

    const balanceWei = await contract.balanceOf(address);

    // Use ethers.js formatUnits directly which is more reliable
    const balance = parseFloat(ethers.formatUnits(balanceWei, decimals));

    return balance;
  } catch (error) {
    console.error('Error checking token balance by address:', error);
    return 0;
  }
}

/**
 * Helper to create a transaction with appropriate gas settings
 * @param from Sender address
 * @param to Recipient address
 * @param data Transaction data
 * @param value Transaction value in wei
 * @returns Prepared transaction object
 */
export async function createTransaction(
  from: string,
  to: string,
  data: string,
  value: string = '0x0'
): Promise<any> {
  const provider = new ethers.JsonRpcProvider(config.chain.rpcUrl);

  const maxFeePerGas = '0x' + ethers.parseUnits('1.5', 'gwei').toString(16);
  const maxPriorityFeePerGas = '0x' + ethers.parseUnits('1.5', 'gwei').toString(16);
  const nonce = await provider.getTransactionCount(from);

  return {
    from: from as `0x${string}`,
    to: to as `0x${string}`,
    data: data as `0x${string}`,
    value: value as `0x${string}`,
    gasLimit: '0x100000' as `0x${string}`,
    maxFeePerGas: maxFeePerGas as `0x${string}`,
    maxPriorityFeePerGas: maxPriorityFeePerGas as `0x${string}`,
    nonce,
    chainId: config.chain.id,
  };
}

/**
 * Send a transaction through Privy
 * @param walletId Privy wallet ID
 * @param transaction Transaction object
 * @returns Transaction result
 */
export async function sendTransaction(walletId: string, transaction: any): Promise<any> {
  return privy.walletApi.ethereum.sendTransaction({
    walletId,
    transaction,
    caip2: `eip155:${config.chain.id}`,
  });
}

/**
 * Check the native ETH balance for a wallet address
 * @param address The wallet address
 * @returns The ETH balance as a number
 */
export async function checkEthBalance(address: string): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(config.chain.rpcUrl);
    const balanceWei = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(balanceWei));
  } catch (error) {
    console.error('Error checking ETH balance:', error);
    return 0;
  }
}

/**
 * Check all balances for a wallet address in parallel
 * @param address The wallet address
 * @returns Object containing ETH, FREEDOM, and USDC balances
 */
export async function checkAllBalances(
  address: string
): Promise<{ eth: number; freedom: number; usdc: number }> {
  try {
    // Using both address-based and type-based methods to ensure we get accurate balances
    const [eth, freedom, usdc] = await Promise.all([
      checkEthBalance(address),
      checkTokenBalanceByAddress(address, config.chain.freedomAddress),
      checkTokenBalanceByAddress(address, config.chain.usdcAddress),
    ]);

    return { eth, freedom, usdc };
  } catch (error) {
    console.error('Error checking all balances:', error);
    return { eth: 0, freedom: 0, usdc: 0 };
  }
}
