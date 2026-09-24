import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP as the fallback. Next picks per-request from the
    // browser's Accept header, so the source JPEGs are never what ships.
    formats: ["image/avif", "image/webp"],
    // The Tunebox trailer's thumbnail, shown until someone presses play, so
    // YouTube itself only loads on request.
    remotePatterns: [new URL("https://i.ytimg.com/vi/JGS_X_n-Gvs/**")],
  },
};

export default nextConfig;
