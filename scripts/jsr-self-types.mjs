// ビルド後、dist の各エントリ JS の先頭に
//   // @ts-self-types="./index.d.ts"
// を付与する。JSR は TypeScript ソース公開を前提とするが、本リポジトリは
// 内部共有パッケージ（@kuboon/how-to-shared）をバンドルした dist を公開するため、
// JS エントリに対して隣接する .d.ts を型ソースとして明示する必要がある。
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const entries = [
  { js: "index.js", dts: "./index.d.ts" },
  { js: "ui/index.js", dts: "./index.d.ts" },
];

for (const { js, dts } of entries) {
  const file = resolve(distDir, js);
  const directive = `// @ts-self-types="${dts}"\n`;
  let code;
  try {
    code = await readFile(file, "utf8");
  } catch {
    continue; // エントリが無ければスキップ
  }
  if (code.startsWith("// @ts-self-types=")) continue; // 二重付与を防ぐ
  await writeFile(file, directive + code);
  console.log(`[jsr-self-types] ${js} -> ${dts}`);
}
