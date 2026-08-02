import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Avoids dev-only React dispatcher errors in Safari/Turbopack.
    reactDebugChannel: false,
  },
};

export default nextConfig;
