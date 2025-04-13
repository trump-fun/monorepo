/**
 * Contract Interface
 * 
 * Centralized utility for interacting with blockchain contracts.
 * Handles common operations across different agents:
 * - Contract reads and writes
 * - Transaction management
 * - Gas estimation
 * - Error handling
 */

import type { BettingChainConfig } from '../../config';
import { config, DEFAULT_CHAIN_ID } from '../../config';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import BettingContractABI from '../../types/BettingContract.json';

// Track pending transactions
const pendingTransactions = new Map<string, {
  chainId: number;
  timestamp: number;
  functionName: string;
  args: any[];
}>();

/**
 * Creates a public client for reading from the blockchain
 */
export function createPublicContractClient(chainId = DEFAULT_CHAIN_ID) {
  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig) {
    throw new Error(`Chain configuration not found for chainId: ${chainId}`);
  }
  
  return createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });
}

/**
 * Creates a wallet client for writing to the blockchain
 */
export function createWalletContractClient(chainId = DEFAULT_CHAIN_ID) {
  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig) {
    throw new Error(`Chain configuration not found for chainId: ${chainId}`);
  }
  
  const account = privateKeyToAccount(chainConfig.privateKey);
  
  return createWalletClient({
    account,
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });
}

/**
 * Utility to check transaction status
 */
export async function checkTransactionStatus(txHash: string, chainId = DEFAULT_CHAIN_ID) {
  const publicClient = createPublicContractClient(chainId);
  
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 60_000,
    });
    
    return {
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error(`Error checking transaction status for ${txHash}:`, error);
    return { status: 'error', error };
  }
}

/**
 * Creates a new betting pool on the contract
 */
export async function createBettingPool(
  params: {
    title: string;
    description: string;
    imageUrl?: string;
    expirationTimestamp: bigint;
    options: string[];
  },
  chainId = DEFAULT_CHAIN_ID
): Promise<{ 
  transactionHash: string; 
  poolId?: string;
  error?: string;
}> {
  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig) {
    throw new Error(`Chain configuration not found for chainId: ${chainId}`);
  }
  
  console.log(`Creating betting pool: ${params.title}`);
  
  try {
    const publicClient = createPublicContractClient(chainId);
    const walletClient = createWalletContractClient(chainId);
    
    const { title, description, imageUrl, expirationTimestamp, options } = params;
    
    // Prepare arguments for contract call
    const args = [
      title,
      description,
      imageUrl || '',
      expirationTimestamp,
      options,
    ];
    
    // Estimate gas for the transaction
    const gasEstimate = await publicClient.estimateContractGas({
      address: chainConfig.contractAddress,
      abi: BettingContractABI,
      functionName: 'createBettingPool',
      args,
      account: walletClient.account?.address,
    });
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100);
    
    // Send the transaction
    const hash = await walletClient.writeContract({
      address: chainConfig.contractAddress,
      abi: BettingContractABI,
      functionName: 'createBettingPool',
      args,
      gas: gasLimit,
    });
    
    console.log(`Transaction hash: ${hash}`);
    
    // Track the pending transaction
    pendingTransactions.set(hash, {
      chainId,
      timestamp: Date.now(),
      functionName: 'createBettingPool',
      args,
    });
    
    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 90_000,
    });
    
    if (receipt.status === 'success') {
      console.log(`Transaction confirmed. Receipt:`, receipt);
      
      // Try to extract the pool ID from logs
      let poolId: string | undefined;
      try {
        // Parse contract logs to extract the pool ID
        const events = receipt.logs.map(log => {
          try {
            return publicClient.decodeEventLog({
              abi: BettingContractABI,
              data: log.data,
              topics: log.topics,
            });
          } catch {
            return null;
          }
        }).filter(Boolean);
        
        // Find the BettingPoolCreated event
        const createEvent = events.find(event => event?.eventName === 'BettingPoolCreated');
        if (createEvent && createEvent.args) {
          poolId = createEvent.args.poolId?.toString();
        }
      } catch (logError) {
        console.error('Error extracting pool ID from logs:', logError);
      }
      
      return {
        transactionHash: hash,
        poolId,
      };
    } else {
      console.error(`Transaction failed. Receipt:`, receipt);
      return {
        transactionHash: hash,
        error: 'Transaction failed',
      };
    }
  } catch (error: any) {
    console.error('Error creating betting pool:', error);
    return {
      transactionHash: '',
      error: error.message,
    };
  }
}

