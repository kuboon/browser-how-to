import type { BrowserName, DeviceInfo, OsVersion, Platform } from "./types.js";
import { detectInAppBrowser } from "./inAppBrowser.js";

function getUserAgent(ua?: string): string {
  if (typeof ua === "string") return ua;
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    return navigator.userAgent;
  }
  return "";
}

/**
 * iPadOS 13 以降の Safari は Mac の UA を名乗るため、タッチ対応の有無で iPad を判別する。
 */
function isIpadOs(ua: string): boolean {
  if (/iPad/.test(ua)) return true;
  const looksMac = /Macintosh/.test(ua);
  const hasTouch =
    typeof navigator !== "undefined" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  return looksMac && hasTouch;
}

export function detectPlatform(ua: string): Platform {
  if (/Android/.test(ua)) return "android";
  if (/iPhone|iPod/.test(ua)) return "ios";
  if (isIpadOs(ua)) return "ipados";
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) return "desktop";
  return "unknown";
}

export function detectOsVersion(ua: string, platform: Platform): OsVersion | null {
  if (platform === "ios" || platform === "ipados") {
    // 例: "OS 17_5_1" / "Version/16.0"
    const m = ua.match(/OS (\d+)[_.](\d+)/);
    if (m) return { major: Number(m[1]), minor: Number(m[2]) };
    return null;
  }
  if (platform === "android") {
    const m = ua.match(/Android (\d+)(?:\.(\d+))?/);
    if (m) return { major: Number(m[1]), minor: m[2] ? Number(m[2]) : 0 };
    return null;
  }
  return null;
}

/**
 * ブラウザ種別を判定する。判定順が重要（Chrome は Safari トークンも含むなど）。
 */
export function detectBrowser(ua: string): BrowserName {
  if (/SamsungBrowser/.test(ua)) return "samsung";
  if (/EdgiOS|EdgA|\bEdg\//.test(ua)) return "edge";
  if (/OPR\/|\bOpera\b|OPiOS/.test(ua)) return "opera";
  if (/FxiOS|Firefox/.test(ua)) return "firefox";
  if (/CriOS|Chrome\//.test(ua)) return "chrome";
  // 上記をすべて除外したうえで Safari トークンが残れば本物の Safari。
  if (/Safari/.test(ua) && /Version\//.test(ua)) return "safari";
  if (/Safari/.test(ua)) return "safari";
  return "other";
}

/** ホーム画面アプリ（standalone）として起動しているか。 */
export function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql =
    typeof window.matchMedia === "function" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches);
  // iOS Safari 独自プロパティ
  const iosStandalone =
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mql) || Boolean(iosStandalone);
}

/** 端末・ブラウザ・インアプリ状態をまとめて検出する。 */
export function detectDevice(ua?: string): DeviceInfo {
  const userAgent = getUserAgent(ua);
  const platform = detectPlatform(userAgent);
  return {
    platform,
    osVersion: detectOsVersion(userAgent, platform),
    browser: detectBrowser(userAgent),
    inApp: detectInAppBrowser(userAgent),
    isStandalone: detectStandalone(),
    userAgent,
  };
}

/**
 * 「標準ブラウザ（iOS=Safari / Android=Chrome）で開かれているか」の判定。
 * ホーム画面追加・パスキーが本来の挙動で使える環境かの目安に用いる。
 */
export function isStandardBrowser(device: DeviceInfo): boolean {
  if (device.inApp.isInApp) return false;
  if (device.platform === "ios" || device.platform === "ipados") {
    return device.browser === "safari";
  }
  if (device.platform === "android") {
    // Android は Chrome 以外でも PWA/パスキーに対応するブラウザが複数あるため広めに許容。
    return (
      device.browser === "chrome" ||
      device.browser === "samsung" ||
      device.browser === "edge" ||
      device.browser === "firefox" ||
      device.browser === "opera"
    );
  }
  return device.platform === "desktop";
}
