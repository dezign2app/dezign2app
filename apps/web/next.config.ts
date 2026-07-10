import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  crossOrigin: "use-credentials",
  experimental: {
    mcpServer: true,
  },

};

export default nextConfig;
