import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Deploy trotz TS-Fehler — Typen werden separat geprüft
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
