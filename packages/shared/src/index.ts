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
export { escapeInAppBrowser, buildAndroidIntentUrl } from "./escape.js";
export type { EscapeOptions } from "./escape.js";
