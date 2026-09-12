import type { NextConfig } from "next";

const previewPort = (process.env.DES_ART_PREVIEW_PORT ?? "41732").replace(/[^0-9]/g, "");
const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/concept-v2", destination: "/concept-v2/index.html" }];
  },
  async headers() {
    return [{
      source: "/concept-v2/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }];
  },
  ...(process.env.DES_ART_ADMIN_PREVIEW === "1" ? { distDir: `.next-admin-preview-${previewPort}` } : {}),
};

export default nextConfig;
