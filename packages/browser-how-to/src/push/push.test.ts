import { describe, expect, it } from "vitest";
import { createPushGuide, detectPushStatus } from "./controller.js";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  messengerIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/450.0]",
};

describe("detectPushStatus", () => {
  it("returns in-app-blocked inside Messenger", () => {
    expect(detectPushStatus({ userAgent: UA.messengerIos }).support).toBe("in-app-blocked");
  });

  it("returns needs-install on iOS Safari that is not installed", () => {
    // Node 環境では standalone 判定は false なので、iOS は needs-install になる。
    expect(detectPushStatus({ userAgent: UA.iphoneSafari }).support).toBe("needs-install");
  });

  it("returns unsupported when push APIs are absent (non-iOS, no window)", () => {
    expect(detectPushStatus({ userAgent: UA.androidChrome }).support).toBe("unsupported");
  });
});

describe("createPushGuide", () => {
  it("provides device-specific re-enable steps", () => {
    const guide = createPushGuide({ userAgent: UA.androidChrome });
    expect(guide.getReenableSteps().length).toBeGreaterThan(0);
  });
});

describe("Brave", () => {
  it("reports isBrave from the override", () => {
    expect(detectPushStatus({ userAgent: UA.androidChrome, isBrave: true }).isBrave).toBe(true);
    expect(detectPushStatus({ userAgent: UA.androidChrome, isBrave: false }).isBrave).toBe(false);
  });

  it("detects Brave from navigator.brave", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", {
      value: { userAgent: UA.androidChrome, brave: { isBrave: () => Promise.resolve(true) } },
      configurable: true,
    });
    try {
      expect(detectPushStatus().isBrave).toBe(true);
    } finally {
      if (original) Object.defineProperty(globalThis, "navigator", original);
    }
  });

  it("provides steps to enable the push service", () => {
    const steps = createPushGuide({ isBrave: true }).getBravePushSteps();
    expect(steps.some((s) => s.text.includes("brave://settings/privacy"))).toBe(true);
  });

  it("recognizes AbortError from subscribe() as a push service error", () => {
    const guide = createPushGuide({ isBrave: true });
    const abort = new DOMException("Registration failed - push service error", "AbortError");
    expect(guide.isPushServiceError(abort)).toBe(true);
    expect(guide.isPushServiceError(new DOMException("denied", "NotAllowedError"))).toBe(false);
    expect(guide.isPushServiceError(undefined)).toBe(false);
  });
});
