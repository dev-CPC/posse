import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  allowedDevOrigins: ["vega", "100.115.98.30"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
