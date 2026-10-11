import type { NextConfig } from "next";

const apiUpstream = process.env.LOGIFLOW_API_UPSTREAM ?? "http://localhost:3001";
if (!/^https?:\/\/[^/]+\/?$/.test(apiUpstream)) {
  throw new Error("LOGIFLOW_API_UPSTREAM must be an HTTP(S) origin without a path");
}
const upstream = apiUpstream.replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${upstream}/api/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${upstream}/:path*`,
      },
    ];
  },
};

export default nextConfig;
