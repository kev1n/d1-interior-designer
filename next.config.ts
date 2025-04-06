import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "*.gstatic.com",
      },
      {
        hostname: "i.pinimg.com",
      },
    ],
  },
};

export default nextConfig;
