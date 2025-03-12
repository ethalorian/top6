import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'api.universalprofile.cloud',
      'ipfs.lukso.network',
      'gateway.universalprofile.cloud',
      '2eff.lukso.dev'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.universalprofile.cloud',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.lukso.network',
        pathname: '/**',
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none';"
          }
        ],
      },
    ]
  }
};

export default nextConfig;
