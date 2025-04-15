import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Create a single instance of the Supabase client with better error handling
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
};

export const supabase = createClient(config.supabase.url, config.supabase.key, supabaseOptions);

/**
 * Get a wallet address by Telegram user ID
 * @param telegramId The Telegram user ID
 * @returns The wallet address or null if not found
 */
export async function getWalletByTelegramId(telegramId: number): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('telegram_wallets')
      .select('wallet_address')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (error) {
      console.error('Error fetching wallet by Telegram ID:', error);
      return null;
    }

    return data?.wallet_address || null;
  } catch (error) {
    console.error('Exception fetching wallet by Telegram ID:', error);
    return null;
  }
}

/**
 * Store a wallet address for a Telegram user
 * @param telegramId The Telegram user ID
 * @param walletAddress The wallet address to store
 * @returns True if successful, false otherwise
 */
export async function storeWalletForTelegramUser(
  telegramId: number,
  walletAddress: string,
  walletId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('telegram_wallets').upsert(
      {
        telegram_id: telegramId.toString(),
        wallet_address: walletAddress,
        wallet_id: walletId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'telegram_id',
      }
    );

    if (error) {
      console.error('Error storing wallet for Telegram user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception storing wallet for Telegram user:', error);
    return false;
  }
}

/**
 * Get user settings by Telegram user ID
 * @param telegramId The Telegram user ID
 * @returns The user settings or default settings if not found
 */
export async function getUserSettings(telegramId: number): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from('telegram_user_settings')
      .select('settings')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        // Not PGRST116 (not found)
        console.error('Error fetching user settings:', error);
      }
      return {}; // Return empty object as default settings
    }

    return data?.settings || {};
  } catch (error) {
    console.error('Exception fetching user settings:', error);
    return {};
  }
}

/**
 * Store user settings for a Telegram user
 * @param telegramId The Telegram user ID
 * @param settings The settings to store
 * @returns True if successful, false otherwise
 */
export async function storeUserSettings(
  telegramId: number,
  settings: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase.from('telegram_user_settings').upsert(
      {
        telegram_id: telegramId.toString(),
        settings,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'telegram_id',
      }
    );

    if (error) {
      console.error('Error storing user settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception storing user settings:', error);
    return false;
  }
}
