import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.contentstack.io", // US region
      },
      {
        protocol: "https",
        hostname: "eu-images.contentstack.io", // EU region (optional but recommended)
      },
    ],
  },
};

export default nextConfig;
