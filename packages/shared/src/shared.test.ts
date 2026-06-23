import { describe, expect, it } from "vitest";
import { detectBrowser, detectOsVersion, detectPlatform } from "./device.js";
import { detectInAppBrowser } from "./inAppBrowser.js";
import { buildAndroidIntentUrl, buildSafariSchemeUrl, escapeInAppBrowser } from "./escape.js";
import type { DeviceInfo } from "./types.js";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  messengerIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/450.0]",
  facebookAndroid:
    "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0;]",
  line:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/14.5.0",
  samsung:
    "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
};

describe("platform detection", () => {
  it("detects iOS", () => {
    expect(detectPlatform(UA.iphoneSafari)).toBe("ios");
  });
  it("detects Android", () => {
    expect(detectPlatform(UA.androidChrome)).toBe("android");
  });
  it("reads iOS version", () => {
    expect(detectOsVersion(UA.iphoneSafari, "ios")).toEqual({ major: 17, minor: 5 });
  });
  it("reads Android version", () => {
    expect(detectOsVersion(UA.androidChrome, "android")).toEqual({ major: 14, minor: 0 });
  });
});

describe("browser detection", () => {
  it("detects Safari", () => {
    expect(detectBrowser(UA.iphoneSafari)).toBe("safari");
  });
  it("detects Chrome", () => {
    expect(detectBrowser(UA.androidChrome)).toBe("chrome");
  });
  it("detects Samsung Internet", () => {
    expect(detectBrowser(UA.samsung)).toBe("samsung");
  });
});

describe("in-app browser detection", () => {
  it("detects Messenger over Facebook", () => {
    const info = detectInAppBrowser(UA.messengerIos);
    expect(info.isInApp).toBe(true);
    expect(info.appId).toBe("messenger");
  });
  it("detects Facebook app", () => {
    expect(detectInAppBrowser(UA.facebookAndroid).appId).toBe("facebook");
  });
  it("detects LINE", () => {
    expect(detectInAppBrowser(UA.line).appId).toBe("line");
  });
  it("returns not-in-app for plain Safari", () => {
    expect(detectInAppBrowser(UA.iphoneSafari).isInApp).toBe(false);
  });
});

describe("escape", () => {
  const androidDevice: DeviceInfo = {
    platform: "android",
    osVersion: { major: 14, minor: 0 },
    browser: "other",
    inApp: { isInApp: true, appId: "facebook", appLabel: "Facebook" },
    isStandalone: false,
    userAgent: UA.facebookAndroid,
  };
  const iosDevice: DeviceInfo = {
    platform: "ios",
    osVersion: { major: 17, minor: 4 },
    browser: "other",
    inApp: { isInApp: true, appId: "messenger", appLabel: "Facebook Messenger" },
    isStandalone: false,
    userAgent: UA.messengerIos,
  };

  it("builds an Android intent URL", () => {
    const out = buildAndroidIntentUrl("https://example.com/path?a=1", "com.android.chrome");
    expect(out).toContain("intent://example.com/path?a=1#Intent;");
    expect(out).toContain("scheme=https;");
    expect(out).toContain("package=com.android.chrome;");
    expect(out).toContain("S.browser_fallback_url=");
  });

  it("redirects on Android", () => {
    let navigated = "";
    const res = escapeInAppBrowser(androidDevice, {
      url: "https://example.com/",
      navigate: (t) => (navigated = t),
    });
    expect(res.method).toBe("redirect");
    expect(res.ok).toBe(true);
    expect(navigated).toContain("intent://");
  });

  it("builds an x-safari-https URL", () => {
    expect(buildSafariSchemeUrl("https://example.com/path?a=1")).toBe(
      "x-safari-https://example.com/path?a=1",
    );
  });

  it("attempts x-safari redirect on iOS, with fallback steps", () => {
    let navigated = "";
    const res = escapeInAppBrowser(iosDevice, {
      url: "https://example.com/",
      navigate: (t) => (navigated = t),
    });
    expect(res.method).toBe("redirect");
    expect(navigated).toBe("x-safari-https://example.com/");
    if (res.method === "redirect") {
      expect(res.fallbackSteps.length).toBeGreaterThan(0);
    }
  });

  it("returns manual steps when URL is unknown (e.g. desktop)", () => {
    const desktop: DeviceInfo = { ...iosDevice, platform: "desktop" };
    const res = escapeInAppBrowser(desktop, { url: "" });
    expect(res.method).toBe("manual");
  });
});
