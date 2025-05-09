import * as anchor from '@coral-xyz/anchor';
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { assert, expect } from 'chai';
import * as fs from 'fs';
import { describe } from 'mocha';
import * as path from 'path';

// Network and Token Configuration
// Function to dynamically detect if we're on devnet based on the RPC endpoint
export function isDevnet(): boolean {
  // i mean, you can set the provider manually no
  // oh okay wait, use anchor.AnchorProvider.env();
  // `ANCHOR_PROVIDER_URL=something <the cmd>`
  // but there are other variables are as well iirc anchor provider related
  // so if you have to add them asw 
  // instead anchor test is better but woh 
  // scrso
  // keypair he
  // 
  // I know how to set endpoint manually, provider me kya daalu
  // wahi to use ho raha sob sob
  const provider = anchor.AnchorProvider.env();
  const endpoint = provider.connection.rpcEndpoint.toLowerCase();

  // Check if we're on a local network
  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    console.log('Detected localnet environment');
    return false;
  }

  // Check if we're on devnet
  if (endpoint.includes('devnet')) {
    console.log('Detected devnet environment');
    return true;
  }

  // Default to localnet if we can't determine
  console.log(`Could not determine network from endpoint: ${endpoint}, assuming localnet`);
  return false;
}

// Token Addresses
// For freedom token:
// - Set to null to deploy a new token on test run
// - Set to a specific address to use an existing token
export const DEVNET_FREEDOM_ADDRESS = null;
export const LOCALNET_FREEDOM_ADDRESS = null;

// USDC addresses
export const DEVNET_USDC_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Real USDC on devnet
export const LOCALNET_USDC_ADDRESS = null; // We'll create a mock USDC on localnet

// Constants for SPL token
const TOKEN_NAME = 'FREEDOM';
const TOKEN_SYMBOL = 'FREEDOM';
const TOKEN_DECIMALS = 6; // Match USDC decimals to make our lives easier
const TOKEN_INITIAL_SUPPLY = 1_000_000 * Math.pow(10, TOKEN_DECIMALS); // 1 million tokens

// Will be set once we determine the network
export let existingMintAddress: anchor.web3.PublicKey | null = null;

describe('create-token', () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  it('Creates an SPL token for FREEDOM', async () => {
    console.log('Using wallet:', provider.wallet.publicKey.toString());
    console.log('Using cluster:', provider.connection.rpcEndpoint);

    let mintAddress;

    try {
      if (existingMintAddress) {
        mintAddress = existingMintAddress;
        console.log(`Using existing token mint: ${mintAddress.toString()}`);

        // Verify the mint exists
        const mintInfo = await provider.connection.getAccountInfo(mintAddress);
        assert(mintInfo !== null, 'Mint account does not exist');
        console.log('Verified existing token mint:', mintAddress.toString());
      } else {
        // Create new token
        console.log(`Creating new SPL token: ${TOKEN_NAME} (${TOKEN_SYMBOL})`);
        console.log(`Decimals: ${TOKEN_DECIMALS}`);

        // Create the mint account
        mintAddress = await createMint(
          provider.connection,
          provider.wallet.payer, // payer
          provider.wallet.publicKey, // mint authority
          provider.wallet.publicKey, // freeze authority (you can use null for no freeze)
          TOKEN_DECIMALS
        );
        console.log('Token mint created:', mintAddress.toString());

        // Create associated token account for the wallet
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          provider.wallet.payer,
          mintAddress,
          provider.wallet.publicKey
        );
        console.log('Token account created:', tokenAccount.address.toString());

        // Mint initial supply to the wallet
        await mintTo(
          provider.connection,
          provider.wallet.payer,
          mintAddress,
          tokenAccount.address,
          provider.wallet.publicKey, // authority
          TOKEN_INITIAL_SUPPLY
        );
        console.log(
          `Minted ${TOKEN_INITIAL_SUPPLY / Math.pow(10, TOKEN_DECIMALS)} ${TOKEN_SYMBOL} to wallet`
        );

        // Verify the token account balance
        const tokenAccountInfo = await getAccount(provider.connection, tokenAccount.address);
        expect(tokenAccountInfo.amount.toString()).to.equal(TOKEN_INITIAL_SUPPLY.toString());

        // Store token info in global variable
        existingMintAddress = mintAddress;

        // Output token configuration for manual copy
        console.log('\n==== TOKEN CONFIGURATION ====\n');
        console.log(JSON.stringify({ mintAddress: mintAddress.toString() }, null, 2));
        console.log('\n============================\n');
        console.log('⚠️ Please copy this token configuration if needed for other tests');
      }

      // Return the token config for use in other tests
      return { mintAddress };
    } catch (error) {
      console.error('Error in token creation test:', error);
      throw error;
    }
  });
});

