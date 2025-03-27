import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TRUMP_FUN_TRUTH_SOCIAL_URL } from '@/utils/config';
export default function TruthSocial({ postId }: { postId: string }) {
  return (
    <Link href={`${TRUMP_FUN_TRUTH_SOCIAL_URL}/posts/${postId}`} target='_blank'>
      <Image src='/truth-social.png' alt='Truth Social' width={20} height={20} />
    </Link>
  );
}
