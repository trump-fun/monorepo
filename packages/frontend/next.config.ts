import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // experimental: {
  //   serverActions: {
  //     allowedOrigins: [''],
  //   },
  // },
  transpilePackages: ['geist'],
};

export default nextConfig;
