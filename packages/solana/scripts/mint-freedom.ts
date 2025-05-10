import * as anchor from '@coral-xyz/anchor';
import { getAccount, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
// Load environment variables
import 'dotenv/config';

const BTP_MINT_ADDRESS = 'HtkQKcrrfcspBSWbo63dPVQe9C8ZTPAHJebSAPyAgC2h';
const TOKEN_DECIMALS = 6;

/**
 * Simple script to mint more BTP tokens to a specified address
 * Usage: ts-node mint-more-btp.ts <recipient_address> <amount>
 * Example: ts-node mint-more-btp.ts 7v91N7iZ9mNTBXVSjnP8wVzYQfSmH6ugFfQHW3X9jCZZ 1000
 */

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: ts-node mint-more-btp.ts <recipient_address> <amount>');
    process.exit(1);
  }

  const recipientAddressStr = args[0];
  const amountToMint = parseFloat(args[1]);

  // Validate arguments
  if (!anchor.web3.PublicKey.isOnCurve(recipientAddressStr)) {
    console.error('Error: Invalid Solana address format');
    process.exit(1);
  }

  if (isNaN(amountToMint) || amountToMint <= 0) {
    console.error('Error: Amount must be a positive number');
    process.exit(1);
  }

  console.log('Minting BTP tokens...');
  console.log(`Recipient: ${recipientAddressStr}`);
  console.log(`Amount: ${amountToMint} BTP`);

  // Configure Anchor provider with environment variables
  // This automatically uses the ANCHOR_WALLET or SOLANA_KEYPAIR env var
  // You can also specify a custom env file with: require('dotenv').config({ path: '.env.project1' })
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;

  // Log which keypair is being used
  console.log(`Using wallet: ${provider.wallet.publicKey.toString()}`);
  console.log(`Network: ${process.env.SOLANA_NETWORK || 'localnet'}`);

  try {
    // Convert recipient address string to PublicKey
    const recipientAddress = new anchor.web3.PublicKey(recipientAddressStr);

    // Convert mint address string to PublicKey
    const mintAddress = new anchor.web3.PublicKey(BTP_MINT_ADDRESS);

    // Get or create the token account for the recipient
    console.log('Getting or creating associated token account for recipient...');
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      provider.wallet.payer,
      mintAddress,
      recipientAddress
    );
    console.log(`Token account: ${recipientTokenAccount.address.toString()}`);

    // Calculate amount to mint with decimals
    const amountInSmallestUnits = amountToMint * Math.pow(10, TOKEN_DECIMALS);

    // Mint tokens to the recipient
    console.log(`Minting ${amountToMint} BTP to recipient...`);
    await mintTo(
      connection,
      provider.wallet.payer,
      mintAddress,
      recipientTokenAccount.address,
      provider.wallet.publicKey, // authority - must be the mint authority
      BigInt(Math.floor(amountInSmallestUnits))
    );

    // Verify the new token balance
    const tokenAccountInfo = await getAccount(connection, recipientTokenAccount.address);
    console.log(
      `New token balance: ${Number(tokenAccountInfo.amount) / Math.pow(10, TOKEN_DECIMALS)} BTP`
    );

    console.log('Minting completed successfully!');
  } catch (error) {
    console.error('Error minting tokens:', error);
    process.exit(1);
  }
}

main().then(
  () => process.exit(0),
  err => {
    console.error(err);
    process.exit(1);
  }
);
