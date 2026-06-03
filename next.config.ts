import type { NextConfig } from "next";

// Static SPA export: `next build` emits dist/ with one HTML file per route.
// Served directly by nginx (no Node process for the frontend). All data is
// fetched client-side from NEXT_PUBLIC_API_URL, so SSR is not needed.
const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: { unoptimized: true },
};

export default nextConfig;
