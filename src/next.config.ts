import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 blocks cross-origin requests to /_next/* in development.
  // Browsers (and Cursor port-forward) often hit http://127.0.0.1:3000 while
  // the page was served as http://localhost:3000 (or the reverse). Without
  // these entries, client JS/HMR is blocked → buttons appear dead and the
  // connection can look reset. Localhost-only development stays local.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
