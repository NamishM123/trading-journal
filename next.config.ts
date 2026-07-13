import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships wasm assets that must be loaded from node_modules, not bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: {
      // Screenshot uploads go through server actions as multipart form data.
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
