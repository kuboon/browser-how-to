// ルートエントリ（@kuboon/browser-how-to）。
// 端末・ブラウザ・アプリ内ブラウザの検出ユーティリティと主要型を公開する。
// 各機能の案内 UI / ロジックはサブパスから import する:
//   @kuboon/browser-how-to/a2hs(+/ui)
//   @kuboon/browser-how-to/passkeys(+/ui)
//   @kuboon/browser-how-to/push(+/ui)
export {
  detectDevice,
  detectPlatform,
  detectBrowser,
  detectOsVersion,
  detectStandalone,
  detectInAppBrowser,
  isStandardBrowser,
  escapeInAppBrowser,
  buildAndroidIntentUrl,
  buildSafariSchemeUrl,
} from "./core/index.js";
export type {
  Platform,
  BrowserName,
  InAppBrowserId,
  OsVersion,
  InAppBrowserInfo,
  DeviceInfo,
  EscapeResult,
  EscapeOptions,
  GuideStep,
} from "./core/index.js";
