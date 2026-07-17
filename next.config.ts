import type { NextConfig } from "next";

// `mongodb` is on Next's default serverExternalPackages list, so the driver is
// loaded with native Node require() instead of being bundled. That is what keeps
// its internal require("os")/require("crypto") calls working — no config needed.
const nextConfig: NextConfig = {};

export default nextConfig;
