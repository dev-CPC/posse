import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  allowedDevOrigins: ["vega", "100.115.98.30"],
};

export default nextConfig;
