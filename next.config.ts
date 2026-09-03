import type { NextConfig } from "next";

const previewPort = (process.env.DES_ART_PREVIEW_PORT ?? "41732").replace(/[^0-9]/g, "");
const nextConfig: NextConfig = {
  ...(process.env.DES_ART_ADMIN_PREVIEW === "1" ? { distDir: `.next-admin-preview-${previewPort}` } : {}),
};

export default nextConfig;
