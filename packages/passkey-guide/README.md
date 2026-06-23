# @kuboon/how-to-passkeys

パスキー（WebAuthn）認証をあらゆるサービスに導入するための、判定＆案内ライブラリです。
**パスキーのログイン処理そのものではなく**、「使える環境か」の判定と、ユーザーが戸惑いがちな部分の案内に特化しています。

- 🔍 **判定**: `getClientCapabilities()`（Safari 17.4+ / Chrome 133+ / Firefox 135+）を使い、未対応ブラウザでは `isUVPAA()` 等にフォールバック
- 🚪 **誘導**: アプリ内ブラウザではパスキーが使えないことがあるため標準ブラウザへ誘導
- 🧭 **仕組みの案内**: 「スマホで作ったパスキーをパソコンで使う（クロスデバイス）」「パスキーはどこに保存される？」を分かりやすく説明
- 🎨 **コア + 任意 UI**: 判定だけ使う／用意済みのモーダル UI を使う、どちらも可能

> 実際のパスキー登録・認証（`navigator.credentials.create/get`）はサーバー連携が必要なため、各サービス側で実装してください。本パッケージはその導線と理解をサポートします。

## インストール

このパッケージは **JSR** と **GitHub Packages** で配布しています（npm レジストリには公開していません）。

JSR（推奨）:

```bash
npx jsr add @kuboon/how-to-passkeys
# Deno: deno add jsr:@kuboon/how-to-passkeys
```

GitHub Packages（npm 互換）— `@kuboon` スコープを GitHub Packages に向ける `.npmrc` を用意:

```
# .npmrc
@kuboon:registry=https://npm.pkg.github.com
```

```bash
npm i @kuboon/how-to-passkeys
```

## 使い方（UI つき・最短）

```ts
import { showPasskeyGuide } from "@kuboon/how-to-passkeys/ui";

document.querySelector("#about-passkey")!.addEventListener("click", () => {
  showPasskeyGuide();
});
```

`showPasskeyGuide()` は環境を判定し、次を自動で出し分けます。

- **この端末で使える**（生体認証あり）→ パスキーの仕組み・保存場所・別端末での使い方を案内
- **クロスデバイスのみ**（PC など）→ スマホを使った QR ログインの手順
- **アプリ内ブラウザ**→ 標準ブラウザで開き直す案内（Android は `intent://`、iOS は `x-safari-https://` で遷移を試行、失敗時の手動手順つき）
- **非対応**→ 最新ブラウザで開く案内

## 使い方（コアのみ・ヘッドレス）

```ts
import { createPasskeyGuide } from "@kuboon/how-to-passkeys";

const guide = createPasskeyGuide();
const status = await guide.detect();

switch (status.support) {
  case "full":
    // この端末でパスキー登録/利用可能。登録ボタンを出す等。
    break;
  case "cross-device-only":
    // スマホを使えばログイン可能。QR の案内を出す。
    console.log(guide.explain("cross-device"));
    break;
  case "in-app-blocked":
    guide.escapeInAppBrowser();
    break;
  case "unsupported":
    // 非対応の案内
    break;
}
```

## API

### `createPasskeyGuide(options?)`

| メソッド | 説明 |
| --- | --- |
| `detect()` | `{ support, capabilities, device }` を非同期で返す |
| `getDevice()` | 端末情報のみ同期取得 |
| `escapeInAppBrowser(opts?)` | アプリ内ブラウザから標準ブラウザへ脱出 |
| `explain(topic)` | 案内コンテンツを取得（`"what-is-passkey"` / `"cross-device"` / `"where-saved"`） |

`capabilities`:

| フィールド | 意味 |
| --- | --- |
| `webauthnSupported` | WebAuthn 対応 |
| `platformAuthenticatorAvailable` | この端末で生体認証等によるパスキー作成・利用が可能（isUVPAA） |
| `conditionalMediationAvailable` | ログインフォームの自動入力（条件付き UI）対応 |
| `crossDeviceSupported` | スマホ等を使ったクロスデバイス認証に対応（hybridTransport） |
| `relatedOriginsSupported` | Related Origins 対応 |
| `usedClientCapabilities` | `getClientCapabilities()` を使えたか（false は推定値を含む） |

`support`:

| 値 | 意味 |
| --- | --- |
| `full` | この端末でパスキーを作成・利用できる |
| `cross-device-only` | この端末では作れないが、スマホ等でログイン可能 |
| `in-app-blocked` | アプリ内ブラウザのため標準ブラウザへの移動が必要 |
| `unsupported` | パスキー非対応 |

### `showPasskeyGuide(options?)` （`/ui`）

```ts
showPasskeyGuide({ userAgent, zIndex, onClose });
```

戻り値の `{ close() }` で閉じられます。

## パスキーの「保存場所」について

パスキーは決済の「Apple Wallet / Google ウォレット」ではなく、**iCloud キーチェーン**（Apple）や **Google パスワードマネージャー**（Android / Chrome）に保存され、同じアカウントの端末に同期されます。別メーカーの端末で使うときはスマホで QR を読み取る方式になります。`explain("where-saved")` がこの説明文を返します。

## ライセンス

MIT