/**
 * Grades a betting pool on the contract
 */
export async function gradeBettingPool(
  poolId: string,
  winningOptionIndex: number,
  chainId = DEFAULT_CHAIN_ID
): Promise<{ 
  transactionHash: string; 
  success: boolean;
  error?: string;
}> {
  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig) {
    throw new Error(`Chain configuration not found for chainId: ${chainId}`);
  }
  
  console.log(`Grading betting pool ${poolId} with winning option index ${winningOptionIndex}`);
  
  try {
    const publicClient = createPublicContractClient(chainId);
    const walletClient = createWalletContractClient(chainId);
    
    // Prepare arguments for contract call
    const args = [BigInt(poolId), BigInt(winningOptionIndex)];
    
    // Estimate gas for the transaction
    const gasEstimate = await publicClient.estimateContractGas({
      address: chainConfig.contractAddress,
      abi: BettingContractABI,
      functionName: 'gradePool',
      args,
      account: walletClient.account?.address,
    });
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100);
    
    // Send the transaction
    const hash = await walletClient.writeContract({
      address: chainConfig.contractAddress,
      abi: BettingContractABI,
      functionName: 'gradePool',
      args,
      gas: gasLimit,
    });
    
    console.log(`Transaction hash: ${hash}`);
    
    // Track the pending transaction
    pendingTransactions.set(hash, {
      chainId,
      timestamp: Date.now(),
      functionName: 'gradePool',
      args,
    });
    
    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 90_000,
    });
    
    if (receipt.status === 'success') {
      console.log(`Transaction confirmed. Receipt:`, receipt);
      return {
        transactionHash: hash,
        success: true,
      };
    } else {
      console.error(`Transaction failed. Receipt:`, receipt);
      return {
        transactionHash: hash,
        success: false,
        error: 'Transaction failed',
      };
    }
  } catch (error: any) {
    console.error('Error grading betting pool:', error);
    return {
      transactionHash: '',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetches a betting pool from the contract
 */
export async function getBettingPool(
  poolId: string,
  chainId = DEFAULT_CHAIN_ID
): Promise<any> {
  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig) {
    throw new Error(`Chain configuration not found for chainId: ${chainId}`);
  }
  
  try {
    const publicClient = createPublicContractClient(chainId);
    
    // Call the contract to get the pool
    const pool = await publicClient.readContract({
      address: chainConfig.contractAddress,
      abi: BettingContractABI,
      functionName: 'getBettingPool',
      args: [BigInt(poolId)],
    });
    
    return pool;
  } catch (error) {
    console.error(`Error fetching betting pool ${poolId}:`, error);
    throw error;
  }
}

/**
 * Gets all pending betting pools (not yet graded)
 */
export async function getPendingPools(
  chainId = DEFAULT_CHAIN_ID
): Promise<any[]> {
  try {
    // Query the subgraph for pending pools
    const response = await fetch(
      config.chainConfig[chainId].subgraphUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.chainConfig[chainId].subgraphApiKey,
        },
        body: JSON.stringify({
          query: `
            query {
              bettingPools(
                where: { 
                  graded: false,
                  expirationTimestamp_lt: "${Math.floor(Date.now() / 1000)}"
                }
                orderBy: expirationTimestamp
                orderDirection: asc
              ) {
                id
                creator
                title
                description
                imageUrl
                createdTimestamp
                expirationTimestamp
                graded
                optionCount
                options {
                  id
                  index
                  text
                }
              }
            }
          `,
        }),
      }
    );
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('Subgraph query errors:', data.errors);
      throw new Error(data.errors[0].message);
    }
    
    return data.data.bettingPools;
  } catch (error) {
    console.error('Error fetching pending pools:', error);
    throw error;
  }
}

/**
 * Gets information about pending transactions
 */
export function getPendingTransactions() {
  // Clean up old transactions (older than 1 day)
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  for (const [hash, data] of pendingTransactions.entries()) {
    if (now - data.timestamp > oneDay) {
      pendingTransactions.delete(hash);
    }
  }
  
  return Array.from(pendingTransactions.entries()).map(([hash, data]) => ({
    hash,
    ...data,
    age: Math.floor((now - data.timestamp) / 1000),
  }));
}
