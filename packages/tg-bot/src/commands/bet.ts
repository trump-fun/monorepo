import {
  CHAIN_CONFIG,
  formatTokenAmount,
  USDC_DECIMALS,
  PoolStatus,
  TokenType,
  getTokenName as getCommonTokenName,
} from '@trump-fun/common';
import { bettingContractAbi } from '@trump-fun/common/abi/contract.types';
import { ethers } from 'ethers';
import { InlineKeyboard } from 'grammy';
import type { Context } from 'grammy';
import { checkTokenBalance, getWallet, sendTransaction, createTransaction } from '@/utils/wallet';
import { getExplorerLink } from '@/utils/format';
import { formatPoolMessage } from '@/utils/messages';
import { apolloClient } from '@/lib/apolloClient';
import { GET_POOLS, GET_POOL } from '../../queries';

// Define BetTokenType enum to match contract expectation for betting
enum BetTokenType {
  USDC = 0,
  FREEDOM = 1,
}

// Map from BetTokenType to common TokenType
function mapToTokenType(betTokenType: BetTokenType): TokenType {
  return betTokenType === BetTokenType.USDC ? TokenType.Usdc : TokenType.Freedom;
}

// Use chain configuration from common package
const APP_ADDRESS = CHAIN_CONFIG[84532].appAddress;
const USDC_ADDRESS = CHAIN_CONFIG[84532].usdcAddress as `0x${string}`;
const POINTS_ADDRESS = CHAIN_CONFIG[84532].freedomAddress as `0x${string}`;

// Betting process steps
enum BettingStep {
  SELECT_POOL = 'select_pool',
  SELECT_OPTION = 'select_option',
  SELECT_TOKEN = 'select_token',
  ENTER_AMOUNT = 'enter_amount',
  CONFIRM = 'confirm',
}

// Helper function to get token name for display
function getTokenName(tokenType: BetTokenType): string {
  return getCommonTokenName(mapToTokenType(tokenType));
}

// Helper function to get token address
function getTokenAddress(tokenType: BetTokenType): `0x${string}` {
  return tokenType === BetTokenType.USDC ? USDC_ADDRESS : POINTS_ADDRESS;
}

// Helper function to get token decimals from common package
function getTokenDecimals(tokenType: BetTokenType): number {
  return tokenType === BetTokenType.USDC ? USDC_DECIMALS : 6; // Use constant from common package
}

/**
 * Handle the /bet command
 * @param ctx The command context
 */
export const placeBetCommand = async (ctx: Context) => {
  if (!ctx.from) {
    return ctx.reply('❌ User not found.');
  }

  try {
    // Get or create the user's wallet
    const wallet = await getWallet(ctx.from.id, ctx);
    if (!wallet) {
      return ctx.reply(
        '❌ No wallet found. Creating one for you now...\n\n' +
          'Please use /wallet to view your new wallet once created.'
      );
    }

    const params = ctx.message?.text?.split(' ').filter(Boolean) || [];

    // Handle command with different parameter counts
    if (params.length === 1) {
      // No parameters - start interactive betting flow
      return await showAvailablePools(ctx, wallet.address);
    } else if (params.length >= 4) {
      // All parameters provided - direct bet placement
      return await processBetWithParams(ctx, wallet, params);
    } else {
      // Insufficient parameters
      return ctx.reply(
        '🔢 <b>Betting Parameters Required</b>\n\n' +
          'Use the following format to place a bet directly:\n' +
          '<code>/bet &lt;poolId&gt; &lt;option&gt; &lt;amount&gt; &lt;tokenType&gt;</code>\n\n' +
          'Example: <code>/bet 42 1 100 0</code>\n\n' +
          'Or just type <code>/bet</code> to start the guided betting process.',
        { parse_mode: 'HTML' }
      );
    }
  } catch (error) {
    console.error('Error in bet command:', error);
    return ctx.reply('❌ An unexpected error occurred. Please try again later.');
  }
};

/**
 * Process a bet with provided parameters
 * @param ctx The command context
 * @param wallet The user's wallet
 * @param params The command parameters
 */
