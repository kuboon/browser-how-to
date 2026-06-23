import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src"],
      exclude: ["src/**/*.test.ts"],
      // private な共有パッケージの型を各 .d.ts にインライン化する。
      rollupTypes: true,
      bundledPackages: ["@kuboon/how-to-shared"],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "ui/index": resolve(__dirname, "src/ui/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      // 共有パッケージはバンドルに取り込む（外部依存にしない）。
      external: [],
    },
  },
});
