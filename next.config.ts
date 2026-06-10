import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['chromadb', 'onnxruntime-node'],
  turbopack: {},
};

export default nextConfig;
