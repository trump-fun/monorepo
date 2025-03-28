import { createClient } from '@/lib/supabase/server';
import { POINTS_ADDRESS, POINTS_DECIMALS, erc20Abi } from '@trump-fun/common';
import { ethers } from 'ethers';
import { NextResponse } from 'next/server';

export type TopUpBalanceParams = {
  walletAddress: string;
};

export type TopUpBalanceResponse = {
  success: boolean;
  transactionHash?: string;
  amountMinted: string;
  rateLimitReset?: string;
  error?: string;
  message?: string;
};

const RATE_LIMIT_HOURS = 6;
const RATE_LIMIT_MS = RATE_LIMIT_HOURS * 60 * 60 * 1000;
const NEW_USER_POINTS = BigInt(10000) * BigInt(10) ** BigInt(POINTS_DECIMALS);
const RETURNING_USER_POINTS = BigInt(1000) * BigInt(10) ** BigInt(POINTS_DECIMALS);

const checkRateLimit = async (walletAddress: string): Promise<boolean> => {
  const supabase = await createClient();

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
};

const setRateLimit = async (walletAddress: string): Promise<void> => {
  const supabase = await createClient();

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
};

const isNewUser = async (walletAddress: string): Promise<boolean> => {
  const supabase = await createClient();

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
};

export async function POST(request: Request) {
  try {
    const body: TopUpBalanceParams = await request.json();
    const walletAddress = body.walletAddress;

    const isAllowed = await checkRateLimit(walletAddress);
    if (!isAllowed) {
      const resetTime = Math.floor(Date.now() / 1000) + RATE_LIMIT_HOURS * 60 * 60;
      return NextResponse.json<TopUpBalanceResponse>(
        {
          success: false,
          amountMinted: '0',
          rateLimitReset: resetTime.toLocaleString(),
          error: `You can only request POINTS once every ${RATE_LIMIT_HOURS} hours`,
        },
        { status: 429 }
      );
    }

    const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
    const privateKey = process.env.MINTER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Relayer private key not configured');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const pointsContract = new ethers.Contract(POINTS_ADDRESS, erc20Abi, wallet);
    const balance = await pointsContract.balanceOf(walletAddress);

    const userIsNew = await isNewUser(walletAddress);
    const targetAmount = userIsNew ? NEW_USER_POINTS : RETURNING_USER_POINTS;
    const amountToAdd = balance < targetAmount ? targetAmount - balance : BigInt(0);

    if (amountToAdd > 0) {
      const tx = await pointsContract.mint(walletAddress, amountToAdd);
      await setRateLimit(walletAddress);

      const resetTime = Math.floor(Date.now() / 1000) + RATE_LIMIT_HOURS * 60 * 60;
      return NextResponse.json<TopUpBalanceResponse>({
        success: true,
        transactionHash: tx.hash,
        amountMinted: amountToAdd.toString(),
        rateLimitReset: resetTime.toLocaleString(),
      });
    } else {
      return NextResponse.json<TopUpBalanceResponse>({
        success: true,
        amountMinted: '0',
        message: 'No additional POINTS needed for logged in user',
      });
    }
  } catch (error) {
    console.error('Error in minting points:', error);

    if (
      error instanceof Object &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('already known')
    ) {
      return NextResponse.json<TopUpBalanceResponse>({
        success: true,
        message: 'Transaction already submitted to the network',
        amountMinted: '0',
      });
    }

    return NextResponse.json<TopUpBalanceResponse>(
      {
        success: false,
        amountMinted: '0',
        error: `Failed to mint testnet points: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
