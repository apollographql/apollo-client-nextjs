import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // this line is important so the "browser build" of dependencies is used
    // and not the "SSR build", which would contain "streaming-to-the-browser"
    // specific code
    conditions: ["browser"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./setup.js",
    server: {
      // this is important so that the `graphql` dependency is inlined by vitest,
      // which seems to get around the "dual package hazard" with ESM/CJS
      // at least in this specific setup
      deps: {
        inline: true,
      },
    },
  },
});
