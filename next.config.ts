import type { NextConfig } from "next";

// Every page depends on the signed-in user or a link token, so the app renders
// dynamically instead of using Cache Components.
const nextConfig: NextConfig = {
  logging: {
    // Server Function arguments include passwords and client data; keep them out of the terminal.
    serverFunctions: false,
  },
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
