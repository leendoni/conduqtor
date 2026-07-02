import type { NextConfig } from "next";

/**
 * FRAME is 100% client-side (no backend, no API routes, no DB). The app is
 * statically exported with `output: "export"` so the build produces a plain
 * HTML/JS/CSS `out/` directory that can be served from any static host (or
 * locally with `npx serve out` / `python3 -m http.server -d out 8000`).
 *
 * Images are left unoptimized because Next's image optimizer requires a
 * server runtime — `images.unoptimized` makes `<Image>` emit plain `<img>`
 * tags suitable for static export.
 *
 * `typescript.ignoreBuildErrors` and `reactStrictMode: false` are preserved
 * from the upstream sandbox config — they silence pre-existing TS strictness
 * notes and avoid double-render side effects in the FRAME builder (the store
 * hydrates from localStorage in a `useEffect`, which strict mode would fire
 * twice during development).
 */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
