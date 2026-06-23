import { defineConfig } from "vite";

// GitHub Pages（https://kuboon.github.io/browser-how-to/）向けの base。
// 環境変数 SITE_BASE で上書き可能。
export default defineConfig({
  base: process.env.SITE_BASE ?? "/browser-how-to/",
});
