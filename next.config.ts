import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output bundles server.js + node_modules for Docker
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
