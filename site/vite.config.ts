import { resolve } from "node:path";
import { defineConfig } from "vite";

// GitHub Pages（https://kuboon.github.io/browser-how-to/）向けの base。
// 環境変数 SITE_BASE で上書き可能。
// public/ 配下（llms.txt 等）は dist 直下へコピーされ、<base>/llms.txt で配信される。
export default defineConfig({
  base: process.env.SITE_BASE ?? "/browser-how-to/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        usage: resolve(__dirname, "usage.html"),
      },
    },
  },
});
