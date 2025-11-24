import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: heic-convert is loaded via require() at runtime to avoid bundling issues
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb", // Increase body size limit for file uploads
    },
  },
};

export default nextConfig;
