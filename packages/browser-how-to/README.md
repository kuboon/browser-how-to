# @kuboon/browser-how-to

「**ホーム画面に追加**」「**パスキー**」「**プッシュ通知**」を、アプリ内ブラウザや機械が苦手な人にも
届けるためのフロントエンド用ライブラリです。各機能は「**使える環境か判定し、使えなければ標準ブラウザへ誘導、
使える場合はやり方を案内する**」という guidance に徹します（パスキーの登録処理やプッシュの購読自体は行いません）。

機能は **サブパスエクスポート**で分かれており、必要なものだけ import すれば残りはバンドルされません。

| import | 内容 |
| --- | --- |
| `@kuboon/browser-how-to` | 端末・ブラウザ・アプリ内ブラウザの検出（`detectDevice` 等） |
| `@kuboon/browser-how-to/a2hs` ・ `/a2hs/ui` | ホーム画面に追加の判定・手順案内 |
| `@kuboon/browser-how-to/passkeys` ・ `/passkeys/ui` | パスキーの判定・仕組み案内 |
| `@kuboon/browser-how-to/push` ・ `/push/ui` | プッシュ通知の前提案内（iOS は a2hs を内部利用） |

## インストール

**JSR**（推奨）— [jsr.io/@kuboon/browser-how-to](https://jsr.io/@kuboon/browser-how-to):

```bash
npx jsr add @kuboon/browser-how-to
# Deno: deno add jsr:@kuboon/browser-how-to
```

**GitHub Packages**（npm 互換）— `@kuboon` スコープを GitHub Packages に向ける `.npmrc` を用意:

```
# .npmrc
@kuboon:registry=https://npm.pkg.github.com
```

```bash
npm i @kuboon/browser-how-to
```

> npm レジストリ（npmjs.com）には公開していません。

## 使い方

```ts
// プッシュ通知の案内（iPhone で未インストールなら自動でホーム画面追加の案内へ）
import { showPushGuide } from "@kuboon/browser-how-to/push/ui";
document.querySelector("#enable-push")!.addEventListener("click", () => showPushGuide());

// パスキーの案内（a2hs / push はバンドルされない）
import { showPasskeyGuide } from "@kuboon/browser-how-to/passkeys/ui";
document.querySelector("#about-passkey")!.addEventListener("click", () => showPasskeyGuide());

// ホーム画面に追加の案内
import { showA2hsGuide } from "@kuboon/browser-how-to/a2hs/ui";
document.querySelector("#install")!.addEventListener("click", () => showA2hsGuide());
```

ヘッドレス（UI なし）で判定だけ使うこともできます。

```ts
import { detectDevice } from "@kuboon/browser-how-to";
const device = detectDevice();
if (device.inApp.isInApp) {
  // Messenger / Facebook / LINE 等。ホーム画面追加もパスキーも使えないため標準ブラウザへ誘導。
  device.inApp.appLabel; // 例: "Facebook Messenger"
}

import { createPasskeyGuide } from "@kuboon/browser-how-to/passkeys";
const status = await createPasskeyGuide().detect();
// status.support: "full" | "cross-device-only" | "in-app-blocked" | "unsupported"

import { createPushGuide } from "@kuboon/browser-how-to/push";
const push = createPushGuide().getStatus();
// push.support: "ready" | "needs-install" | "in-app-blocked" | "denied" | "unsupported"
```

## 各機能の概要

### `/a2hs` — ホーム画面に追加
- `installed` / `native-prompt`（Android はプロンプト直呼び） / `manual`（iOS Safari 等の機種別手順） /
  `in-app-blocked` / `unsupported` を判定
- アプリ内ブラウザは Android=`intent://`、iOS=`x-safari-https://` で標準ブラウザへ誘導（失敗時は手動手順）

### `/passkeys` — パスキー
- `getClientCapabilities()` ベースで判定（未対応は `isUVPAA()` 等にフォールバック）
- `full` / `cross-device-only` / `in-app-blocked` / `unsupported`
- 「スマホで作ったパスキーを PC で使う（QR）」「保存場所（iCloud キーチェーン / Google パスワードマネージャー）」を案内

### `/push` — プッシュ通知（案内のみ）
- 通知の購読は行わず、受け取るための**前提条件を案内**します
- `ready`（許可を求められる） / `needs-install`（iOS 未インストール → a2hs へ） /
  `in-app-blocked` / `denied`（設定から再許可） / `unsupported`
- iOS は「ホーム画面に追加した PWA」でのみ Web Push が使えるため、`/push/ui` は内部で `/a2hs/ui` を呼び出します

## ライセンス

MIT
