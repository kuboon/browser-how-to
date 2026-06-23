# @kuboon/how-to-a2hs

「ホーム画面に追加（Add to Home Screen / A2HS）」をあらゆるサービスに導入するためのフロントエンド用ライブラリです。

- 🔍 **判定**: ホーム画面に追加できる環境かを自動判定
- 🚪 **誘導**: アプリ内ブラウザ（Messenger / Facebook / Instagram / LINE など）では標準ブラウザへ誘導（Android は `intent://` で既定ブラウザを開き、iOS は `x-safari-https://` で Safari を開く。いずれも失敗時の手動手順つき）
- 📝 **手順案内**: 追加できる場合も、iPhone / Android・ブラウザ・バージョン別に分かりやすい手順を表示
- 🎨 **コア + 任意 UI**: 判定だけ使う／用意済みのモーダル UI を使う、どちらも可能

## インストール

このパッケージは **JSR** と **GitHub Packages** で配布しています（npm レジストリには公開していません）。

JSR（推奨）:

```bash
npx jsr add @kuboon/how-to-a2hs
# Deno: deno add jsr:@kuboon/how-to-a2hs
```

GitHub Packages（npm 互換）— `@kuboon` スコープを GitHub Packages に向ける `.npmrc` を用意:

```
# .npmrc
@kuboon:registry=https://npm.pkg.github.com
```

```bash
npm i @kuboon/how-to-a2hs
```

## 使い方（UI つき・最短）

```ts
import { showA2hsGuide } from "@kuboon/how-to-a2hs/ui";

// ボタンが押されたら、環境に応じた案内モーダルを表示
document.querySelector("#install")!.addEventListener("click", () => {
  showA2hsGuide();
});
```

`showA2hsGuide()` は環境を判定し、次を自動で出し分けます。

- **インストールプロンプト対応**（Android Chrome 系）→ 「ホーム画面に追加」ボタン（OS のダイアログを表示）
- **手動操作が必要**（iOS Safari など）→ 機種別のステップ手順
- **アプリ内ブラウザ**→ 標準ブラウザで開き直す案内（Android は自動で遷移）
- **追加済み** → その旨を表示

## 使い方（コアのみ・ヘッドレス）

UI を自前で作る場合は判定ロジックだけ使えます。

```ts
import { createA2hs } from "@kuboon/how-to-a2hs";

const a2hs = createA2hs();
const status = a2hs.getStatus();

switch (status.support) {
  case "native-prompt":
    // OS のインストールダイアログを出せる
    await a2hs.promptInstall(); // "accepted" | "dismissed" | "unavailable"
    break;
  case "manual": {
    const { title, steps, note } = a2hs.getInstructions();
    // steps を自前 UI で描画
    break;
  }
  case "in-app-blocked":
    a2hs.escapeInAppBrowser(); // Android=intent:// / iOS=x-safari-https:// で遷移を試み、fallbackSteps も返す
    break;
}
```

## API

### `createA2hs(options?)`

| メソッド | 説明 |
| --- | --- |
| `getStatus()` | `{ support, device, canPrompt }` を返す |
| `promptInstall()` | OS のインストールダイアログを表示（`canPrompt` が true のときのみ） |
| `getInstructions()` | 現在の環境に合わせた `{ title, steps, note }` を返す |
| `escapeInAppBrowser(opts?)` | アプリ内ブラウザから標準ブラウザへ脱出 |
| `onChange(listener)` | インストール可能/済みの状態変化を購読（解除関数を返す） |

`support` の値:

| 値 | 意味 |
| --- | --- |
| `installed` | すでにホーム画面アプリとして起動中 |
| `native-prompt` | OS のインストールプロンプトを直接出せる |
| `manual` | 対応しているが手動操作が必要（iOS Safari など） |
| `in-app-blocked` | アプリ内ブラウザのため標準ブラウザへの移動が必要 |
| `unsupported` | 追加に非対応（多くの PC など） |

### `showA2hsGuide(options?)` （`/ui`）

```ts
showA2hsGuide({
  userAgent,    // テスト/SSR 用に UA を差し替え
  zIndex,       // 重なり順
  onInstalled,  // 追加成功時のコールバック
  onClose,      // 閉じたときのコールバック
});
```

戻り値の `{ close() }` で閉じられます。スタイルは `bht-` プレフィックスのクラスで上書きできます。

## 補足

- `beforeinstallprompt` はページ読み込み直後に発火するため、本パッケージは import 時点で自動的に捕捉します。インストールボタンは早めにこのモジュールを読み込んでおくと確実です。
- PWA としてインストール可能にするには、`manifest.json`（`display: standalone` など）の設置が別途必要です。

## ライセンス

MIT
