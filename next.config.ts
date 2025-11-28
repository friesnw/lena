import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: heic-convert is loaded via require() at runtime to avoid bundling issues
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb", // Increase body size limit for file uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "letters-for-lena-media.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com", // Matches any S3 bucket URL
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com", // Matches S3 URLs without region
      },
    ],
  },
};

export default nextConfig;