// Create a file to store the token mint address between test runs
const TOKEN_CONFIG_FILE = './token-config.json';

// Export function to be used by other tests
export async function getOrCreateFreedomMint(): Promise<anchor.web3.PublicKey> {
  const provider = anchor.AnchorProvider.env();

  // If we're on devnet and have a specified token address, use that
  if (isDevnet() && DEVNET_FREEDOM_ADDRESS) {
    const devnetMintAddress = new anchor.web3.PublicKey(DEVNET_FREEDOM_ADDRESS);
    console.log(`Using devnet token mint: ${devnetMintAddress.toString()}`);
    return devnetMintAddress;
  }

  // First check if we have a global mint address from this session
  if (existingMintAddress) {
    console.log(`Using existing token mint from memory: ${existingMintAddress.toString()}`);
    return existingMintAddress;
  }

  // For localnet, check if we have a stored token configuration or create a new one
  if (!isDevnet()) {
    // Check if we have a stored token configuration from previous runs
    try {
      if (fs.existsSync(TOKEN_CONFIG_FILE)) {
        const config = JSON.parse(fs.readFileSync(TOKEN_CONFIG_FILE, 'utf8'));
        if (config.mintAddress) {
          const storedMintAddress = new anchor.web3.PublicKey(config.mintAddress);

          // Verify the mint exists
          try {
            const mintInfo = await provider.connection.getAccountInfo(storedMintAddress);
            if (mintInfo !== null) {
              console.log(`Using existing token mint from file: ${storedMintAddress.toString()}`);
              existingMintAddress = storedMintAddress;
              return storedMintAddress;
            }
          } catch (e) {
            console.log(`Stored mint address is invalid, creating new one: ${e.message}`);
          }
        }
      }
    } catch (e) {
      console.log(`Error reading token config file: ${e.message}`);
    }

    // If not found or invalid, create a new token
    console.log(`Creating new SPL token: ${TOKEN_NAME} (${TOKEN_SYMBOL})`);

    // Create the mint account
    const mintAddress = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      TOKEN_DECIMALS
    );

    // Create associated token account for the wallet
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintAddress,
      provider.wallet.publicKey
    );

    // Mint initial supply to the wallet
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mintAddress,
      tokenAccount.address,
      provider.wallet.publicKey,
      TOKEN_INITIAL_SUPPLY
    );

    // Store the mint address in the global variable
    existingMintAddress = mintAddress;

    // Save the token configuration to a file for future test runs
    const config = { mintAddress: mintAddress.toString() };
    fs.writeFileSync(TOKEN_CONFIG_FILE, JSON.stringify(config, null, 2));
    const absolutePath = path.resolve(__dirname, TOKEN_CONFIG_FILE);
    console.log(`Wrote token configuration to ${absolutePath}`);
    // Output token configuration for manual copy
    console.log('\n==== TOKEN CONFIGURATION ====\n');
    console.log(JSON.stringify(config, null, 2));
    console.log('\n============================\n');
    console.log(
      `⚠️ Please copy this token configuration if needed for other tests, e.g. ${absolutePath}`
    );

    return mintAddress;
  }

  // This should never happen (for devnet we should have already returned)
  throw new Error('Unable to get or create FREEDOM token mint');
}

// Function to get USDC mint address (real on devnet, mock on localnet)
export async function getUsdcMint(): Promise<anchor.web3.PublicKey> {
  const provider = anchor.AnchorProvider.env();

  if (isDevnet()) {
    return new anchor.web3.PublicKey(DEVNET_USDC_ADDRESS);
  } else {
    // For localnet, create a mock USDC mint
    const mintAddress = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      TOKEN_DECIMALS
    );

    console.log(`Created mock USDC mint for localnet: ${mintAddress.toString()}`);
    return mintAddress;
  }
}
