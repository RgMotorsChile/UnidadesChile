import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { seoPreviewPlugin } from "./vite.seo-plugin.mjs";

declare module "./vite.seo-plugin.mjs" {
  export function seoPreviewPlugin(): Plugin;
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPreviewPlugin()],
  resolve: {
    alias: { "@shared": path.resolve(path.dirname(new URL(import.meta.url).pathname), "shared") },
  },
});
