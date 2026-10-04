import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: { unoptimized: true },
  outputFileTracingIncludes: { "/*": ["./.portfolio-release/site/**/*"] },
  outputFileTracingExcludes: { "/*": ["./USERSPACE/**/*", "./tools/payload-admin/**/*", "./tools/des-art-admin/**/*", "./public/**/*", "./node_modules/@next/swc-*/**/*", "./node_modules/@img/**/*", "./node_modules/sharp/**/*"] },
};
export default nextConfig;
