import { ExploreClient } from '@/components/explore/ExploreClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Pools',
  description: 'Explore betting pools and find the best opportunities to place your bets.',
};

export default function BettingPlatform() {
  return <ExploreClient />;
}
