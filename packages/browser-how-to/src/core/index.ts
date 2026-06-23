// 内部共有モジュール（旧 @kuboon/how-to-shared）のバレル。
// パッケージ内からは相対 import（../core/index.js）で参照する。
export * from "./types.js";
export {
  detectDevice,
  detectPlatform,
  detectBrowser,
  detectOsVersion,
  detectStandalone,
  isStandardBrowser,
} from "./device.js";
export { detectInAppBrowser } from "./inAppBrowser.js";
export { escapeInAppBrowser, buildAndroidIntentUrl, buildSafariSchemeUrl } from "./escape.js";
export type { EscapeOptions } from "./escape.js";
