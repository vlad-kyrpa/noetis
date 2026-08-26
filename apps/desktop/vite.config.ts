import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const COMMON_MODULE_ALIAS = new URL("./src/modules/common", import.meta.url)
  .pathname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@common": COMMON_MODULE_ALIAS,
    },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
});
