import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/learn",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/account",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/settings",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
