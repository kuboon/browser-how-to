import { describe, expect, it } from "vitest";
import { detectDevice } from "@browser-how-to/shared";
import { buildInstructions } from "./instructions.js";
import { createA2hs } from "./controller.js";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  messengerIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/450.0]",
};

describe("buildInstructions", () => {
  it("iOS Safari -> share sheet steps", () => {
    const ins = buildInstructions(detectDevice(UA.iphoneSafari));
    expect(ins.title).toContain("Safari");
    expect(ins.steps.some((s) => s.text.includes("ホーム画面に追加"))).toBe(true);
  });

  it("iOS Chrome -> tells user to reopen in Safari", () => {
    const ins = buildInstructions(detectDevice(UA.iphoneChrome));
    expect(ins.title).toContain("Safari");
  });

  it("Android Chrome -> menu steps", () => {
    const ins = buildInstructions(detectDevice(UA.androidChrome));
    expect(ins.title).toContain("Chrome");
  });

  it("Messenger in-app -> escape guidance", () => {
    const ins = buildInstructions(detectDevice(UA.messengerIos));
    expect(ins.title).toContain("Messenger");
    expect(ins.steps.length).toBeGreaterThan(0);
  });
});

describe("createA2hs", () => {
  it("reports in-app-blocked inside Messenger", () => {
    const a2hs = createA2hs({ userAgent: UA.messengerIos });
    expect(a2hs.getStatus().support).toBe("in-app-blocked");
  });

  it("reports manual on iOS Safari", () => {
    const a2hs = createA2hs({ userAgent: UA.iphoneSafari });
    expect(a2hs.getStatus().support).toBe("manual");
  });

  it("promptInstall returns unavailable without a captured event", async () => {
    const a2hs = createA2hs({ userAgent: UA.androidChrome });
    expect(await a2hs.promptInstall()).toBe("unavailable");
  });
});
