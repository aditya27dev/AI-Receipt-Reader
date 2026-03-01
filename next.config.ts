import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['chromadb', 'onnxruntime-node'],
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/node_modules', '**/.next', '**/.git'],
    };
    return config;
  },
};

export default nextConfig;
