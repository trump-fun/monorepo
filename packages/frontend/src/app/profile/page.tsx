import { ProfileClient } from '@/components/profile/ProfileClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View and manage your betting history, stats, and withdrawals.',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
