import { afterEach, describe, expect, it, vi } from "vitest";
import { createPasskeyGuide } from "./controller.js";
import { detectPasskeyCapabilities } from "./detect.js";
import { explain } from "./explain.js";
import { detectDevice } from "@browser-how-to/shared";

const UA = {
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  messengerIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/450.0]",
};

afterEach(() => {
  delete (globalThis as Record<string, unknown>).PublicKeyCredential;
  vi.restoreAllMocks();
});

describe("detectPasskeyCapabilities", () => {
  it("returns all-false when WebAuthn is missing", async () => {
    const caps = await detectPasskeyCapabilities();
    expect(caps.webauthnSupported).toBe(false);
  });

  it("uses getClientCapabilities when available", async () => {
    (globalThis as Record<string, unknown>).PublicKeyCredential = {
      getClientCapabilities: async () => ({
        userVerifyingPlatformAuthenticator: true,
        conditionalGet: true,
        hybridTransport: true,
        relatedOrigins: true,
      }),
    };
    const caps = await detectPasskeyCapabilities();
    expect(caps.usedClientCapabilities).toBe(true);
    expect(caps.platformAuthenticatorAvailable).toBe(true);
    expect(caps.crossDeviceSupported).toBe(true);
  });

  it("falls back to isUVPAA when getClientCapabilities is absent", async () => {
    (globalThis as Record<string, unknown>).PublicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: async () => false,
      isConditionalMediationAvailable: async () => true,
    };
    const caps = await detectPasskeyCapabilities();
    expect(caps.usedClientCapabilities).toBe(false);
    expect(caps.platformAuthenticatorAvailable).toBe(false);
    expect(caps.conditionalMediationAvailable).toBe(true);
  });
});

describe("createPasskeyGuide", () => {
  it("reports in-app-blocked inside Messenger", async () => {
    (globalThis as Record<string, unknown>).PublicKeyCredential = {
      getClientCapabilities: async () => ({ userVerifyingPlatformAuthenticator: true }),
    };
    const guide = createPasskeyGuide({ userAgent: UA.messengerIos });
    const status = await guide.detect();
    expect(status.support).toBe("in-app-blocked");
  });

  it("reports full when platform authenticator is available", async () => {
    (globalThis as Record<string, unknown>).PublicKeyCredential = {
      getClientCapabilities: async () => ({ userVerifyingPlatformAuthenticator: true }),
    };
    const guide = createPasskeyGuide({ userAgent: UA.androidChrome });
    const status = await guide.detect();
    expect(status.support).toBe("full");
  });

  it("reports unsupported without WebAuthn", async () => {
    const guide = createPasskeyGuide({ userAgent: UA.androidChrome });
    const status = await guide.detect();
    expect(status.support).toBe("unsupported");
  });
});

describe("explain", () => {
  it("names Google Password Manager on Android", () => {
    const content = explain("where-saved", detectDevice(UA.androidChrome));
    expect(content.body.join("")).toContain("Google パスワードマネージャー");
  });
  it("provides cross-device steps", () => {
    const content = explain("cross-device", detectDevice(UA.androidChrome));
    expect(content.steps && content.steps.length).toBeGreaterThan(0);
  });
});