export async function processBetWithParams(
  ctx: Context,
  wallet: any,
  params: Array<string>
): Promise<any> {
  try {
    const [_, poolId, selectedOption, amount, tokenType = '0'] = params;
    const amountValue = parseFloat(amount || '0');
    // This tokenTypeValue is used in the function arguments later
    const rawTokenTypeValue = parseInt(tokenType || '0');
    if (!poolId || !selectedOption || !amount) {
      return ctx.reply('❌ Invalid bet parameters.');
    }

    const optionIndex = parseInt(selectedOption) - 1; // Convert from 1-based to 0-based

    // Validate inputs
    if (isNaN(amountValue) || amountValue <= 0) {
      return ctx.reply('❌ Invalid amount. Please enter a positive number.');
    }

    if (optionIndex < 0) {
      return ctx.reply('❌ Option index must be at least 1.');
    }

    // Get pool details to validate option index and show more info
    try {
      const { data } = await apolloClient.query({
        query: GET_POOL,
        variables: { poolId },
      });

      if (!data.pool) {
        return ctx.reply(`❌ Pool with ID ${poolId || 'unknown'} not found.`);
      }

      const pool = data.pool;

      // Verify pool is active
      if (pool.status !== PoolStatus.Pending) {
        return ctx.reply(`❌ Pool is ${pool.status} and not accepting bets.

Only pools with PENDING status are open for betting.`);
      }

      // Verify option exists
      if (optionIndex >= pool.options.length) {
        return ctx.reply(
          `❌ Invalid option selected. Pool only has ${pool.options.length} options.\n\n` +
            `Available options:\n${pool.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n')}`
        );
      }
    } catch (error) {
      console.error('Error fetching pool details:', error);
      // Continue with bet placement even if pool details can't be fetched
    }

    // Determine which token to use (default to FREEDOM if not specified)
    const selectedTokenType = rawTokenTypeValue === 0 ? BetTokenType.USDC : BetTokenType.FREEDOM;
    const tokenName = getTokenName(selectedTokenType);

    // Check user balance for the selected token
    const balance = await checkTokenBalance(wallet.address, mapToTokenType(selectedTokenType));

    if (balance < amountValue) {
      const keyboard = new InlineKeyboard()
        .text('🏦 Check Wallet', 'wallet_cmd')
        .text('🔎 Browse Pools', 'pools_cmd');

      return ctx.reply(
        `❌ Insufficient funds!\n\n` +
          `Your ${tokenName} balance: ${balance.toFixed(2)} $${tokenName}\n` +
          `Required: ${amountValue.toFixed(2)} $${tokenName}\n\n` +
          `Please deposit funds to your wallet first.`,
        { reply_markup: keyboard }
      );
    }

    // Start transaction process with status updates
    const statusMsg = await ctx.reply(
      `🔄 <b>Processing Your Bet</b>\n\n` +
        `Pool ID: ${poolId}\n` +
        `Option: ${selectedOption}\n` +
        `Amount: ${amount} ${tokenName}\n` +
        `Token Type: ${tokenName}\n` +
        `Current balance: ${balance.toFixed(2)} ${tokenName}`,
      { parse_mode: 'HTML' }
    );

    if (!ctx.chat?.id) {
      return ctx.reply('❌ Chat ID not found.');
    }

    // Step 1: Create token approval transaction
    const tokenInterface = new ethers.Interface([
      'function approve(address spender, uint256 amount) external returns (bool)',
    ]);

    const tokenAddress = getTokenAddress(selectedTokenType);
    const tokenDecimals = getTokenDecimals(selectedTokenType);

    const approveData = tokenInterface.encodeFunctionData('approve', [
      APP_ADDRESS,
      ethers.parseUnits(amount || '0', tokenDecimals),
    ]);

    // Create approval transaction
    const approveTransaction = await createTransaction(wallet.address, tokenAddress, approveData);

    // Update status
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      '🔐 <b>Step 1/2: Approving Token Spending</b>\n\nPlease wait while your transaction is being processed...',
      { parse_mode: 'HTML' }
    );

    // Send approval transaction
    const approveResult = await sendTransaction(wallet.wallet.id, approveTransaction);

    // Update status for step 2
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `✅ <b>Approval Complete!</b>\n` +
        `Transaction: <a href="${getExplorerLink(approveResult.hash)}">View on Explorer</a>\n\n` +
        `🔄 <b>Step 2/2: Placing Your Bet...</b>`,
      { parse_mode: 'HTML' }
    );

    // Wait briefly for the approval to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Create bet transaction
    const bettingInterface = new ethers.Interface(bettingContractAbi);

    // Convert amount to BigInt with correct decimals
    const tokenAmount = BigInt(parseFloat(amount) * 10 ** tokenDecimals);

    const args = [
      BigInt(poolId || '0'),
      BigInt(optionIndex),
      tokenAmount, // Use BigInt directly instead of string
      wallet.address,
      BigInt(selectedTokenType), // Use the proper TokenType enum value
    ];

    const betData = bettingInterface.encodeFunctionData('placeBet', args);

    // Create betting transaction with updated nonce
    const betTransaction = await createTransaction(wallet.address, APP_ADDRESS, betData);

    // Send bet transaction
    const betResult = await sendTransaction(wallet.wallet.id, betTransaction);

    // Calculate new balance
    const newBalance = balance - amountValue;

    // Create keyboard for navigation
    const keyboard = new InlineKeyboard()
      .text('📊 My Bets', 'bets_cmd')
      .text('🔎 More Pools', 'pools_cmd');

    // Final success message
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `🎉 <b>Bet Placed Successfully!</b>\n\n` +
        `Pool ID: ${poolId}\n` +
        `Option: ${selectedOption}\n` +
        `Amount: ${amount} FREEDOM\n` +
        `New Balance: ${newBalance.toFixed(2)} FREEDOM\n\n` +
        `<a href="${getExplorerLink(betResult.hash)}">View Transaction</a>`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    );

    return true;
  } catch (error) {
    console.error('Error placing bet:', error);
    let errorMessage = '❌ Failed to place bet.';

    if (error instanceof Error) {
      const errorText = error.message.substring(0, 100);
      errorMessage += `\n\n${errorText}${errorText.length >= 100 ? '...' : ''}`;
    }

    // Create keyboard for recovery options
    const keyboard = new InlineKeyboard()
      .text('💰 Check Wallet', 'wallet_cmd')
      .text('🔄 Try Again', 'bet_cmd');

    return ctx.reply(errorMessage, { reply_markup: keyboard });
  }
}

