'use client';

import { useState } from 'react';

import { findBettingPoolsPDA, getMediaTypeAnchorFormat } from '@/lib/solana';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Toaster } from 'sonner';

import { useAnchorProvider } from '@/components/AnchorProvider';
import { useChainConfig } from '@/components/ChainConfigProvider';
import { useSolanaTransaction } from '@/hooks/useSolanaTransaction';
import { useWalletAddress } from '@/hooks/useWalletAddress';

export default function CreatePoolPage() {
  const { chainConfig, isLoading } = useChainConfig();
  const { program } = useAnchorProvider();
  const { publicKey, isConnected } = useWalletAddress();
  const { getConnection, signAndSend } = useSolanaTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    // Early checks for wallet connection and support
    if (!publicKey || !isConnected) {
      showErrorToast('Wallet not connected', 'Please connect your wallet first');
      return;
    }

    if (!chainConfig) {
      showErrorToast('Configuration error', 'Chain configuration not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!program) {
        showErrorToast('Program error', 'Program not initialized');
        return;
      }

      // Get connection to Solana
      const connection = getConnection();

      // Derive the betting pools PDA
      const [bettingPoolsPDA] = findBettingPoolsPDA(chainConfig.programId);

      // Get the next pool ID from the betting pools account
      const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsPDA);
      const poolId = bettingPoolsState.nextPoolId;
      console.debug('Betting pools state prior to createPool:', bettingPoolsState);

      // Calculate the pool address using the seed
      const [poolAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), poolId.toArrayLike(Buffer, 'le', 8)],
        chainConfig.programId
      );

      // Initialize the program
      const mediaType = getMediaTypeForUrl(values.mediaUrl);

      console.log(
        'Creating pool with accounts:',
        {
          bettingPools: bettingPoolsPDA.toString(),
          pool: poolAddress.toString(),
          authority: publicKey.toString(),
          programId: chainConfig.programId.toString(),
        },
        'and payload',
        values
      );

      // Create a transaction to invoke the createPool function
      const transaction = await program.methods
        .createPool(
          values.market, // question
          [values.optionA, values.optionB], // options
          new BN(Math.floor(values.closeTimestamp)), // bets_close_at as BN
          values.mediaUrl || '', // media_url
          getMediaTypeAnchorFormat(mediaType), // media_type in Anchor format
          'general', // category (stubbed)
          publicKey.toString(), // creator_name (using pubkey)
          publicKey.toString(), // creator_id (using pubkey)
          'infer the closure criteria from the question', // closure_criteria
          'Use X, news search, and/or web search to resolve this market' // closure_instructions
        )
        .accounts({
          bettingPools: bettingPoolsPDA,
          pool: poolAddress,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      console.log('Transaction', transaction);

      // Get blockhash and prepare transaction
      const { blockhash } = await connection.getLatestBlockhash();

      // Create a new transaction with the instructions from the Anchor transaction
      const txToSend = new Transaction();
      txToSend.add(...transaction.instructions);
      txToSend.recentBlockhash = blockhash;
      txToSend.feePayer = publicKey;

      // Send the transaction using our hook
      const result = await signAndSend(txToSend);

      if (!result) {
        throw new Error('Transaction failed to send');
      }

      const txSignature = result.signature;

      showSuccessToast(
        'Market created successfully',
        `Transaction ID: ${txSignature.substring(0, 8)}...${txSignature.substring(txSignature.length - 8)}`
      );

      console.log(
        `View createPool TX on explorer: https://solana.fm/tx/${txSignature}?cluster=${chainConfig.cluster}`
      );
    } catch (err) {
      console.error('Error creating market:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error creating market';
      showErrorToast('Error creating market', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto py-8'>
        <p>Loading chain configuration...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <CreateMarketForm onSubmit={handleSubmit} />
      <Toaster position='bottom-right' />
      {error && <p className='mt-4 text-red-500'>{error}</p>}
      {isSubmitting && (
        <p className='text-form-label mt-4'>
          Creating market... Please approve the transaction in your wallet.
        </p>
      )}
    </div>
  );
}
