import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, //causes double backend calls...
  env: {
    // These will be available at build time and runtime
    // if there is no PORT, it will be 3002, which is used for development
    PORT: process.env.PORT || "3002",
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL || "http://localhost:4002",
  },
};

export default nextConfig;
