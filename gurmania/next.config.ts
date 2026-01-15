import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'amzn-s3-gurmania-prod.s3.eu-central-1.amazonaws.com',
      }
    ],
  },
};

export default nextConfig;
