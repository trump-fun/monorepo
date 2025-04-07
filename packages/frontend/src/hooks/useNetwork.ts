'use client';

import { CHAIN_CONFIG, DEFAULT_CHAIN_ID, SupportedChainIds } from '@trump-fun/common/';
import { useCallback, useState } from 'react';
import { arbitrumSepolia, base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import { useChainId, useSwitchChain } from 'wagmi';

/**
 * Network information for a specific chain
 */
export interface NetworkInfo {
  id: number;
  name: string;
  color: string;
  isSupported: boolean;

  //Below come from the CHAIN_CONFIG, added as fields for convenience
  usdcAddress: `0x${string}`;
  freedomAddress: `0x${string}`;
  appAddress: `0x${string}`;
}

/**
 * Custom hook for handling network information and chain switching
 */
export const useNetwork = () => {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isHovering, setIsHovering] = useState(false);

  // Check if the current chainId is a supported chain ID
  const isSupportedChain = Object.keys(CHAIN_CONFIG).includes(chainId.toString());
  if (!isSupportedChain) {
    console.error(
      `User is on an unsupported chain (${chainId.toString()}), using the default network: `,
      DEFAULT_CHAIN_ID
    );
  }

  // Get network data using viem's chain objects
  const getNetworkInfo = useCallback((id: number): NetworkInfo => {
    // Check if chain is supported in CHAIN_CONFIG
    const isSupported = Object.keys(CHAIN_CONFIG).includes(id.toString());

    // Get the appropriate chain config based on the provided id
    // If not supported, fall back to default chain config
    const configForChain = isSupported
      ? CHAIN_CONFIG[id as SupportedChainIds]
      : CHAIN_CONFIG[DEFAULT_CHAIN_ID as SupportedChainIds];

    // Check for known chains
    if (id === baseSepolia.id) {
      return {
        id,
        name: 'Base Sepolia',
        color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
        isSupported: true,
        ...configForChain,
      };
    } else if (id === base.id) {
      return {
        id,
        name: 'Base',
        color: 'bg-orange-600/10 text-orange-600 hover:bg-orange-600/20',
        isSupported: false,
        ...configForChain,
      };
    } else if (id === arbitrumSepolia.id) {
      return {
        id,
        name: 'Arbitrum Sepolia',
        color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
        isSupported: true,
        ...configForChain,
      };
    } else if (id === sepolia.id) {
      return {
        id,
        name: 'Sepolia',
        color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
        isSupported: false,
        ...configForChain,
      };
    } else if (id === mainnet.id) {
      return {
        id,
        name: 'Ethereum',
        color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
        isSupported: false,
        ...configForChain,
      };
    }

    // Default for unknown chains
    return {
      id,
      name: `Chain ${id}`,
      color: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
      isSupported: false,
      ...CHAIN_CONFIG[DEFAULT_CHAIN_ID as SupportedChainIds], //Return chain config for default chain so app can still render
    };
  }, []);

  // Get the current network info
  const networkInfo = getNetworkInfo(chainId);

  // Handle network switching
  const handleSwitchNetwork = useCallback(
    (targetChainId: number) => {
      try {
        switchChain({ chainId: targetChainId });
      } catch (error) {
        console.error('Error switching network:', error);
      }
    },
    [switchChain]
  );

  // Check if current network is supported
  const isNetworkSupported = networkInfo.isSupported;

  return {
    chainId,
    networkInfo,
    isNetworkSupported,
    supportedNetworks: {
      base,
      baseSepolia,
      arbitrumSepolia,
      mainnet,
      sepolia,
    },
    usdcAddress: networkInfo.usdcAddress,
    pointsAddress: networkInfo.freedomAddress,
    appAddress: networkInfo.appAddress,
    switchNetwork: handleSwitchNetwork,
    isSwitchingNetwork: isPending,
    isHovering,
    setIsHovering,
  };
};
