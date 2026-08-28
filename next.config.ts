import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const previewPort = (process.env.DES_ART_PREVIEW_PORT ?? "41732").replace(/[^0-9]/g, "");
const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  ...(process.env.DES_ART_ADMIN_PREVIEW === "1" ? { distDir: `.next-admin-preview-${previewPort}` } : {}),
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

export default withMDX(nextConfig);
