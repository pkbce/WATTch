import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
  },
  allowedDevOrigins: [
    "http://localhost:9002",
    "https://6000-firebase-studio-1763208220229.cluster-cd3bsnf6r5bemwki2bxljme5as.cloudworkstations.dev"
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://jwt-prod.up.railway.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
