import { togglePoolFacts } from '@/app/actions/pool-facts';
import { usePrivy, useSignMessage, useSolanaWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export function usePoolFacts(poolId: string, authenticated: boolean) {
  const [poolFacts, setPoolFacts] = useState<number>(5);
  const [hasFactsed, setHasFactsed] = useState<boolean>(false);
  const [isFactsProcessing, setIsFactsProcessing] = useState<boolean>(false);

  const { ready } = usePrivy();
  const { wallets } = useSolanaWallets();
  const { signMessage } = useSignMessage();

  // Fetch initial FACTS count and status
  useEffect(() => {
    const fetchInitialFacts = async () => {
      try {
        // First check localStorage for immediate display
        const localFacts = parseInt(localStorage.getItem(`pool_facts_${poolId}`) || '0', 10) || 5;
        const localHasFactsed = localStorage.getItem(`pool_facts_liked_${poolId}`) === 'true';

        setPoolFacts(localFacts);
        setHasFactsed(localHasFactsed);

        // Then try to fetch from server for more accurate data
        if (ready && poolId) {
          try {
            const walletAddress =
              wallets && wallets[0]?.address ? wallets[0].address.toLowerCase() : '';
            const res = await fetch(`/api/pool-facts?poolId=${poolId}&address=${walletAddress}`);

            if (res.ok) {
              const data = await res.json();

              if (typeof data.count === 'number') {
                setPoolFacts(Math.max(data.count, 5)); // Ensure at least 5 FACTS
                setHasFactsed(!!data.userLiked);

                localStorage.setItem(`pool_facts_${poolId}`, data.count.toString());
                localStorage.setItem(`pool_facts_liked_${poolId}`, data.userLiked.toString());
              }
            }
          } catch (error) {
            console.error('Error fetching FACTS data:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing FACTS data:', error);
      }
    };

    fetchInitialFacts();
  }, [poolId, wallets, ready, authenticated]);

  const handleFacts = async (isConnected: boolean, login: () => void) => {
    if (!isConnected) {
      login();
      return;
    }

    setIsFactsProcessing(true);

    try {
      const wallet = wallets?.[0];
      if (!wallet || !wallet.address) {
        setIsFactsProcessing(false);
        return;
      }

      const newIsFactsed = !hasFactsed;

      // Create message for signature
      const messageObj = {
        action: 'toggle_facts',
        poolId: poolId,
        operation: newIsFactsed ? 'like' : 'unlike',
        timestamp: new Date().toISOString(),
        account: wallet.address.toLowerCase(),
      };

      const messageStr = JSON.stringify(messageObj);

      // Request signature from user
      const { signature } = await signMessage(
        { message: messageStr },
        {
          uiOptions: {
            title: newIsFactsed ? 'Sign to FACTS' : 'Sign to remove FACTS',
            description: 'Sign this message to verify your action',
            buttonText: 'Sign',
          },
          address: wallet.address,
        }
      );

      // Call the server action
      const result = await togglePoolFacts(
        poolId,
        newIsFactsed ? 'like' : 'unlike',
        signature,
        messageStr
      );

      if (result.success) {
        const serverFactsCount =
          typeof result.facts === 'number'
            ? Math.max(result.facts, 5)
            : newIsFactsed
              ? poolFacts + 1
              : Math.max(5, poolFacts - 1);

        setHasFactsed(newIsFactsed);
        setPoolFacts(serverFactsCount);

        localStorage.setItem(`pool_facts_${poolId}`, serverFactsCount.toString());
        localStorage.setItem(`pool_facts_liked_${poolId}`, newIsFactsed.toString());
      } else {
        console.error('Error from server:', result.error);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('rejected') ||
          error.message.includes('cancel') ||
          error.message.includes('user rejected'))
      ) {
        // User rejected, silent error
      } else {
        console.error('Error handling FACTS:', error);
      }
    } finally {
      setIsFactsProcessing(false);
    }
  };

  return {
    poolFacts,
    hasFactsed,
    isFactsProcessing,
    handleFacts,
  };
}