/**
 * Show available betting pools to the user
 * @param ctx The command context
 * @param userAddress The user's wallet address
 */
async function showAvailablePools(ctx: Context, userAddress: string): Promise<any> {
  try {
    // First show a loading message
    const loadingMsg = await ctx.reply('🔍 Fetching available pools...');

    // Get user balance for FREEDOM token
    const balance = await checkTokenBalance(userAddress, TokenType.Freedom);

    // Fetch active pools
    const { data } = await apolloClient.query({
      query: GET_POOLS,
      variables: {
        filter: { status: PoolStatus.Pending },
        orderBy: 'betsCloseAt',
        orderDirection: 'asc',
        first: 5,
      },
    });

    if (!ctx.chat?.id) {
      return ctx.reply('❌ Chat ID not found.');
    }

    if (!data.pools || data.pools.length === 0) {
      await ctx.api.deleteMessage(ctx.chat.id, loadingMsg.message_id);
      const keyboard = new InlineKeyboard().text('🔍 View All Pools', 'view_pools');
      return ctx.reply(
        '❌ No active pools available for betting at the moment. Please check back later or view all pools to find other interesting predictions.',
        { reply_markup: keyboard }
      );
    }

    // Create keyboard with pool options
    const keyboard = new InlineKeyboard();
    data.pools.forEach((pool: any, index: number) => {
      if (index < 5) {
        // Limit to 5 buttons
        keyboard.text(
          `${index + 1}. ${pool.question.substring(0, 20)}...`,
          `bet_pool_${pool.poolId}`
        );
        if (index % 2 === 1 || index === data.pools.length - 1) keyboard.row();
      }
    });

    // Add navigation buttons
    keyboard.text('🔍 All Pools', 'pools_cmd').text('💰 Wallet', 'wallet_cmd');

    // Replace loading message with pools list
    await ctx.api.deleteMessage(ctx.chat.id, loadingMsg.message_id);
    return ctx.reply(
      `🎲 <b>Place a Bet</b>\n\n` +
        `💰 Balance: ${balance.toLocaleString()} FREEDOM\n\n` +
        `Select a prediction pool below or use:\n` +
        '<code>/bet &lt;poolId&gt; &lt;option&gt; &lt;amount&gt; &lt;tokenType&gt;</code>\n\n' +
        `Available Pools:`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error('Error showing available pools:', error);
    return ctx.reply('❌ Failed to fetch pools. Please try again later.');
  }
}

/**
 * Handle a callback query for a specific pool selection
 * @param ctx The callback context
 */
export async function handleBetPoolSelection(ctx: any): Promise<any> {
  try {
    await ctx.answerCallbackQuery();

    // Extract pool ID from callback data (format: bet_pool_123)
    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) return false;

    const poolId = callbackData.replace('bet_pool_', '');

    // Fetch pool details
    const { data } = await apolloClient.query({
      query: GET_POOL,
      variables: { poolId },
    });

    if (!data.pool) {
      return ctx.reply(`❌ Pool with ID ${poolId} not found or no longer available.`);
    }

    const pool = data.pool;

    // Verify pool is active
    if (pool.status !== PoolStatus.Pending) {
      const keyboard = new InlineKeyboard().text('🔙 Back to Pools', 'view_pools');
      return ctx.reply(
        `❌ This pool is ${pool.status} and not accepting bets.

Only pools with PENDING status are open for betting.`,
        { reply_markup: keyboard }
      );
    }

    // Format pool details message
    const poolMessage = formatPoolMessage(pool);

    // Create option selection keyboard
    const keyboard = new InlineKeyboard();

    // Add buttons for each option
    pool.options.forEach((option: string, index: number) => {
      keyboard.text(`${index + 1}. ${option}`, `bet_option_${poolId}_${index}`);
      if (index % 2 === 1 || index === pool.options.length - 1) keyboard.row();
    });

    // Add back button
    keyboard.text('⬅️ Back to Pools', 'bet_cmd');

    return ctx.reply(`${poolMessage}\n\n📌 <b>Select an option to bet on:</b>`, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error('Error in pool selection:', error);
    return ctx.reply('❌ An error occurred while loading pool details. Please try again.');
  }
}

/**
 * Handle a callback query for a specific option selection
 * @param ctx The callback context
 */
export async function handleBetOptionSelection(ctx: any): Promise<any> {
  try {
    await ctx.answerCallbackQuery();

    // Extract pool ID and option from callback data (format: bet_option_123_0)
    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) return false;

    const [_, __, poolId, optionIndex] = callbackData.split('_');

    // Get user info
    if (!ctx.from) {
      return ctx.reply('❌ User information not available.');
    }

    const wallet = await getWallet(ctx.from.id, ctx);
    if (!wallet) {
      return ctx.reply('❌ Wallet not found. Please set up your wallet first with /wallet.');
    }

    // Instead of going straight to amount selection, let's first choose the token type
    const keyboard = new InlineKeyboard()
      .text('💵 USDC', `bet_token_${poolId}_${optionIndex}_0`)
      .text('🔶 FREEDOM', `bet_token_${poolId}_${optionIndex}_1`)
      .row()
      .text('⬅️ Back to Pool', `bet_pool_${poolId}`);

    return ctx.reply(
      `🪙 <b>Select Token Type</b>\n\n` +
        `Pool ID: ${poolId}\n` +
        `Selected Option: ${parseInt(optionIndex) + 1}\n\n` +
        `Choose which token you'd like to bet with:`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error('Error in option selection:', error);
    return ctx.reply('❌ An error occurred. Please try again.');
  }
}

/**
 * Handle token type selection for a bet
 * @param ctx The context
 */
export async function handleTokenTypeSelection(ctx: any): Promise<any> {
  try {
    await ctx.answerCallbackQuery();

    // Extract data from callback (format: bet_token_123_0_1)
    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) return false;

    const [_, __, poolId, optionIndex, tokenTypeStr] = callbackData.split('_');
    const tokenType = parseInt(tokenTypeStr);
    const betTokenType = tokenType === 0 ? BetTokenType.USDC : BetTokenType.FREEDOM;
    const tokenName = tokenType === 0 ? 'USDC' : 'FREEDOM';

    // Get user info
    if (!ctx.from) {
      return ctx.reply('❌ User information not available.');
    }

    const wallet = await getWallet(ctx.from.id, ctx);
    if (!wallet) {
      return ctx.reply('❌ Wallet not found. Please set up your wallet first with /wallet.');
    }

    // Get balance for the selected token
    const balance = await checkTokenBalance(wallet.address, mapToTokenType(betTokenType));

    // Create amount input keyboard
    const amountOptions = [10, 50, 100, 200, 500];
    const keyboard = new InlineKeyboard();

    // Only show amounts the user can afford
    amountOptions.forEach((amount, index) => {
      if (amount <= balance) {
        keyboard.text(
          `${amount} ${tokenName}`,
          `bet_amount_${poolId}_${optionIndex}_${amount}_${tokenType}`
        );
        if (index % 3 === 2) keyboard.row();
      }
    });
    if (amountOptions.some(amount => amount <= balance)) keyboard.row();

    // Add custom amount option and back button
    keyboard.text('💰 Custom Amount', `bet_custom_${poolId}_${optionIndex}_${tokenType}`);
    keyboard.row().text('⬅️ Back to Token Selection', `bet_option_${poolId}_${optionIndex}`);

    return ctx.reply(
      `💵 <b>Select Bet Amount</b>\n\n` +
        `Pool ID: ${poolId}\n` +
        `Selected Option: ${parseInt(optionIndex) + 1}\n` +
        `Token: ${tokenName}\n` +
        `Your Balance: ${balance.toFixed(2)} ${tokenName}\n\n` +
        `Choose an amount or select 'Custom Amount':`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error('Error in token type selection:', error);
    return ctx.reply('❌ An error occurred. Please try again.');
  }
}
