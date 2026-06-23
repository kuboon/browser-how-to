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
