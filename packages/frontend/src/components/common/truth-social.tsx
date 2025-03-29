import { TRUMP_FUN_TRUTH_SOCIAL_URL } from '@trump-fun/common';
import Image from 'next/image';
import Link from 'next/link';
export default function TruthSocial({ postId }: { postId: string }) {
  return (
    <Link href={`${TRUMP_FUN_TRUTH_SOCIAL_URL}/posts/${postId}`} target='_blank'>
      <Image src='/truth-social.png' alt='Truth Social' width={20} height={20} />
    </Link>
  );
}
