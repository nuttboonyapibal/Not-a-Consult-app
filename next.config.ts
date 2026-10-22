import type { NextConfig } from "next";

// Every page depends on the signed-in user or a link token, so the app renders
// dynamically instead of using Cache Components.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
