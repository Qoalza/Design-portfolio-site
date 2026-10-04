import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  // Next reserves /404 before the catch-all route; keep it on the public release renderer.
  async rewrites() {
    return {beforeFiles: [{source: "/404", destination: "/release-not-found"}], afterFiles: [], fallback: []};
  },
  poweredByHeader: false,
  images: { unoptimized: true },
  outputFileTracingIncludes: { "/*": ["./.portfolio-release/site/**/*"] },
  outputFileTracingExcludes: { "/*": ["./USERSPACE/**/*", "./tools/payload-admin/**/*", "./tools/des-art-admin/**/*", "./public/**/*", "./node_modules/@next/swc-*/**/*", "./node_modules/@img/**/*", "./node_modules/sharp/**/*"] },
};
export default nextConfig;
