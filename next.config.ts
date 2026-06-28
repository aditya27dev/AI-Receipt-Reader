import type { NextConfig } from "next";

const allowedDevOrigins: string[] = ['localhost:3000'];
if (process.env.DEV_ORIGIN) {
  try {
    allowedDevOrigins.push(new URL(process.env.DEV_ORIGIN).hostname);
  } catch { /* invalid URL — skip */ }
}

console.log('Allowed dev origins:', allowedDevOrigins);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['chromadb', 'onnxruntime-node'],
  turbopack: {},
  allowedDevOrigins,
};

export default nextConfig;
