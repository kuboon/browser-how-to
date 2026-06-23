import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ include: ["src"], exclude: ["src/**/*.test.ts"] })],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "a2hs/index": resolve(__dirname, "src/a2hs/index.ts"),
        "a2hs/ui": resolve(__dirname, "src/a2hs/ui.ts"),
        "passkeys/index": resolve(__dirname, "src/passkeys/index.ts"),
        "passkeys/ui": resolve(__dirname, "src/passkeys/ui.ts"),
        "push/index": resolve(__dirname, "src/push/index.ts"),
        "push/ui": resolve(__dirname, "src/push/ui.ts"),
      },
      formats: ["es"],
    },
  },
});
