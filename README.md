# browser-how-to

「**ホーム画面に追加**」「**パスキー**」「**プッシュ通知**」を、あらゆる Web サービスに安心して導入するための
フロントエンド用ライブラリ **`@kuboon/browser-how-to`** を提供します。

スマホ向け Web サービスでは、次のような“あと一歩”でつまずく人がたくさんいます。

- **Facebook Messenger などのアプリ内ブラウザ**から開かれると、ホーム画面追加・パスキー・通知が使えない
- ホーム画面への追加は **iPhone / Android・ブラウザ・バージョン**で操作が違い、機械が苦手な人には難しい
- パスキーは仕組みが分かりにくく、「**スマホで登録したのにパソコンでログインできない**」と戸惑う
- iPhone のプッシュ通知は「**ホーム画面に追加した後**」でないと使えないことが知られていない

このライブラリは各機能について「**使える環境か判定 → 使えなければ標準ブラウザへ誘導 → 使える場合はやり方を案内**」
します。フレームワーク非依存（Vanilla JS / TS）で数行から組み込めます。

## 単一パッケージ + サブパス

機能はサブパスで分かれており、必要なものだけ import すれば残りはバンドルされません（tree-shaking）。

| import | 役割 |
| --- | --- |
| `@kuboon/browser-how-to` | 端末・ブラウザ・アプリ内ブラウザの検出（`detectDevice` 等） |
| `@kuboon/browser-how-to/a2hs`（`/ui`） | ホーム画面に追加の判定・手順案内 |
| `@kuboon/browser-how-to/passkeys`（`/ui`） | パスキーの判定・仕組み案内 |
| `@kuboon/browser-how-to/push`（`/ui`） | プッシュ通知の前提案内（iOS は内部で a2hs を利用） |

「push 通知 + passkeys」を両方使う／「passkeys だけ」使う、のどちらも同じパッケージで完結します。
`push` を使うと a2hs も含まれ、`passkeys` だけなら a2hs/push は含まれません。

## デモ・ドキュメント

GitHub Pages で公開しています。

- 環境シミュレーター付きデモ 👉 **https://kuboon.github.io/browser-how-to/**
- 使い方 / API リファレンス（1ページ完結）👉 **https://kuboon.github.io/browser-how-to/usage.html**
- AI 向けプレーン版（このページだけで統合可）👉 **https://kuboon.github.io/browser-how-to/llms.txt**

## クイックスタート

```ts
import { showPushGuide } from "@kuboon/browser-how-to/push/ui";
import { showPasskeyGuide } from "@kuboon/browser-how-to/passkeys/ui";

document.querySelector("#enable-push")!.addEventListener("click", () => showPushGuide());
document.querySelector("#about-passkey")!.addEventListener("click", () => showPasskeyGuide());
```

判定だけ（ヘッドレス）:

```ts
import { detectDevice } from "@kuboon/browser-how-to";
const device = detectDevice();
if (device.inApp.isInApp) device.inApp.appLabel; // 例: "Facebook Messenger"
```

詳細は [`packages/browser-how-to/README.md`](./packages/browser-how-to) を参照してください。

## 配布

**JSR** と **GitHub Packages** で配布します（npmjs.com には公開しません）。

- JSR: [`@kuboon/browser-how-to`](https://jsr.io/@kuboon/browser-how-to) — `npx jsr add @kuboon/browser-how-to`
- GitHub Packages: `@kuboon` スコープを `https://npm.pkg.github.com` に向けた `.npmrc` を用意して `npm i`

公開は `.github/workflows/publish.yml`（GitHub Packages は `GITHUB_TOKEN`、JSR は OIDC trusted publishing）。

## 開発

pnpm のモノレポ（公開パッケージ + デモサイト）です。

```bash
pnpm install
pnpm typecheck   # 型チェック
pnpm test        # ユニットテスト（Vitest）
pnpm build       # ライブラリビルド（Vite、サブパス別エントリ）
pnpm dev         # デモサイトをローカル起動
```

## ライセンス

MIT
