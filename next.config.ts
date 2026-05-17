import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['chromadb', 'onnxruntime-node'],
  turbopack: {},
};

export default nextConfig;
