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
