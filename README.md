# browser-how-to

「**ホーム画面に追加**」と「**パスキー認証**」を、あらゆる Web サービスに安心して導入するためのフロントエンド用パッケージ群です。

スマホ向け Web サービスでは、次のような“あと一歩”でつまずく人がたくさんいます。

- **Facebook Messenger などのアプリ内ブラウザ**から開かれると、ホーム画面追加もパスキーも使えない
- ホーム画面への追加は **iPhone / Android・ブラウザ・バージョン**で操作が違い、機械が苦手な人には難しい
- パスキーは仕組みが分かりにくく、「**スマホで登録したのにパソコンでログインできない**」と戸惑う

このリポジトリは、その課題を 2 つの独立したパッケージで解決します。どちらもフロントエンドの
JavaScript / TypeScript から数行で呼び出せ、フレームワークに依存しません（Vanilla JS）。

## パッケージ

| パッケージ | 役割 |
| --- | --- |
| [`@browser-how-to/add-to-home-screen`](./packages/add-to-home-screen) | ホーム画面に追加できるか判定し、できなければ標準ブラウザへ誘導、できる場合は機種別の手順を案内 |
| [`@browser-how-to/passkey-guide`](./packages/passkey-guide) | パスキーが使えるか判定し、使えなければ標準ブラウザへ誘導、使える場合はクロスデバイス等の仕組みを案内 |

両パッケージは内部で共有ロジック（`packages/shared`：端末・ブラウザ・アプリ内ブラウザの検出と標準ブラウザへの脱出）を使っています。

## デモ

GitHub Pages にデモを公開しています（環境シミュレーター付き）。

👉 **https://kuboon.github.io/browser-how-to/**

## クイックスタート

```ts
// ① ホーム画面に追加
import { showA2hsGuide } from "@browser-how-to/add-to-home-screen/ui";
document.querySelector("#install")!.addEventListener("click", () => showA2hsGuide());

// ② パスキーの案内
import { showPasskeyGuide } from "@browser-how-to/passkey-guide/ui";
document.querySelector("#passkey")!.addEventListener("click", () => showPasskeyGuide());
```

UI を使わず、判定ロジックだけを使うこともできます（コアはヘッドレス）。

```ts
import { createA2hs } from "@browser-how-to/add-to-home-screen";
const status = createA2hs().getStatus();
// status.support: "installed" | "native-prompt" | "manual" | "in-app-blocked" | "unsupported"
```

詳細は各パッケージの README を参照してください。

## 開発

pnpm のモノレポです。

```bash
pnpm install
pnpm typecheck   # 型チェック
pnpm test        # ユニットテスト（Vitest）
pnpm build       # 各パッケージのビルド（Vite ライブラリモード）

pnpm --filter @browser-how-to/site dev   # デモサイトをローカル起動
```

## ライセンス

MIT
