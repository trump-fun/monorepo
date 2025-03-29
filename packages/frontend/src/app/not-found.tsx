'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex min-h-[75vh] flex-col items-center justify-center bg-gradient-to-b from-orange-400 to-orange-800 p-6 text-white'>
      <div className='w-full max-w-md rounded-lg bg-white/10 p-8 text-center shadow-xl backdrop-blur-sm'>
        <h1 className='mb-2 text-5xl font-bold'>404</h1>
        <h2 className='mb-6 text-3xl font-bold text-orange-300'>PAGE NOT FOUND</h2>

        <div className='mb-6'>
          <Image
            src='/images/trump-confused.jpg'
            alt='Confused Trump'
            width={200}
            height={200}
            className='mx-auto rounded-lg border-2 border-orange-300'
          />
        </div>

        <p className='mb-6 text-xl'>
          &quot;Believe me, this page is nowhere to be found. It&apos;s gone. Totally gone.&quot;
        </p>

        <Link
          href='/'
          className='inline-block rounded-lg bg-orange-500 px-6 py-3 font-bold text-white transition-colors duration-300 hover:bg-orange-400'
        >
          Make Navigation Great Again
        </Link>
      </div>
    </div>
  );
}
