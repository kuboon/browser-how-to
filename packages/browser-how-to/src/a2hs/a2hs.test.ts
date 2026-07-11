import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectDevice } from "../core/index.js";
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

class FakeStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("createA2hs installed persistence", () => {
  let originalLocalStorage: PropertyDescriptor | undefined;
  let originalNavigator: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "localStorage", {
      value: new FakeStorage(),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.resetModules();
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    } else {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    }
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    }
  });

  it("localStorage に installed フラグがあれば、モジュール再読込後も installed 扱いになる", async () => {
    vi.resetModules();
    const { createA2hs: freshCreateA2hs } = await import("./controller.js");
    expect(freshCreateA2hs({ userAgent: UA.androidChrome }).getStatus().support).not.toBe(
      "installed",
    );

    // appinstalled イベント発火 (= 別タブでのインストール完了) を模した永続化。
    localStorage.setItem("bht:a2hs:installed", "1");

    vi.resetModules();
    const { createA2hs: reloadedCreateA2hs } = await import("./controller.js");
    expect(reloadedCreateA2hs({ userAgent: UA.androidChrome }).getStatus().support).toBe(
      "installed",
    );
  });

  it("refreshInstallState が getInstalledRelatedApps() で確認できれば installed に更新して永続化する", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { getInstalledRelatedApps: async () => [{ platform: "webapp" }] },
      configurable: true,
    });

    vi.resetModules();
    const { createA2hs: freshCreateA2hs } = await import("./controller.js");
    const a2hs = freshCreateA2hs({ userAgent: UA.androidChrome });

    expect(a2hs.getStatus().support).not.toBe("installed");
    const status = await a2hs.refreshInstallState();
    expect(status.support).toBe("installed");
    expect(localStorage.getItem("bht:a2hs:installed")).toBe("1");
  });

  it("refreshInstallState は getInstalledRelatedApps() が空なら installed にしない", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { getInstalledRelatedApps: async () => [] },
      configurable: true,
    });

    vi.resetModules();
    const { createA2hs: freshCreateA2hs } = await import("./controller.js");
    const a2hs = freshCreateA2hs({ userAgent: UA.androidChrome });

    const status = await a2hs.refreshInstallState();
    expect(status.support).not.toBe("installed");
    expect(localStorage.getItem("bht:a2hs:installed")).toBeNull();
  });
});
