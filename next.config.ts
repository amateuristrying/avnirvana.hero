import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev overlay badge sits on top of the hero composition.
  devIndicators: false,
  // Every route here prerenders as static content — there is no server
  // rendering, no API route and no next/image — so emit a plain `out/`
  // directory. Cloudflare Pages serves that directly, with no adapter and
  // no Edge runtime to maintain.
  output: "export",
};

export default nextConfig;
