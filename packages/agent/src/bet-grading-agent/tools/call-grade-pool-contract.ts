import { bettingContractAbi } from '@trump-fun/common';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { EvmChainConfig } from '../../config';
import { config } from '../../config';
import type { GraderState, PendingPool } from '../betting-grader-graph';
/**
 * Updates the smart contract with the grading results for all non-failed pools sequentially
 */
export async function callGradePoolContract(state: GraderState): Promise<Partial<GraderState>> {
  console.log('Updating contract with grading results sequentially on EVM chain...');

  const { chainId } = state;
  if (!chainId) {
    throw new Error('Chain ID must be set');
  }

  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig) {
    console.error(`Chain config not found for chain ID: ${chainId}`);
    return { pendingPools: {} };
  }

  // Check that we're on an EVM chain
  if (chainConfig.chainType !== 'evm') {
    throw new Error("Chain is not EVM, you shouldn't be here");
  }

  const evmChainConfig = chainConfig as EvmChainConfig;
  const pendingPools = state.pendingPools;
  if (Object.keys(pendingPools).length === 0) {
    console.error('No pending pools to update contract for');
    return { pendingPools: {} };
  }

  try {
    // Set up viem clients
    const account = privateKeyToAccount(evmChainConfig.privateKey);

    const publicClient = createPublicClient({
      chain: evmChainConfig.chain,
      transport: http(evmChainConfig.rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: evmChainConfig.chain,
      transport: http(evmChainConfig.rpcUrl),
    });

    // Process each pool sequentially
    const updatedPools: Record<string, PendingPool> = {};

    for (const [poolId, pendingPool] of Object.entries(pendingPools)) {
      // Skip pools that have failed or don't have valid grading
      if (pendingPool.failed || !pendingPool.gradingResult) {
        updatedPools[poolId] = pendingPool;
        continue;
      }

      const { result_code } = pendingPool.gradingResult;

      // Only process pools that have a valid result_code and are not "not ready to grade" or "error"
      if (result_code !== 0 && result_code !== 4) {
        console.log(`Updating pool ${poolId} with result ${result_code}`);

        try {
          // Call the contract's gradeBet function
          const hash = await walletClient.writeContract({
            address: evmChainConfig.contractAddress,
            abi: bettingContractAbi,
            functionName: 'gradeBet',
            args: [BigInt(poolId), BigInt(result_code)],
            // gas: BigInt(3000000),
          });

          // Wait for the transaction to be confirmed
          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          });

          console.log(`Grading pool transaction successful with hash: ${hash}, receipt:`, receipt);

          // Store result in updatedPools
          updatedPools[poolId] = {
            ...pendingPool,
            contractUpdated: true,
            txHash: hash,
          };
        } catch (error) {
          console.error(`Error calling gradeBet contract for pool ${poolId}: ${error}`);

          // Store failure in updatedPools
          updatedPools[poolId] = {
            ...pendingPool,
            failed: true,
          };
        }
      } else {
        console.log(`Skipping pool ${poolId} - not ready to grade or error (code: ${result_code})`);
        updatedPools[poolId] = pendingPool;
      }
    }

    return { pendingPools: updatedPools };
  } catch (error) {
    console.error(`Error in callGradePoolContract: ${error}`);

    // Mark all pools as failed due to error
    const updatedPools: Record<string, PendingPool> = {};
    for (const [poolId, pool] of Object.entries(pendingPools)) {
      updatedPools[poolId] = {
        ...pool,
        failed: true,
      };
    }

    return { pendingPools: updatedPools };
  }
}
